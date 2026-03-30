import React from 'react';
import { useLibraryStore } from '../../stores/library-store';
import { usePlayerStore } from '../../stores/player-store';
import { getPlayerController } from '../../App';
import { formatDuration } from '@shared/utils';
import type { Track } from '@shared/types/track';

export function FavoritesView() {
  const { favorites, toggleFavorite } = useLibraryStore();
  const { setCurrentTrack, setState, setQueue, currentTrack, state } =
    usePlayerStore();

  const handlePlayAll = () => {
    if (favorites.length === 0 || !getPlayerController()) return;
    setQueue(favorites, 0);
    setCurrentTrack(favorites[0]);
    setState('loading');
    getPlayerController()!.load(favorites[0].id);
  };

  const handlePlayTrack = (track: Track, index: number) => {
    if (!getPlayerController()) return;
    setQueue(favorites, index);
    setCurrentTrack(track);
    setState('loading');
    getPlayerController()!.load(track.id);
  };

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-5xl mb-4">&#10084;&#65039;</div>
        <h2 className="text-xl font-semibold text-surface-300 mb-2">No favorites yet</h2>
        <p className="text-sm text-surface-500 max-w-md">
          Use the 3-dot menu on any song to add it to your favorites.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-lg bg-surface-800 flex items-center justify-center text-3xl shrink-0">
          &#10084;&#65039;
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white">Favorites</h2>
          <p className="text-sm text-surface-400">
            {favorites.length} {favorites.length === 1 ? 'song' : 'songs'}
          </p>
        </div>
        <button
          onClick={handlePlayAll}
          className="flex items-center gap-2 px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Play All
        </button>
      </div>

      <div className="space-y-1">
        {favorites.map((track, index) => {
          const isActive = currentTrack?.id === track.id;
          const isPlaying =
            isActive && (state === 'playing' || state === 'buffering');

          return (
            <div
              key={track.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${
                isActive
                  ? 'bg-accent-600/20 border border-accent-600/30'
                  : 'hover:bg-surface-800/60 border border-transparent'
              }`}
            >
              <button
                onClick={() => handlePlayTrack(track, index)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                <span className="w-6 text-center text-xs text-surface-500 shrink-0">
                  {isPlaying ? (
                    <span className="flex justify-center gap-0.5">
                      <span className="w-0.5 h-3 bg-accent-400 animate-pulse" style={{ animationDelay: '0ms' }} />
                      <span className="w-0.5 h-3 bg-accent-400 animate-pulse" style={{ animationDelay: '150ms' }} />
                      <span className="w-0.5 h-3 bg-accent-400 animate-pulse" style={{ animationDelay: '300ms' }} />
                    </span>
                  ) : (
                    index + 1
                  )}
                </span>

                <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0 bg-surface-800">
                  <img src={track.thumbnailUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isActive ? 'text-accent-300' : 'text-white'}`}>
                    {track.title}
                  </p>
                  <p className="text-xs text-surface-400 truncate">{track.artist}</p>
                </div>
              </button>

              <span className="text-xs text-surface-500 tabular-nums shrink-0">
                {track.duration ? formatDuration(track.duration) : '--:--'}
              </span>

              <button
                onClick={() => toggleFavorite(track)}
                className="p-1 rounded-md text-red-400 hover:text-red-300 hover:bg-surface-700 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                title="Remove from favorites"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
