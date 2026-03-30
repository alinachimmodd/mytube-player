import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AudioQuality = 'best' | 'medium' | 'low';
export type CookiesBrowser = '' | 'chrome' | 'firefox' | 'edge' | 'opera' | 'brave' | 'vivaldi' | 'chromium' | 'safari';

interface SettingsStore {
  // API
  youtubeApiKey: string;

  // Playback
  audioQuality: AudioQuality;
  autoPlay: boolean; // auto-play next in queue
  cookiesBrowser: CookiesBrowser; // pass browser cookies to yt-dlp for age-restricted content

  // Search
  searchResultsCount: number;
  musicOnly: boolean; // restrict to music category

  // History
  historyEnabled: boolean;
  historyLimit: number;

  // Actions
  setYoutubeApiKey: (key: string) => void;
  setAudioQuality: (quality: AudioQuality) => void;
  setAutoPlay: (enabled: boolean) => void;
  setCookiesBrowser: (browser: CookiesBrowser) => void;
  setSearchResultsCount: (count: number) => void;
  setMusicOnly: (enabled: boolean) => void;
  setHistoryEnabled: (enabled: boolean) => void;
  setHistoryLimit: (limit: number) => void;
  resetToDefaults: () => void;
}

const DEFAULTS = {
  youtubeApiKey: '',
  audioQuality: 'best' as AudioQuality,
  autoPlay: true,
  cookiesBrowser: '' as CookiesBrowser,
  searchResultsCount: 20,
  musicOnly: true,
  historyEnabled: true,
  historyLimit: 50,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      setYoutubeApiKey: (key) => set({ youtubeApiKey: key }),
      setAudioQuality: (quality) => set({ audioQuality: quality }),
      setAutoPlay: (enabled) => set({ autoPlay: enabled }),
      setCookiesBrowser: (browser) => set({ cookiesBrowser: browser }),
      setSearchResultsCount: (count) => set({ searchResultsCount: count }),
      setMusicOnly: (enabled) => set({ musicOnly: enabled }),
      setHistoryEnabled: (enabled) => set({ historyEnabled: enabled }),
      setHistoryLimit: (limit) => set({ historyLimit: limit }),
      resetToDefaults: () => set(DEFAULTS),
    }),
    { name: 'mytube-settings' }
  )
);
