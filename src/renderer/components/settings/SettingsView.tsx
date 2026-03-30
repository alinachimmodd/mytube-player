import React, { useState } from 'react';
import { useSettingsStore, type AudioQuality, type CookiesBrowser } from '../../stores/settings-store';
import { useLibraryStore } from '../../stores/library-store';

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-10 h-5 rounded-full transition-colors ${
        enabled ? 'bg-accent-600' : 'bg-surface-600'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">{label}</p>
        {description && <p className="text-xs text-surface-500 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsView() {
  const settings = useSettingsStore();
  const { clearHistory } = useLibraryStore();

  const [apiKeyInput, setApiKeyInput] = useState(settings.youtubeApiKey);
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSaveApiKey = () => {
    settings.setYoutubeApiKey(apiKeyInput.trim());
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2000);
  };

  const handleClearHistory = () => {
    clearHistory();
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-white mb-6">Settings</h2>

      {/* API Configuration */}
      <Section title="YouTube API">
        <div>
          <SettingRow
            label="API Key"
            description="Your personal YouTube Data API v3 key. Get one free at console.cloud.google.com"
          >
            <span />
          </SettingRow>
          <div className="flex gap-2 mt-1">
            <div className="relative flex-1">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => { setApiKeyInput(e.target.value); setApiKeySaved(false); }}
                placeholder="AIza..."
                className="w-full px-3 py-2 pr-10 rounded-lg bg-surface-900 border border-surface-600 text-white text-sm placeholder-surface-500 focus:outline-none focus:border-accent-500 transition-colors font-mono"
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white"
                title={showApiKey ? 'Hide' : 'Show'}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {showApiKey ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  ) : (
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            <button
              onClick={handleSaveApiKey}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                apiKeySaved
                  ? 'bg-green-600 text-white'
                  : 'bg-accent-600 hover:bg-accent-500 text-white'
              }`}
            >
              {apiKeySaved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </Section>

      {/* Playback */}
      <Section title="Playback">
        <SettingRow
          label="Audio Quality"
          description="Higher quality uses more bandwidth"
        >
          <select
            value={settings.audioQuality}
            onChange={(e) => {
              const q = e.target.value as AudioQuality;
              settings.setAudioQuality(q);
              window.api.setAudioQuality(q);
            }}
            className="px-3 py-1.5 rounded-lg bg-surface-900 border border-surface-600 text-white text-sm focus:outline-none focus:border-accent-500"
          >
            <option value="best">Best</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </SettingRow>

        <SettingRow
          label="Auto-play next"
          description="Automatically play the next song in queue"
        >
          <Toggle enabled={settings.autoPlay} onChange={settings.setAutoPlay} />
        </SettingRow>

        <SettingRow
          label="Browser cookies"
          description="Use your browser's YouTube login to play age-restricted videos"
        >
          <select
            value={settings.cookiesBrowser}
            onChange={(e) => {
              const b = e.target.value as CookiesBrowser;
              settings.setCookiesBrowser(b);
              window.api.setCookiesBrowser(b);
            }}
            className="px-3 py-1.5 rounded-lg bg-surface-900 border border-surface-600 text-white text-sm focus:outline-none focus:border-accent-500"
          >
            <option value="">Disabled</option>
            <option value="chrome">Chrome</option>
            <option value="firefox">Firefox</option>
            <option value="edge">Edge</option>
            <option value="opera">Opera</option>
            <option value="brave">Brave</option>
            <option value="vivaldi">Vivaldi</option>
            <option value="chromium">Chromium</option>
            <option value="safari">Safari</option>
          </select>
        </SettingRow>
      </Section>

      {/* Search */}
      <Section title="Search">
        <SettingRow
          label="Results per search"
          description="Number of results to fetch (5-50)"
        >
          <select
            value={settings.searchResultsCount}
            onChange={(e) => settings.setSearchResultsCount(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg bg-surface-900 border border-surface-600 text-white text-sm focus:outline-none focus:border-accent-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
          </select>
        </SettingRow>

        <SettingRow
          label="Music only"
          description="Restrict search results to the Music category"
        >
          <Toggle enabled={settings.musicOnly} onChange={settings.setMusicOnly} />
        </SettingRow>
      </Section>

      {/* History & Privacy */}
      <Section title="History & Privacy">
        <SettingRow
          label="Enable history"
          description="Keep track of recently played songs"
        >
          <Toggle enabled={settings.historyEnabled} onChange={settings.setHistoryEnabled} />
        </SettingRow>

        <SettingRow
          label="History limit"
          description="Maximum number of songs to keep in history"
        >
          <select
            value={settings.historyLimit}
            onChange={(e) => settings.setHistoryLimit(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg bg-surface-900 border border-surface-600 text-white text-sm focus:outline-none focus:border-accent-500"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </SettingRow>

        <SettingRow label="Clear history" description="Remove all playback history">
          <button
            onClick={handleClearHistory}
            className="px-3 py-1.5 text-sm text-red-400 hover:text-white hover:bg-red-600/30 border border-red-500/30 rounded-lg transition-colors"
          >
            Clear
          </button>
        </SettingRow>
      </Section>

      {/* Reset */}
      <Section title="Advanced">
        <SettingRow label="Reset all settings" description="Restore default values (does not clear playlists or favorites)">
          <button
            onClick={() => { settings.resetToDefaults(); setApiKeyInput(''); }}
            className="px-3 py-1.5 text-sm text-red-400 hover:text-white hover:bg-red-600/30 border border-red-500/30 rounded-lg transition-colors"
          >
            Reset
          </button>
        </SettingRow>
      </Section>
    </div>
  );
}
