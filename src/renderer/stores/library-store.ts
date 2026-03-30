import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Playlist } from '@shared/types/playlist';
import type { Track } from '@shared/types/track';
import { useSettingsStore } from './settings-store';

interface HistoryEntry {
  track: Track;
  playedAt: string;
}

interface LibraryStore {
  playlists: Playlist[];
  favorites: Track[];
  history: HistoryEntry[];

  createPlaylist: (name: string) => Playlist;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  movePlaylist: (id: string, direction: 'up' | 'down') => void;
  toggleFavorite: (track: Track) => void;
  isFavorite: (trackId: string) => boolean;
  addToHistory: (track: Track) => void;
  clearHistory: () => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => ({
      playlists: [],
      favorites: [],
      history: [],

      createPlaylist: (name: string) => {
        const now = new Date().toISOString();
        const playlist: Playlist = {
          id: generateId(),
          name,
          tracks: [],
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ playlists: [...s.playlists, playlist] }));
        return playlist;
      },

      deletePlaylist: (id: string) => {
        set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) }));
      },

      renamePlaylist: (id: string, name: string) => {
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      addTrackToPlaylist: (playlistId: string, track: Track) => {
        set((s) => ({
          playlists: s.playlists.map((p) => {
            if (p.id !== playlistId) return p;
            // Don't add duplicates
            if (p.tracks.some((t) => t.id === track.id)) return p;
            return {
              ...p,
              tracks: [...p.tracks, track],
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      movePlaylist: (id: string, direction: 'up' | 'down') => {
        set((s) => {
          const idx = s.playlists.findIndex((p) => p.id === id);
          if (idx < 0) return s;
          const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
          if (swapIdx < 0 || swapIdx >= s.playlists.length) return s;
          const updated = [...s.playlists];
          [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
          return { playlists: updated };
        });
      },

      removeTrackFromPlaylist: (playlistId: string, trackId: string) => {
        set((s) => ({
          playlists: s.playlists.map((p) => {
            if (p.id !== playlistId) return p;
            return {
              ...p,
              tracks: p.tracks.filter((t) => t.id !== trackId),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      toggleFavorite: (track: Track) => {
        set((s) => {
          const exists = s.favorites.some((t) => t.id === track.id);
          return {
            favorites: exists
              ? s.favorites.filter((t) => t.id !== track.id)
              : [...s.favorites, { ...track, isFavorite: true }],
          };
        });
      },

      isFavorite: (trackId: string) => {
        return get().favorites.some((t) => t.id === trackId);
      },

      addToHistory: (track: Track) => {
        set((s) => {
          const entry: HistoryEntry = { track, playedAt: new Date().toISOString() };
          const limit = useSettingsStore.getState().historyLimit;
          return { history: [entry, ...s.history].slice(0, limit) };
        });
      },

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'mytube-library',
    }
  )
);
