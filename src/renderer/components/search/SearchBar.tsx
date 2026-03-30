import React, { useState, useCallback, useRef } from 'react';
import { usePlayerStore } from '../../stores/player-store';
import { searchYouTube } from '../../services/youtube/data-api';

export function SearchBar() {
  const [inputValue, setInputValue] = useState('');
  const { setSearchResults, setSearchQuery, setSearchLoading, searchLoading } =
    usePlayerStore();
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) return;

      setSearchQuery(query);
      setSearchLoading(true);

      try {
        const response = await searchYouTube({ query, maxResults: 20 });
        setSearchResults(response.results, response.nextPageToken);
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    },
    [setSearchQuery, setSearchLoading, setSearchResults]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Debounce the search
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (value.trim().length >= 2) {
        performSearch(value);
      }
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      performSearch(inputValue);
    }
  };

  return (
    <div className="px-6 pt-4 pb-2 shrink-0">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="w-4 h-4 text-surface-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Search for music..."
          className="w-full bg-surface-800 border border-surface-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-surface-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-colors outline-none"
        />
        {searchLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="w-4 h-4 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
