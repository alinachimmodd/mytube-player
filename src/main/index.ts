import { app, BrowserWindow, session } from 'electron';
import { createMainWindow } from './window-manager';
import { registerIpcHandlers } from './ipc/ipc-registry';
import { startStreamServer, stopStreamServer, setStreamServerWindow } from './audio/stream-server';
import { setResolverWindow } from './audio/stream-resolver';
import { initLogger } from './logger';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  initLogger();

  // Start the local audio streaming proxy before creating the window
  const streamPort = await startStreamServer();

  mainWindow = createMainWindow();

  // Fix CORS for YouTube Data API calls from our renderer
  // Only touch googleapis.com responses — leave YouTube embed/video responses alone
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ['https://*.googleapis.com/*'] },
    (details, callback) => {
      const headers = { ...details.responseHeaders };

      // Remove restrictive CSP headers
      delete headers['content-security-policy'];
      delete headers['Content-Security-Policy'];

      // Override CORS to allow our renderer origin
      delete headers['access-control-allow-origin'];
      delete headers['Access-Control-Allow-Origin'];
      headers['Access-Control-Allow-Origin'] = ['*'];

      callback({ responseHeaders: headers });
    }
  );

  // Wire error notifications to this window
  setResolverWindow(mainWindow);
  setStreamServerWindow(mainWindow);

  // Register IPC handlers
  registerIpcHandlers(mainWindow, streamPort);

  // Load the renderer
  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile('dist/renderer/index.html');
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  stopStreamServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
