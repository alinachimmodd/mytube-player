import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels } from '../shared/types/ipc';

const api = {
  // Window controls
  minimizeWindow: () => ipcRenderer.send(IpcChannels.WINDOW_MINIMIZE),
  maximizeWindow: () => ipcRenderer.send(IpcChannels.WINDOW_MAXIMIZE),
  closeWindow: () => ipcRenderer.send(IpcChannels.WINDOW_CLOSE),

  // Stream resolution
  resolveStream: (videoId: string) =>
    ipcRenderer.invoke(IpcChannels.STREAM_RESOLVE, videoId),
  getStreamPort: () =>
    ipcRenderer.invoke(IpcChannels.STREAM_PORT) as Promise<number>,
  prefetchStream: (videoId: string) =>
    ipcRenderer.send(IpcChannels.STREAM_PREFETCH, videoId),
  prioritizeStream: (videoId: string) =>
    ipcRenderer.send(IpcChannels.STREAM_PRIORITIZE, videoId),
  setAudioQuality: (quality: string) =>
    ipcRenderer.send(IpcChannels.STREAM_SET_QUALITY, quality),
  setCookiesBrowser: (browser: string) =>
    ipcRenderer.send(IpcChannels.STREAM_SET_COOKIES_BROWSER, browser),

  // Stream error notifications (main → renderer) — returns cleanup function
  onStreamError: (callback: (data: { videoId: string; message: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { videoId: string; message: string }) => callback(data);
    ipcRenderer.on(IpcChannels.STREAM_ERROR, handler);
    return () => { ipcRenderer.removeListener(IpcChannels.STREAM_ERROR, handler); };
  },

  // Logging
  openLogFile: () => ipcRenderer.send(IpcChannels.LOG_OPEN),
  logError: (context: string, videoId: string, message: string) =>
    ipcRenderer.send(IpcChannels.LOG_ERROR, context, videoId, message),

  // Platform info
  platform: process.platform as 'win32' | 'darwin' | 'linux',
};

contextBridge.exposeInMainWorld('api', api);

export type ElectronApi = typeof api;
