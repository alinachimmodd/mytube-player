export interface YouTubeSearchParams {
  query: string;
  pageToken?: string;
  maxResults?: number;
  videoDuration?: 'any' | 'short' | 'medium' | 'long';
  order?: 'relevance' | 'date' | 'viewCount' | 'rating';
}

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration: number; // seconds
  publishedAt: string;
}

export interface YouTubeSearchResponse {
  results: YouTubeSearchResult[];
  nextPageToken?: string;
  totalResults: number;
}

// Raw YouTube Data API v3 types
export interface YTSearchListResponse {
  kind: string;
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YTSearchItem[];
}

export interface YTSearchItem {
  id: {
    kind: string;
    videoId: string;
  };
  snippet: {
    publishedAt: string;
    title: string;
    description: string;
    channelTitle: string;
    thumbnails: {
      default: YTThumbnail;
      medium: YTThumbnail;
      high: YTThumbnail;
    };
  };
}

export interface YTThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YTVideoListResponse {
  items: YTVideoItem[];
}

export interface YTVideoItem {
  id: string;
  contentDetails: {
    duration: string; // ISO 8601 duration, e.g., "PT4M33S"
  };
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      default: YTThumbnail;
      medium: YTThumbnail;
      high: YTThumbnail;
      standard?: YTThumbnail;
      maxres?: YTThumbnail;
    };
  };
}

// YouTube IFrame Player API types
export interface YTPlayerEvent {
  data: number;
  target: YTPlayerInstance;
}

export interface YTPlayerInstance {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  setVolume(volume: number): void;
  getVolume(): number;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  loadVideoById(videoId: string, startSeconds?: number): void;
  cueVideoById(videoId: string, startSeconds?: number): void;
  destroy(): void;
}

// YT Player state constants
export const YT_PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;
