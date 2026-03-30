import React, { useState } from 'react';
import { SIDEBAR_WIDTH } from '@shared/constants';
import { useLibraryStore } from '../../stores/library-store';
import { PromptModal } from '../shared/PromptModal';
import { ConfirmModal } from '../shared/ConfirmModal';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const navItems = [
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'favorites', label: 'Favorites', icon: '❤️' },
  { id: 'history', label: 'History', icon: '🕐' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { playlists, createPlaylist, deletePlaylist, movePlaylist } = useLibraryStore();
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleNewPlaylist = (name: string) => {
    const playlist = createPlaylist(name);
    onViewChange(`playlist:${playlist.id}`);
    setShowNewPlaylist(false);
  };

  return (
    <aside
      className="flex flex-col bg-surface-900 border-r border-surface-800/50 shrink-0"
      style={{ width: SIDEBAR_WIDTH }}
    >
      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        <div className="px-3 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-500">
            Menu
          </span>
        </div>
        {navItems.map((item) => (
          <button
            key={item.id}
            data-view={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
              activeView === item.id
                ? 'bg-accent-600/20 text-accent-300 border-r-2 border-accent-500'
                : 'text-surface-300 hover:bg-surface-800 hover:text-white'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}

        {/* Playlists section */}
        <div className="mt-6 px-3 mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-500">
            Playlists
          </span>
          <button
            onClick={() => setShowNewPlaylist(true)}
            className="text-surface-500 hover:text-white transition-colors"
            title="New playlist"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        {playlists.length === 0 ? (
          <div className="px-4 py-3">
            <p className="text-xs text-surface-500 italic">
              No playlists yet
            </p>
          </div>
        ) : (
          playlists.map((playlist, index) => (
            <div
              key={playlist.id}
              className={`group flex items-center text-sm transition-colors ${
                activeView === `playlist:${playlist.id}`
                  ? 'bg-accent-600/20 text-accent-300 border-r-2 border-accent-500'
                  : 'text-surface-300 hover:bg-surface-800 hover:text-white'
              }`}
            >
              <button
                onClick={() => onViewChange(`playlist:${playlist.id}`)}
                className="flex items-center gap-3 px-4 py-2 flex-1 min-w-0"
              >
                <span className="text-base">🎶</span>
                <span className="truncate">{playlist.name}</span>
                <span className="text-xs text-surface-500 ml-auto shrink-0">
                  {playlist.tracks.length}
                </span>
              </button>
              {/* Hover controls */}
              <div className="flex items-center gap-0.5 pr-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {index > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); movePlaylist(playlist.id, 'up'); }}
                    className="p-0.5 text-surface-500 hover:text-white rounded"
                    title="Move up"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                )}
                {index < playlists.length - 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); movePlaylist(playlist.id, 'down'); }}
                    className="p-0.5 text-surface-500 hover:text-white rounded"
                    title="Move down"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget({ id: playlist.id, name: playlist.name });
                  }}
                  className="p-0.5 text-surface-500 hover:text-red-400 rounded"
                  title="Delete playlist"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </nav>

      {showNewPlaylist && (
        <PromptModal
          title="New Playlist"
          placeholder="Playlist name"
          onConfirm={handleNewPlaylist}
          onCancel={() => setShowNewPlaylist(false)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Playlist"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => {
            deletePlaylist(deleteTarget.id);
            if (activeView === `playlist:${deleteTarget.id}`) {
              onViewChange('search');
            }
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </aside>
  );
}
