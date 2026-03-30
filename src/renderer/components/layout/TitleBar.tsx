import React from 'react';
import { APP_NAME } from '@shared/constants';

export function TitleBar() {
  const handleMinimize = () => window.api.minimizeWindow();
  const handleMaximize = () => window.api.maximizeWindow();
  const handleClose = () => window.api.closeWindow();

  return (
    <header className="drag-region h-9 flex items-center justify-between bg-surface-950 border-b border-surface-800/50 select-none shrink-0">
      {/* App title */}
      <div className="flex items-center gap-2 pl-4">
        <span className="text-accent-400 font-bold text-sm">▶</span>
        <span className="text-xs font-medium text-surface-300">{APP_NAME}</span>
      </div>

      {/* Window controls */}
      <div className="no-drag flex items-center h-full">
        <button
          onClick={handleMinimize}
          className="h-full w-11 flex items-center justify-center hover:bg-surface-700 transition-colors"
          title="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" className="fill-surface-300">
            <rect width="10" height="1" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="h-full w-11 flex items-center justify-center hover:bg-surface-700 transition-colors"
          title="Maximize"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" className="stroke-surface-300" fill="none" strokeWidth="1">
            <rect x="0.5" y="0.5" width="9" height="9" />
          </svg>
        </button>
        <button
          onClick={handleClose}
          className="h-full w-11 flex items-center justify-center hover:bg-red-600 transition-colors"
          title="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" className="stroke-surface-300" strokeWidth="1.2">
            <line x1="0" y1="0" x2="10" y2="10" />
            <line x1="10" y1="0" x2="0" y2="10" />
          </svg>
        </button>
      </div>
    </header>
  );
}
