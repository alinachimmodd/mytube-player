import React, { useState } from 'react';
import { useLibraryStore } from '../../stores/library-store';
import { usePlayerStore } from '../../stores/player-store';
import { getPlayerController } from '../../App';
import { formatDuration } from '@shared/utils';
import { PromptModal } from '../shared/PromptModal';
import type { Track } from '@shared/types/track';

interface PlaylistViewProps {
  playlistId: string;
}

export function PlaylistView({ playlistId }: PlaylistViewProps) {
  const { playlists, removeTrackFromPlaylist, deletePlaylist, renamePlaylist } =
    useLibraryStore();
  const { setCurrentTrack, setState, setQueue, currentTrack, state } =
    usePlayerStore();

  const playlist = playlists.find((p) => p.id === playlistId);

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-sm text-surface-400">Playlist not found</p>
      </div>
    );
  }

  const handlePlayAll = () => {
    if (playlist.tracks.length === 0 || !getPlayerController()) return;
    setQueue(playlist.tracks, 0);
    setCurrentTrack(playlist.tracks[0]);
    setState('loading');
    getPlayerController()!.load(playlist.tracks[0].id);
  };

  const handlePlayTrack = (track: Track, index: number) => {
    if (!getPlayerController()) return;
    setQueue(playlist.tracks, index);
    setCurrentTrack(track);
    setState('loading');
    getPlayerController()!.load(track.id);
  };

  const [showRename, setShowRename] = useState(false);

  const handleRenameConfirm = (name: string) => {
    renamePlaylist(playlistId, name);
    setShowRename(false);
  };

  return (
    <div>
      {/* Playlist header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-lg bg-surface-800 flex items-center justify-center text-3xl shrink-0">
          🎶
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white truncate">{playlist.name}</h2>
          <p className="text-sm text-surface-400">
            {playlist.tracks.length} {playlist.tracks.length === 1 ? 'song' : 'songs'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {playlist.tracks.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2 px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play All
            </button>
          )}
          <button
            onClick={() => setShowRename(true)}
            className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-lg transition-colors"
            title="Rename"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Track list */}
      {playlist.tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <p className="text-sm text-surface-400 mb-1">This playlist is empty</p>
          <p className="text-xs text-surface-500">
            Search for songs and use the 3-dot menu to add them here
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {playlist.tracks.map((track, index) => {
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
                  {/* Index / playing indicator */}
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

                  {/* Thumbnail */}
                  <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0 bg-surface-800">
                    <img
                      src={track.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Track info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? 'text-accent-300' : 'text-white'}`}>
                      {track.title}
                    </p>
                    <p className="text-xs text-surface-400 truncate">{track.artist}</p>
                  </div>
                </button>

                {/* Duration */}
                <span className="text-xs text-surface-500 tabular-nums shrink-0">
                  {track.duration ? formatDuration(track.duration) : '--:--'}
                </span>

                {/* Remove button */}
                <button
                  onClick={() => removeTrackFromPlaylist(playlistId, track.id)}
                  className="p-1 rounded-md text-surface-500 hover:text-red-400 hover:bg-surface-700 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  title="Remove from playlist"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showRename && (
        <PromptModal
          title="Rename Playlist"
          placeholder={playlist.name}
          onConfirm={handleRenameConfirm}
          onCancel={() => setShowRename(false)}
        />
      )}
    </div>
  );
}
