import React, { useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { ToastContainer } from './components/shared/ToastContainer';
import { AudioPlayerController } from './services/audio-player';
import { usePlayerStore } from './stores/player-store';
import { useLibraryStore } from './stores/library-store';
import { useSettingsStore } from './stores/settings-store';
import { useToastStore } from './stores/toast-store';
import { getEqualizer } from './services/equalizer';
import { useEQStore } from './stores/eq-store';

// Store controller on window to survive HMR
declare global {
  interface Window {
    __ytController?: AudioPlayerController;
  }
}

export function getPlayerController(): AudioPlayerController | null {
  return window.__ytController ?? null;
}

function initPlayer() {
  // Reuse existing controller if it survived HMR
  if (window.__ytController) return;

  const controller = new AudioPlayerController();
  window.__ytController = controller;

  console.log('[App] AudioPlayer initialized, wiring store events');
  const store = usePlayerStore.getState;
  let lastHistoryId: string | null = null;
  let prefetchedNextId: string | null = null;

  // Initialize EQ on first play
  let eqInitialized = false;
  function initEQ() {
    if (eqInitialized) return;
    eqInitialized = true;
    try {
      const eq = getEqualizer(controller.audioElement);
      const eqState = useEQStore.getState();
      eq.setAllGains(eqState.gains);
      eq.setEnabled(eqState.enabled);
      eq.resume();
      console.log('[App] Equalizer initialized');

      // Sync EQ store → Equalizer service whenever store changes
      useEQStore.subscribe((state, prevState) => {
        const eq = getEqualizer(controller.audioElement);
        if (state.enabled !== prevState.enabled) {
          eq.setEnabled(state.enabled);
        }
        if (state.gains !== prevState.gains) {
          eq.setAllGains(state.gains);
        }
      });
    } catch (err) {
      console.warn('[App] Failed to initialize EQ:', err);
    }
  }

  controller.on('stateChange', () => {
    const state = controller.getState();
    store().setState(state);

    if (state === 'loading') {
      // User clicked a new song — reset prefetch tracker so any
      // in-progress prefetch doesn't interfere
      prefetchedNextId = null;
    }

    if (state === 'playing') {
      // Connect EQ on first play (needs user gesture for AudioContext)
      initEQ();

      const track = store().currentTrack;
      if (track && track.id !== lastHistoryId && useSettingsStore.getState().historyEnabled) {
        lastHistoryId = track.id;
        useLibraryStore.getState().addToHistory(track);
      }
    }

    if (state === 'ended' && useSettingsStore.getState().autoPlay) {
      const { nextInQueue, setCurrentTrack, setState } = store();
      const nextTrack = nextInQueue();
      if (nextTrack) {
        setCurrentTrack(nextTrack);
        setState('loading');
        controller.load(nextTrack.id);
      }
    }
  });

  controller.on('timeUpdate', () => {
    const currentTime = controller.getCurrentTime();
    const duration = controller.getDuration();
    store().setCurrentTime(currentTime);
    store().setDuration(duration);

    // Prefetch next song when <5s remain
    if (duration > 0 && duration - currentTime <= 5 && useSettingsStore.getState().autoPlay) {
      const { queue, queueIndex } = store();
      const nextIndex = queueIndex + 1;
      if (nextIndex < queue.length) {
        const nextId = queue[nextIndex].id;
        if (nextId !== prefetchedNextId) {
          prefetchedNextId = nextId;
          console.log('[App] Prefetching next track:', nextId);
          window.api.prefetchStream(nextId);
        }
      }
    }
  });

  controller.on('error', () => {
    console.warn('[AudioPlayer] Playback error');
    store().setState('error');
    const track = store().currentTrack;
    const videoId = controller.getVideoId() || 'unknown';
    const audioEl = controller.audioElement;
    const mediaErr = audioEl.error;
    const code = mediaErr ? mediaErr.code : 0;
    const codeNames: Record<number, string> = {
      1: 'MEDIA_ERR_ABORTED',
      2: 'MEDIA_ERR_NETWORK',
      3: 'MEDIA_ERR_DECODE',
      4: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
    };
    const errName = codeNames[code] || 'Loading timeout';
    const trackLabel = track ? track.title : 'Unknown track';
    window.api.logError('audio-player', videoId, `${errName} — ${trackLabel}`);
    useToastStore.getState().addToast({
      message: `Could not play "${trackLabel}" — ${errName}`,
      type: 'error',
      duration: 8000,
      action: {
        label: 'View Log',
        onClick: () => window.api.openLogFile(),
      },
    });
  });
}

export default function App() {
  useEffect(() => {
    initPlayer();
    // Sync persisted settings to main process on startup
    const settings = useSettingsStore.getState();
    window.api.setAudioQuality(settings.audioQuality);
    window.api.setCookiesBrowser(settings.cookiesBrowser);

    // Listen for stream errors from main process
    const cleanupStreamError = window.api.onStreamError(({ message }) => {
      const isAgeRestricted = message.includes('age-restricted');
      useToastStore.getState().addToast({
        message: isAgeRestricted
          ? 'This video is age-restricted. Enable browser cookies in Settings to play it.'
          : `Playback failed: ${message}`,
        type: 'error',
        duration: isAgeRestricted ? 10000 : 8000,
        action: isAgeRestricted
          ? {
              label: 'Open Settings',
              onClick: () => {
                document.querySelector<HTMLButtonElement>('[data-view="settings"]')?.click();
              },
            }
          : {
              label: 'View Log',
              onClick: () => window.api.openLogFile(),
            },
      });
    });

    return () => { cleanupStreamError(); };
  }, []);

  return (
    <div className="h-full w-full flex flex-col bg-surface-950">
      <AppShell />
      <ToastContainer />
    </div>
  );
}
