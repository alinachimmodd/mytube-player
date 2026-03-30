export const IpcChannels = {
  // Database
  DB_QUERY: 'db:query',
  DB_MUTATE: 'db:mutate',

  // Stream resolution
  STREAM_RESOLVE: 'stream:resolve',
  STREAM_PORT: 'stream:port',
  STREAM_PREFETCH: 'stream:prefetch',
  STREAM_PREFETCH_BATCH: 'stream:prefetch-batch',
  STREAM_PRIORITIZE: 'stream:prioritize',
  STREAM_SET_QUALITY: 'stream:set-quality',
  STREAM_SET_COOKIES_BROWSER: 'stream:set-cookies-browser',

  // Audio capture
  AUDIO_START_CAPTURE: 'audio:start-capture',
  AUDIO_STOP_CAPTURE: 'audio:stop-capture',
  AUDIO_PCM_DATA: 'audio:pcm-data',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  // OAuth
  AUTH_START: 'auth:start-oauth',
  AUTH_TOKEN: 'auth:token-received',
  AUTH_LOGOUT: 'auth:logout',

  // Notifications (main → renderer)
  STREAM_ERROR: 'stream:error',

  // Logging
  LOG_OPEN: 'log:open',
  LOG_ERROR: 'log:error',

  // Window
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_TOGGLE_MINI: 'window:toggle-mini',

  // Media keys
  MEDIA_KEY_PRESSED: 'media:key-pressed',
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];
