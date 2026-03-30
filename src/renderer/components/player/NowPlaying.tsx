import React from 'react';
import { usePlayerStore } from '../../stores/player-store';
import { truncate } from '@shared/utils';

export function NowPlaying() {
  const { currentTrack } = usePlayerStore();

  if (!currentTrack) {
    return (
      <div className="flex items-center gap-3 w-[280px] shrink-0">
        <div className="w-12 h-12 rounded-md bg-surface-800 flex items-center justify-center">
          <span className="text-surface-600 text-lg">🎵</span>
        </div>
        <div>
          <p className="text-sm text-surface-500">No track playing</p>
          <p className="text-xs text-surface-600">Search for music to start</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 w-[280px] shrink-0">
      <img
        src={currentTrack.thumbnailUrl}
        alt=""
        className="w-12 h-12 rounded-md object-cover shrink-0"
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-white truncate" title={currentTrack.title}>
          {truncate(currentTrack.title, 35)}
        </p>
        <p className="text-xs text-surface-400 truncate" title={currentTrack.artist}>
          {currentTrack.artist}
        </p>
      </div>
    </div>
  );
}
