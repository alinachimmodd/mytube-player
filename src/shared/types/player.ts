export type PlayerState =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'buffering'
  | 'ended'
  | 'error';

export type RepeatMode = 'none' | 'one' | 'all';

export interface PlaybackState {
  /** Current player state */
  state: PlayerState;
  /** Currently playing track ID */
  currentTrackId: string | null;
  /** Current playback position in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Volume level 0-100 */
  volume: number;
  /** Whether audio is muted */
  isMuted: boolean;
  /** Repeat mode */
  repeatMode: RepeatMode;
  /** Whether shuffle is enabled */
  isShuffled: boolean;
}

export type PlayerCommand =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'stop' }
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'seek'; seconds: number }
  | { type: 'volume'; level: number }
  | { type: 'mute' }
  | { type: 'unmute' }
  | { type: 'load'; videoId: string };
