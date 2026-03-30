import http from 'http';
import https from 'https';
import { BrowserWindow } from 'electron';
import { getDirectUrl, invalidateCache } from './stream-resolver';
import { IpcChannels } from '../../shared/types/ipc';
import { logError } from '../logger';

let server: http.Server | null = null;
let serverPort = 0;
let mainWindow: BrowserWindow | null = null;

export function setStreamServerWindow(win: BrowserWindow): void {
  mainWindow = win;
}

function notifyStreamError(videoId: string, message: string): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IpcChannels.STREAM_ERROR, { videoId, message });
  }
}

/**
 * Local HTTP server that proxies YouTube audio streams with Range support.
 * Audio starts playing as soon as the browser receives enough data — no pre-caching.
 */
export function startStreamServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    server = http.createServer(async (req, res) => {
      const url = new URL(req.url || '/', `http://localhost`);
      const videoId = url.pathname.replace('/stream/', '');

      // Validate YouTube video ID format (11 chars, alphanumeric + dash + underscore)
      if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        res.writeHead(400);
        res.end('Invalid videoId');
        return;
      }

      try {
        const { url: directUrl, headers: ytHeaders } = await getDirectUrl(videoId, true);

        const headers: Record<string, string> = { ...ytHeaders };
        if (req.headers.range) {
          headers['Range'] = req.headers.range;
        }

        const proxyReq = https.get(directUrl, { headers }, (proxyRes) => {
          const status = proxyRes.statusCode || 200;

          if (status >= 400) {
            const msg = `YouTube CDN returned HTTP ${status}`;
            console.error(`[StreamServer] ${msg} for ${videoId}`);
            logError('stream-proxy', videoId, msg);
            invalidateCache(videoId);
            notifyStreamError(videoId, msg);
          }

          const responseHeaders: Record<string, string> = {
            'Content-Type': proxyRes.headers['content-type'] || 'audio/mp4',
            'Access-Control-Allow-Origin': '*',
            'Accept-Ranges': 'bytes',
          };

          if (proxyRes.headers['content-length']) {
            responseHeaders['Content-Length'] = proxyRes.headers['content-length'];
          }
          if (proxyRes.headers['content-range']) {
            responseHeaders['Content-Range'] = proxyRes.headers['content-range'];
          }

          res.writeHead(status, responseHeaders);
          proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
          if ((err as NodeJS.ErrnoException).code === 'ECONNRESET' || !err.message) return;
          const errMsg = `Network error: ${(err as NodeJS.ErrnoException).code || err.message}`;
          console.error(`[StreamServer] ${errMsg} for ${videoId}`);
          logError('stream-proxy', videoId, errMsg);
          notifyStreamError(videoId, errMsg);
          if (!res.headersSent) {
            res.writeHead(502);
          }
          res.end();
        });

        req.on('close', () => proxyReq.destroy());
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[StreamServer] Failed to stream ${videoId}:`, message);
        // Resolver already notifies + logs for yt-dlp failures, but if we
        // reach here from an unexpected path, ensure the user still sees it
        if (!res.headersSent) {
          res.writeHead(500);
        }
        res.end(message);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const addr = server!.address();
      if (addr && typeof addr === 'object') {
        serverPort = addr.port;
        console.log(`[StreamServer] Listening on http://127.0.0.1:${serverPort}`);
        resolve(serverPort);
      } else {
        reject(new Error('Failed to get server address'));
      }
    });

    server.on('error', reject);
  });
}

export function getStreamServerPort(): number {
  return serverPort;
}

export function stopStreamServer(): void {
  if (server) {
    server.close();
    server = null;
  }
}
