import { create } from 'zustand';
import type { Track } from '@shared/types/track';
import type { PlayerState, RepeatMode } from '@shared/types/player';
import type { YouTubeSearchResult } from '../services/youtube/types';

interface PlayerStore {
  // Playback state
  state: PlayerState;
  currentTrack: Track | null;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;

  // Queue
  queue: Track[];
  queueIndex: number;

  // Search
  searchResults: YouTubeSearchResult[];
  searchQuery: string;
  searchLoading: boolean;
  searchNextPageToken: string | null;

  // Actions — playback
  setState: (state: PlayerState) => void;
  setCurrentTrack: (track: Track | null) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;

  // Actions — queue
  setQueue: (tracks: Track[], startIndex?: number) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  setQueueIndex: (index: number) => void;
  nextInQueue: () => Track | null;
  previousInQueue: () => Track | null;

  // Actions — search
  setSearchResults: (results: YouTubeSearchResult[], nextPageToken?: string | null) => void;
  appendSearchResults: (results: YouTubeSearchResult[], nextPageToken?: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSearchLoading: (loading: boolean) => void;
  clearSearch: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  // Initial state
  state: 'idle',
  currentTrack: null,
  currentTime: 0,
  duration: 0,
  volume: 50,
  isMuted: false,
  repeatMode: 'none',
  isShuffled: false,

  queue: [],
  queueIndex: -1,

  searchResults: [],
  searchQuery: '',
  searchLoading: false,
  searchNextPageToken: null,

  // Playback actions
  setState: (state) => set({ state }),
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  setMuted: (muted) => set({ isMuted: muted }),
  setRepeatMode: (mode) => set({ repeatMode: mode }),
  toggleShuffle: () => set((s) => ({ isShuffled: !s.isShuffled })),

  // Queue actions
  setQueue: (tracks, startIndex = 0) =>
    set({ queue: tracks, queueIndex: startIndex }),

  addToQueue: (track) =>
    set((s) => ({ queue: [...s.queue, track] })),

  removeFromQueue: (index) =>
    set((s) => {
      const newQueue = [...s.queue];
      newQueue.splice(index, 1);
      const newIndex =
        index < s.queueIndex
          ? s.queueIndex - 1
          : index === s.queueIndex
            ? Math.min(s.queueIndex, newQueue.length - 1)
            : s.queueIndex;
      return { queue: newQueue, queueIndex: newIndex };
    }),

  setQueueIndex: (index) => set({ queueIndex: index }),

  nextInQueue: () => {
    const { queue, queueIndex, repeatMode, isShuffled } = get();
    if (queue.length === 0) return null;

    if (repeatMode === 'one') {
      // Repeat current track
      return queue[queueIndex] || null;
    }

    if (isShuffled) {
      // Pick a random track that isn't the current one
      if (queue.length <= 1) return queue[0] || null;
      let randomIndex: number;
      do {
        randomIndex = Math.floor(Math.random() * queue.length);
      } while (randomIndex === queueIndex);
      set({ queueIndex: randomIndex });
      return queue[randomIndex];
    }

    let nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        return null; // End of queue
      }
    }

    set({ queueIndex: nextIndex });
    return queue[nextIndex];
  },

  previousInQueue: () => {
    const { queue, queueIndex, isShuffled } = get();
    if (queue.length === 0) return null;

    if (isShuffled) {
      // In shuffle mode, pick random (there's no real "previous")
      if (queue.length <= 1) return queue[0] || null;
      let randomIndex: number;
      do {
        randomIndex = Math.floor(Math.random() * queue.length);
      } while (randomIndex === queueIndex);
      set({ queueIndex: randomIndex });
      return queue[randomIndex];
    }

    const prevIndex = Math.max(0, queueIndex - 1);
    set({ queueIndex: prevIndex });
    return queue[prevIndex];
  },

  // Search actions
  setSearchResults: (results, nextPageToken = null) =>
    set({ searchResults: results, searchNextPageToken: nextPageToken }),

  appendSearchResults: (results, nextPageToken = null) =>
    set((s) => ({
      searchResults: [...s.searchResults, ...results],
      searchNextPageToken: nextPageToken,
    })),

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchLoading: (loading) => set({ searchLoading: loading }),
  clearSearch: () =>
    set({
      searchResults: [],
      searchQuery: '',
      searchLoading: false,
      searchNextPageToken: null,
    }),
}));
