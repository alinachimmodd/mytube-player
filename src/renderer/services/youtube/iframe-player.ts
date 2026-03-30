import { YT_PLAYER_STATE, YTPlayerInstance, YTPlayerEvent } from './types';
import { PlayerState } from '@shared/types/player';
import { YT_PLAYER_MIN_SIZE } from '@shared/constants';

type PlayerEventHandler = () => void;
type PlayerEvent = 'stateChange' | 'error' | 'ready' | 'timeUpdate';

// Extend window for YouTube IFrame API
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: Record<string, unknown>
      ) => YTPlayerInstance;
      PlayerState: typeof YT_PLAYER_STATE;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

/**
 * Wraps the YouTube IFrame Player API with a clean interface.
 * Handles API loading, player creation, state mapping, and event management.
 */
export class IFramePlayerController {
  private player: YTPlayerInstance | null = null;
  private isReady = false;
  private pendingVideoId: string | null = null;
  private listeners = new Map<PlayerEvent, Set<PlayerEventHandler>>();
  private timeUpdateInterval: ReturnType<typeof setInterval> | null = null;
  private containerId: string;

  constructor(containerId: string) {
    this.containerId = containerId;
    this.listeners.set('stateChange', new Set());
    this.listeners.set('error', new Set());
    this.listeners.set('ready', new Set());
    this.listeners.set('timeUpdate', new Set());
  }

  /**
   * Initialize the YouTube IFrame Player API and create the player
   */
  async init(): Promise<void> {
    // Load the IFrame API script if not already loaded
    if (!window.YT) {
      await this.loadYouTubeApi();
    } else {
      this.createPlayer();
    }
  }

  private loadYouTubeApi(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Set the callback before loading the script
      window.onYouTubeIframeAPIReady = () => {
        this.createPlayer();
        resolve();
      };

      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = () => reject(new Error('Failed to load YouTube IFrame API'));
      document.head.appendChild(script);
    });
  }

  private createPlayer(): void {
    this.player = new window.YT.Player(this.containerId, {
      width: YT_PLAYER_MIN_SIZE,
      height: YT_PLAYER_MIN_SIZE,
      playerVars: {
        autoplay: 0,
        controls: 0, // We provide our own controls
        disablekb: 1,
        enablejsapi: 1,
        iv_load_policy: 3, // No annotations
        modestbranding: 1,
        rel: 0, // No related videos
        origin: window.location.origin,
      },
      events: {
        onReady: () => this.onPlayerReady(),
        onStateChange: (event: YTPlayerEvent) => this.onStateChange(event),
        onError: (event: YTPlayerEvent) => this.onError(event),
      },
    } as Record<string, unknown>);
  }

  private onPlayerReady(): void {
    console.log('[YT Player] Ready!');
    this.isReady = true;
    this.emit('ready');

    // If a video was queued before the player was ready, load it now
    if (this.pendingVideoId) {
      this.load(this.pendingVideoId);
      this.pendingVideoId = null;
    }

    // Start time update polling
    this.startTimeUpdates();
  }

  private onStateChange(event: YTPlayerEvent): void {
    this.emit('stateChange');

    // Start/stop time updates based on playback state
    if (event.data === YT_PLAYER_STATE.PLAYING) {
      this.startTimeUpdates();
    } else if (
      event.data === YT_PLAYER_STATE.PAUSED ||
      event.data === YT_PLAYER_STATE.ENDED
    ) {
      this.stopTimeUpdates();
    }
  }

  private onError(event: YTPlayerEvent): void {
    console.error('[YT Player] Error code:', event.data);
    this.emit('error');
  }

  private startTimeUpdates(): void {
    this.stopTimeUpdates();
    // Poll current time at ~4fps (smooth enough for progress bar)
    this.timeUpdateInterval = setInterval(() => {
      if (this.player && this.isReady) {
        this.emit('timeUpdate');
      }
    }, 250);
  }

  private stopTimeUpdates(): void {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  // --- Public API ---

  load(videoId: string): void {
    console.log('[YT Player] load() called. isReady:', this.isReady, 'player:', !!this.player);
    if (!this.isReady || !this.player) {
      console.log('[YT Player] Not ready, queuing videoId:', videoId);
      this.pendingVideoId = videoId;
      return;
    }
    console.log('[YT Player] Loading videoId:', videoId);
    this.player.loadVideoById(videoId);
  }

  play(): void {
    this.player?.playVideo();
  }

  pause(): void {
    this.player?.pauseVideo();
  }

  stop(): void {
    this.player?.stopVideo();
    this.stopTimeUpdates();
  }

  seekTo(seconds: number): void {
    this.player?.seekTo(seconds, true);
  }

  setVolume(percent: number): void {
    this.player?.setVolume(Math.max(0, Math.min(100, percent)));
  }

  getVolume(): number {
    return this.player?.getVolume() ?? 50;
  }

  mute(): void {
    this.player?.mute();
  }

  unmute(): void {
    this.player?.unMute();
  }

  isMuted(): boolean {
    return this.player?.isMuted() ?? false;
  }

  getCurrentTime(): number {
    return this.player?.getCurrentTime() ?? 0;
  }

  getDuration(): number {
    return this.player?.getDuration() ?? 0;
  }

  getState(): PlayerState {
    if (!this.player || !this.isReady) return 'idle';

    const state = this.player.getPlayerState();
    switch (state) {
      case YT_PLAYER_STATE.UNSTARTED:
        return 'idle';
      case YT_PLAYER_STATE.PLAYING:
        return 'playing';
      case YT_PLAYER_STATE.PAUSED:
        return 'paused';
      case YT_PLAYER_STATE.BUFFERING:
        return 'buffering';
      case YT_PLAYER_STATE.ENDED:
        return 'ended';
      case YT_PLAYER_STATE.CUED:
        return 'loading';
      default:
        return 'idle';
    }
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

  // --- Cleanup ---

  destroy(): void {
    this.stopTimeUpdates();
    this.player?.destroy();
    this.player = null;
    this.isReady = false;
    this.listeners.forEach((set) => set.clear());
  }
}
