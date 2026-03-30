import React, { useState } from 'react';
import { TitleBar } from './TitleBar';
import { Sidebar } from './Sidebar';
import { SearchBar } from '../search/SearchBar';
import { SearchResults } from '../search/SearchResults';
import { PlaylistView } from '../playlist/PlaylistView';
import { FavoritesView } from '../library/FavoritesView';
import { HistoryView } from '../library/HistoryView';
import { SettingsView } from '../settings/SettingsView';
import { PlayerBar } from '../player/PlayerBar';
import { PLAYER_BAR_HEIGHT } from '@shared/constants';

export function AppShell() {
  const [activeView, setActiveView] = useState('search');

  return (
    <div className="h-full flex flex-col">
      {/* Title bar */}
      <TitleBar />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar activeView={activeView} onViewChange={setActiveView} />

        {/* Content area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-surface-950">
          {/* Search bar (always visible at top) */}
          <SearchBar />

          {/* View content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {activeView === 'search' && <SearchResults />}
            {activeView === 'favorites' && <FavoritesView />}
            {activeView === 'history' && <HistoryView />}
            {activeView === 'settings' && <SettingsView />}
            {activeView.startsWith('playlist:') && (
              <PlaylistView playlistId={activeView.replace('playlist:', '')} />
            )}
          </div>
        </main>
      </div>

      {/* Player bar */}
      <PlayerBar />
    </div>
  );
}

function PlaceholderView({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h2 className="text-xl font-semibold text-surface-300 mb-2">{title}</h2>
      <p className="text-sm text-surface-500">{message}</p>
    </div>
  );
}
