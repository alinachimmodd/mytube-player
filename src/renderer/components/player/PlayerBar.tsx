import React, { useState } from 'react';
import { usePlayerStore } from '../../stores/player-store';
import { useEQStore } from '../../stores/eq-store';
import { getPlayerController } from '../../App';
import { NowPlaying } from './NowPlaying';
import { ProgressBar } from './ProgressBar';
import { VolumeControl } from './VolumeControl';
import { EQPanel } from './EQPanel';
import { PLAYER_BAR_HEIGHT } from '@shared/constants';

export function PlayerBar() {
  const [showEQ, setShowEQ] = useState(false);
  const eqEnabled = useEQStore((s) => s.enabled);
  const { state, currentTrack, setCurrentTrack, setState, nextInQueue, queue, queueIndex, isShuffled, toggleShuffle, repeatMode, setRepeatMode } =
    usePlayerStore();

  const handlePlayPause = () => {
    if (!getPlayerController() || !currentTrack) return;
    if (state === 'playing') {
      getPlayerController().pause();
    } else {
      getPlayerController().play();
    }
  };

  const handlePrevious = () => {
    if (!getPlayerController() || !currentTrack) return;

    // If more than 3 seconds in, restart the current track
    if (getPlayerController().getCurrentTime() > 3) {
      getPlayerController().seekTo(0);
      return;
    }

    const { queue, queueIndex } = usePlayerStore.getState();
    if (queueIndex > 0) {
      const prevTrack = queue[queueIndex - 1];
      usePlayerStore.getState().setQueueIndex(queueIndex - 1);
      setCurrentTrack(prevTrack);
      setState('loading');
      getPlayerController().load(prevTrack.id);
    }
  };

  const handleNext = () => {
    if (!getPlayerController()) return;
    const nextTrack = nextInQueue();
    if (nextTrack) {
      setCurrentTrack(nextTrack);
      setState('loading');
      getPlayerController().load(nextTrack.id);
    }
  };

  const cycleRepeatMode = () => {
    const modes: Array<'none' | 'one' | 'all'> = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentIndex + 1) % modes.length]);
  };

  const isPlaying = state === 'playing';
  const hasTrack = !!currentTrack;
  const canNext = isShuffled || repeatMode === 'all' || queueIndex < queue.length - 1;

  return (
    <footer
      className="flex items-center justify-between px-4 bg-surface-900 border-t border-surface-800/50 shrink-0"
      style={{ height: PLAYER_BAR_HEIGHT }}
    >
      {/* Left: Now playing info */}
      <NowPlaying />

      {/* Center: Controls + Progress */}
      <div className="flex flex-col items-center gap-1 flex-1 max-w-[600px]">
        {/* Transport controls */}
        <div className="flex items-center gap-3">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            className={`p-1 transition-colors ${
              isShuffled
                ? 'text-accent-400 hover:text-accent-300'
                : 'text-surface-500 hover:text-white'
            }`}
            title={isShuffled ? 'Shuffle: On' : 'Shuffle: Off'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
            </svg>
          </button>

          {/* Previous */}
          <button
            onClick={handlePrevious}
            disabled={!hasTrack}
            className="text-surface-400 hover:text-white disabled:text-surface-700 transition-colors p-1"
            title="Previous"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={handlePlayPause}
            disabled={!hasTrack}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-surface-900 hover:scale-105 disabled:bg-surface-700 disabled:text-surface-500 transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Next */}
          <button
            onClick={handleNext}
            disabled={!hasTrack || !canNext}
            className="text-surface-400 hover:text-white disabled:text-surface-700 transition-colors p-1"
            title="Next"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>

          {/* Repeat */}
          <button
            onClick={cycleRepeatMode}
            className={`p-1 transition-colors relative ${
              repeatMode !== 'none'
                ? 'text-accent-400 hover:text-accent-300'
                : 'text-surface-500 hover:text-white'
            }`}
            title={
              repeatMode === 'none' ? 'Repeat: Off'
                : repeatMode === 'all' ? 'Repeat: All'
                : 'Repeat: One'
            }
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 1l4 4-4 4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 11V9a4 4 0 014-4h14" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 23l-4-4 4-4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13v2a4 4 0 01-4 4H3" />
            </svg>
            {repeatMode === 'one' && (
              <span className="absolute -top-1 -right-1 text-[8px] font-bold text-accent-400">1</span>
            )}
          </button>
        </div>

        {/* Progress bar */}
        <ProgressBar />
      </div>

      {/* Right: EQ + Volume */}
      <div className="w-[280px] flex items-center justify-end gap-2 shrink-0">
        {/* EQ toggle */}
        <button
          onClick={() => setShowEQ((v) => !v)}
          className={`p-1.5 rounded transition-colors ${
            showEQ || eqEnabled
              ? 'text-accent-400 hover:text-accent-300'
              : 'text-surface-500 hover:text-white'
          }`}
          title="Equalizer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M4 8h4M4 16h4M12 4h4M12 12h4M12 20h4M20 8h0M20 16h0" />
            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
            <circle cx="8" cy="16" r="1.5" fill="currentColor" />
            <circle cx="16" cy="4" r="1.5" fill="currentColor" />
            <circle cx="16" cy="12" r="1.5" fill="currentColor" />
            <circle cx="16" cy="20" r="1.5" fill="currentColor" />
          </svg>
        </button>
        <VolumeControl />
      </div>

      {/* EQ Panel */}
      {showEQ && <EQPanel onClose={() => setShowEQ(false)} />}
    </footer>
  );
}
