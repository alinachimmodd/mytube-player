import type { PlayerState } from '@shared/types/player';

type PlayerEvent = 'stateChange' | 'error' | 'ready' | 'timeUpdate';
type PlayerEventHandler = () => void;

/**
 * HTML5 Audio-based player that uses direct stream URLs from ytdl-core.
 * Replaces the YouTube IFrame Player — can play ANY video, no embed restrictions.
 * Also provides direct audio access for Web Audio API visualizations.
 */
export class AudioPlayerController {
  private audio: HTMLAudioElement;
  private listeners = new Map<PlayerEvent, Set<PlayerEventHandler>>();
  private currentVideoId: string | null = null;
  private _state: PlayerState = 'idle';
  private timeUpdateInterval: ReturnType<typeof setInterval> | null = null;
  private loadingTimeout: ReturnType<typeof setTimeout> | null = null;
  private streamPort: number | null = null;
  private static LOADING_TIMEOUT_MS = 10_000; // 10s max wait for a song to start

  /** Exposed for Web Audio API — connect to AnalyserNode for visualizations */
  public readonly audioElement: HTMLAudioElement;

  constructor() {
    this.audio = new Audio();
    this.audioElement = this.audio;
    // Cache stream port on startup
    window.api.getStreamPort().then((port) => { this.streamPort = port; });
    this.audio.volume = 0.5;

    this.listeners.set('stateChange', new Set());
    this.listeners.set('error', new Set());
    this.listeners.set('ready', new Set());
    this.listeners.set('timeUpdate', new Set());

    this.setupAudioEvents();
  }

  private setupAudioEvents(): void {
    this.audio.addEventListener('playing', () => {
      this.clearLoadingTimeout();
      this._state = 'playing';
      this.emit('stateChange');
      this.startTimeUpdates();
    });

    this.audio.addEventListener('pause', () => {
      // Don't emit paused state if we're loading a new track
      if (this._state === 'loading') return;
      this._state = 'paused';
      this.emit('stateChange');
      this.stopTimeUpdates();
    });

    this.audio.addEventListener('ended', () => {
      this._state = 'ended';
      this.emit('stateChange');
      this.stopTimeUpdates();
    });

    this.audio.addEventListener('waiting', () => {
      this._state = 'buffering';
      this.emit('stateChange');
    });

    this.audio.addEventListener('canplay', () => {
      if (this._state === 'loading' || this._state === 'buffering') {
        this._state = 'playing';
        this.emit('stateChange');
      }
      this.emit('ready');
    });

    this.audio.addEventListener('error', (e) => {
      this.clearLoadingTimeout();
      console.error('[AudioPlayer] Error:', this.audio.error?.message || e);
      this._state = 'error';
      this.emit('error');
      this.emit('stateChange');
    });

    this.audio.addEventListener('stalled', () => {
      console.warn(`[AudioPlayer] Stalled loading for ${this.currentVideoId}`);
    });
  }

  private startLoadingTimeout(videoId: string): void {
    this.clearLoadingTimeout();
    this.loadingTimeout = setTimeout(() => {
      if (this.currentVideoId === videoId && (this._state === 'loading' || this._state === 'buffering')) {
        console.error(`[AudioPlayer] Loading timeout for ${videoId} after ${AudioPlayerController.LOADING_TIMEOUT_MS}ms`);
        this._state = 'error';
        this.emit('error');
        this.emit('stateChange');
      }
    }, AudioPlayerController.LOADING_TIMEOUT_MS);
  }

  private clearLoadingTimeout(): void {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }
  }

  private startTimeUpdates(): void {
    this.stopTimeUpdates();
    this.timeUpdateInterval = setInterval(() => {
      this.emit('timeUpdate');
    }, 250);
  }

  private stopTimeUpdates(): void {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  // --- Public API ---

  async load(videoId: string): Promise<void> {
    this.currentVideoId = videoId;

    // Stop current audio immediately so the old song doesn't keep playing
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.stopTimeUpdates();

    this._state = 'loading';
    this.emit('stateChange');
    this.startLoadingTimeout(videoId);

    try {
      // Fire-and-forget: tell main process to start resolving now
      window.api.prioritizeStream(videoId);

      // Set src to proxy URL immediately — the stream server will hold
      // the connection open while yt-dlp resolves, then start streaming.
      // This eliminates the IPC round-trip wait (~100ms saved) and lets
      // the audio element's native loading state handle the wait.
      if (!this.streamPort) {
        this.streamPort = await window.api.getStreamPort();
      }
      if (this.currentVideoId !== videoId) return;

      this.audio.src = `http://127.0.0.1:${this.streamPort}/stream/${videoId}`;
      this.audio.play().catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        if (this.currentVideoId !== videoId) return;
        console.error('[AudioPlayer] Failed to play:', err);
        this._state = 'error';
        this.emit('error');
        this.emit('stateChange');
      });
    } catch (err) {
      if (this.currentVideoId !== videoId) return;
      console.error('[AudioPlayer] Failed to load:', err);
      this._state = 'error';
      this.emit('error');
      this.emit('stateChange');
    }
  }

  /** Prefetch a video's stream URL in the background (call for upcoming tracks) */
  prefetch(videoId: string): void {
    window.api.prefetchStream(videoId);
  }

  play(): void {
    this.audio.play();
  }

  pause(): void {
    this.audio.pause();
  }

  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
    this._state = 'idle';
    this.emit('stateChange');
    this.stopTimeUpdates();
    this.clearLoadingTimeout();
  }

  seekTo(seconds: number): void {
    this.audio.currentTime = seconds;
  }

  setVolume(percent: number): void {
    this.audio.volume = Math.max(0, Math.min(1, percent / 100));
  }

  getVolume(): number {
    return Math.round(this.audio.volume * 100);
  }

  mute(): void {
    this.audio.muted = true;
  }

  unmute(): void {
    this.audio.muted = false;
  }

  isMuted(): boolean {
    return this.audio.muted;
  }

  getCurrentTime(): number {
    return this.audio.currentTime || 0;
  }

  getDuration(): number {
    return isFinite(this.audio.duration) ? this.audio.duration : 0;
  }

  getState(): PlayerState {
    return this._state;
  }

  getVideoId(): string | null {
    return this.currentVideoId;
  }

  // --- Event system ---

  on(event: PlayerEvent, handler: PlayerEventHandler): void {
    this.listeners.get(event)?.add(handler);
  }

  off(event: PlayerEvent, handler: PlayerEventHandler): void {
    this.listeners.get(event)?.delete(handler);
  }

  private emit(event: PlayerEvent): void {
    this.listeners.get(event)?.forEach((handler) => handler());
  }

  destroy(): void {
    this.stopTimeUpdates();
    this.clearLoadingTimeout();
    this.audio.pause();
    this.audio.src = '';
    this.listeners.forEach((set) => set.clear());
  }
}
