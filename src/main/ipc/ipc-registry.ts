import { BrowserWindow, ipcMain, shell } from 'electron';
import { IpcChannels } from '../../shared/types/ipc';
import { resolveStreamMetadata, getDirectUrl, setAudioQuality, setCookiesBrowser } from '../audio/stream-resolver';
import { getLogPath, logError } from '../logger';

export function registerIpcHandlers(mainWindow: BrowserWindow, streamPort: number): void {
  // Window controls
  ipcMain.on(IpcChannels.WINDOW_MINIMIZE, () => {
    mainWindow.minimize();
  });

  ipcMain.on(IpcChannels.WINDOW_MAXIMIZE, () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on(IpcChannels.WINDOW_CLOSE, () => {
    mainWindow.close();
  });

  // Return stream server port (instant, called once at startup)
  ipcMain.handle(IpcChannels.STREAM_PORT, () => streamPort);

  // Audio quality setting from renderer
  ipcMain.on(IpcChannels.STREAM_SET_QUALITY, (_event, quality: string) => {
    if (quality === 'best' || quality === 'medium' || quality === 'low') {
      setAudioQuality(quality);
    }
  });

  // Browser cookies setting for age-restricted content
  ipcMain.on(IpcChannels.STREAM_SET_COOKIES_BROWSER, (_event, browser: string) => {
    setCookiesBrowser(browser);
  });

  // Prefetch: resolve URL only (fire-and-forget, warms the cache for next songs)
  ipcMain.on(IpcChannels.STREAM_PREFETCH, (_event, videoId: string) => {
    getDirectUrl(videoId).catch(() => {});
  });

  // Priority resolve: user clicked play — bump to front of yt-dlp queue
  ipcMain.on(IpcChannels.STREAM_PRIORITIZE, (_event, videoId: string) => {
    getDirectUrl(videoId, true).catch(() => {});
  });

  // Open error log file in OS default editor
  ipcMain.on(IpcChannels.LOG_OPEN, () => {
    shell.openPath(getLogPath());
  });

  // Log an error from renderer
  ipcMain.on(IpcChannels.LOG_ERROR, (_event, context: string, videoId: string, message: string) => {
    logError(context, videoId, message);
  });

  // Stream resolution — return local proxy URL + metadata
  ipcMain.handle(IpcChannels.STREAM_RESOLVE, async (_event, videoId: string) => {
    try {
      const metadata = await resolveStreamMetadata(videoId);
      return {
        success: true,
        data: {
          url: `http://127.0.0.1:${streamPort}/stream/${videoId}`,
          ...metadata,
        },
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[Stream] Failed to resolve ${videoId}:`, message);
      return { success: false, error: message };
    }
  });
}
