/** YouTube Data API v3 music topic ID */
export const YOUTUBE_MUSIC_TOPIC_ID = '/m/04rlf';

/** YouTube music sub-genre topic IDs */
export const YOUTUBE_GENRE_TOPICS = {
  pop: '/m/064t9',
  rock: '/m/06j6l',
  jazz: '/m/03_d0',
  hiphop: '/m/0glt670',
  electronic: '/m/02lkt',
  classical: '/m/0ggq0m',
  rnb: '/m/02lkt',
  country: '/m/01lyv',
} as const;

/** Default search results per page */
export const DEFAULT_SEARCH_RESULTS = 20;

/** Search cache TTL in milliseconds (1 hour) */
export const SEARCH_CACHE_TTL = 60 * 60 * 1000;

/** App window dimensions */
export const WINDOW_CONFIG = {
  DEFAULT_WIDTH: 1280,
  DEFAULT_HEIGHT: 800,
  MIN_WIDTH: 900,
  MIN_HEIGHT: 600,
  MINI_WIDTH: 360,
  MINI_HEIGHT: 100,
} as const;

/** Sidebar width in pixels */
export const SIDEBAR_WIDTH = 240;

/** Player bar height in pixels */
export const PLAYER_BAR_HEIGHT = 80;

/** YouTube IFrame Player minimum size (ToS requirement) */
export const YT_PLAYER_MIN_SIZE = 200;

/** App name */
export const APP_NAME = 'MyTube Player';
