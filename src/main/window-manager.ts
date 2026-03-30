import { BrowserWindow } from 'electron';
import path from 'path';
import { WINDOW_CONFIG } from '../shared/constants';

export function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: WINDOW_CONFIG.DEFAULT_WIDTH,
    height: WINDOW_CONFIG.DEFAULT_HEIGHT,
    minWidth: WINDOW_CONFIG.MIN_WIDTH,
    minHeight: WINDOW_CONFIG.MIN_HEIGHT,
    frame: false, // Frameless for custom title bar
    titleBarStyle: 'hidden',
    backgroundColor: '#0f172a', // surface-900
    show: false, // Show when ready to prevent flash
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  // Show window when content is ready (prevents white flash)
  win.once('ready-to-show', () => {
    win.show();
  });

  // Handle window close — hide to tray instead (future feature)
  win.on('close', (event) => {
    // For now, just close. Later: minimize to tray
  });

  return win;
}
