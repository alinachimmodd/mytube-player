import React from 'react';
import { useLibraryStore } from '../../stores/library-store';
import { usePlayerStore } from '../../stores/player-store';
import { getPlayerController } from '../../App';
import { formatDuration } from '@shared/utils';
import type { Track } from '@shared/types/track';

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function HistoryView() {
  const { history, clearHistory } = useLibraryStore();
  const { setCurrentTrack, setState, setQueue, currentTrack, state } =
    usePlayerStore();

  const handlePlayTrack = (track: Track, index: number) => {
    if (!getPlayerController()) return;
    const tracks = history.map((e) => e.track);
    setQueue(tracks, index);
    setCurrentTrack(track);
    setState('loading');
    getPlayerController()!.load(track.id);
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-5xl mb-4">&#128368;</div>
        <h2 className="text-xl font-semibold text-surface-300 mb-2">No history yet</h2>
        <p className="text-sm text-surface-500 max-w-md">
          Songs you play will appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-lg bg-surface-800 flex items-center justify-center text-3xl shrink-0">
          &#128368;
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white">History</h2>
          <p className="text-sm text-surface-400">
            Last {history.length} {history.length === 1 ? 'song' : 'songs'}
          </p>
        </div>
        <button
          onClick={clearHistory}
          className="px-3 py-1.5 text-sm text-surface-400 hover:text-white hover:bg-surface-800 rounded-lg transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="space-y-1">
        {history.map((entry, index) => {
          const { track, playedAt } = entry;
          const isActive = currentTrack?.id === track.id;
          const isPlaying =
            isActive && (state === 'playing' || state === 'buffering');

          return (
            <div
              key={`${track.id}-${playedAt}`}
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

              <span className="text-xs text-surface-500 shrink-0">
                {timeAgo(playedAt)}
              </span>

              <span className="text-xs text-surface-500 tabular-nums shrink-0">
                {track.duration ? formatDuration(track.duration) : '--:--'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
