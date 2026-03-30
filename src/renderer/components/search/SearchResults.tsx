import React, { useCallback, useRef, useState } from 'react';
import { usePlayerStore } from '../../stores/player-store';
import { useLibraryStore } from '../../stores/library-store';
import { useSettingsStore } from '../../stores/settings-store';
import { getPlayerController } from '../../App';
import { formatDuration } from '@shared/utils';
import { ContextMenu, type MenuAction } from '../shared/ContextMenu';
import { PromptModal } from '../shared/PromptModal';
import type { YouTubeSearchResult } from '../../services/youtube/types';
import type { Track } from '@shared/types/track';

function hasApiKey(): boolean {
  const storeKey = useSettingsStore.getState().youtubeApiKey;
  if (storeKey) return true;
  const envKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  return !!(envKey && envKey !== 'YOUR_API_KEY_HERE');
}

export function SearchResults() {
  const { searchResults, searchQuery, searchLoading, currentTrack, state } =
    usePlayerStore();
  const apiKey = useSettingsStore((s) => s.youtubeApiKey);

  // Show setup banner when no API key is configured
  if (!hasApiKey()) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="bg-surface-800/80 border border-amber-500/30 rounded-xl p-8 max-w-lg">
          <div className="text-4xl mb-4">&#x1F511;</div>
          <h2 className="text-xl font-semibold text-surface-200 mb-3">
            YouTube API Key Required
          </h2>
          <p className="text-sm text-surface-400 mb-2">
            MyTube Player needs a YouTube Data API key to search for music.
          </p>
          <p className="text-sm text-surface-500 mb-6">
            You can get a free API key from the{' '}
            <span className="text-accent-400">Google Cloud Console</span>{' '}
            by enabling the YouTube Data API v3.
          </p>
          <button
            onClick={() => {
              document.querySelector<HTMLButtonElement>('[data-view="settings"]')?.click();
            }}
            className="px-5 py-2.5 bg-accent-600 hover:bg-accent-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Open Settings
          </button>
        </div>
      </div>
    );
  }

  if (!searchQuery && searchResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-5xl mb-4">&#x1F3B5;</div>
        <h2 className="text-xl font-semibold text-surface-300 mb-2">
          Search for music
        </h2>
        <p className="text-sm text-surface-500 max-w-md">
          Search YouTube for your favorite songs. Type in the search bar above
          to get started.
        </p>
      </div>
    );
  }

  if (searchLoading && searchResults.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!searchLoading && searchResults.length === 0 && searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-4xl mb-3">😕</div>
        <p className="text-sm text-surface-400">
          No results found for &quot;{searchQuery}&quot;
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-surface-500 mb-3">
        {searchResults.length} results for &quot;{searchQuery}&quot;
      </p>
      <div className="space-y-1">
        {searchResults.map((result) => (
          <SearchResultRow
            key={result.videoId}
            result={result}
            isPlaying={
              currentTrack?.id === result.videoId &&
              (state === 'playing' || state === 'buffering')
            }
            isActive={currentTrack?.id === result.videoId}
          />
        ))}
      </div>
    </div>
  );
}

function resultToTrack(result: YouTubeSearchResult): Track {
  return {
    id: result.videoId,
    title: result.title,
    artist: result.channelTitle,
    thumbnailUrl: result.thumbnailUrl,
    duration: result.duration,
    isFavorite: false,
    playCount: 0,
  };
}

interface SearchResultRowProps {
  result: YouTubeSearchResult;
  isPlaying: boolean;
  isActive: boolean;
}

function SearchResultRow({ result, isPlaying, isActive }: SearchResultRowProps) {
  const { setCurrentTrack, setState, setQueue, searchResults } =
    usePlayerStore();
  const { playlists, createPlaylist, addTrackToPlaylist, toggleFavorite, isFavorite } = useLibraryStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const handlePlay = () => {
    console.log('[Play] getPlayerController():', !!getPlayerController());
    if (!getPlayerController()) {
      console.error('[Play] getPlayerController() is null!');
      return;
    }

    const track = resultToTrack(result);
    const tracks = searchResults.map(resultToTrack);
    const index = searchResults.findIndex((r) => r.videoId === result.videoId);
    setQueue(tracks, index);

    setCurrentTrack(track);
    setState('loading');
    console.log('[Play] Loading videoId:', result.videoId);
    getPlayerController()!.load(result.videoId);
  };

  const handleAddToPlaylist = useCallback(
    (playlistId: string) => {
      addTrackToPlaylist(playlistId, resultToTrack(result));
    },
    [result, addTrackToPlaylist]
  );

  const handleNewPlaylist = useCallback(() => {
    setMenuOpen(false);
    setShowNewPlaylist(true);
  }, []);

  const handleNewPlaylistConfirm = useCallback((name: string) => {
    const playlist = createPlaylist(name);
    addTrackToPlaylist(playlist.id, resultToTrack(result));
    setShowNewPlaylist(false);
  }, [result, createPlaylist, addTrackToPlaylist]);

  const trackIsFavorite = isFavorite(result.videoId);

  const menuActions: MenuAction[] = [
    {
      label: trackIsFavorite ? 'Remove from Favorites' : 'Add to Favorites',
      icon: (
        <svg fill={trackIsFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      onClick: () => toggleFavorite(resultToTrack(result)),
    },
    {
      label: 'Add to Playlist',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      ),
      submenu: [
        ...playlists.map((p) => ({
          label: p.name,
          onClick: () => handleAddToPlaylist(p.id),
        })),
        {
          label: '+ New Playlist',
          onClick: handleNewPlaylist,
        },
      ],
    },
  ];

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors group ${
        isActive
          ? 'bg-accent-600/20 border border-accent-600/30'
          : 'hover:bg-surface-800/60 border border-transparent'
      }`}
    >
      {/* Clickable area for playing */}
      <button onClick={handlePlay} className="flex items-center gap-3 flex-1 min-w-0">
        {/* Thumbnail */}
        <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0 bg-surface-800">
          <img
            src={result.thumbnailUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex gap-0.5">
                <div className="w-0.5 h-3 bg-accent-400 animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="w-0.5 h-3 bg-accent-400 animate-pulse" style={{ animationDelay: '150ms' }} />
                <div className="w-0.5 h-3 bg-accent-400 animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          {!isPlaying && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
              <svg
                className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium truncate ${
              isActive ? 'text-accent-300' : 'text-white'
            }`}
          >
            {result.title}
          </p>
          <p className="text-xs text-surface-400 truncate">
            {result.channelTitle}
          </p>
        </div>
      </button>

      {/* Duration */}
      <span className="text-xs text-surface-500 tabular-nums shrink-0">
        {result.duration ? formatDuration(result.duration) : '--:--'}
      </span>

      {/* 3-dot menu button */}
      <button
        ref={menuBtnRef}
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen(!menuOpen);
        }}
        className="p-1 rounded-md text-surface-500 hover:text-white hover:bg-surface-700 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {/* Context menu */}
      {menuOpen && (
        <ContextMenu
          actions={menuActions}
          onClose={() => setMenuOpen(false)}
          anchorEl={menuBtnRef.current}
        />
      )}

      {/* New playlist modal */}
      {showNewPlaylist && (
        <PromptModal
          title="New Playlist"
          placeholder="Playlist name"
          onConfirm={handleNewPlaylistConfirm}
          onCancel={() => setShowNewPlaylist(false)}
        />
      )}
    </div>
  );
}
