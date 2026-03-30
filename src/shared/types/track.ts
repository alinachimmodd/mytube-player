export interface Track {
  /** YouTube video ID */
  id: string;
  /** Track/video title */
  title: string;
  /** Channel name (used as artist) */
  artist: string;
  /** Thumbnail URL */
  thumbnailUrl: string;
  /** Duration in seconds */
  duration: number;
  /** Whether this track is in the user's favorites */
  isFavorite: boolean;
  /** ISO 8601 timestamp of last playback */
  lastPlayedAt?: string;
  /** Number of times this track has been played */
  playCount: number;
}

export interface TrackMetadata {
  id: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  duration: number;
  publishedAt?: string;
}
