import { execFile } from 'child_process';
import { promisify } from 'util';
import { BrowserWindow } from 'electron';
import { getYtDlpPath } from './yt-dlp-path';
import { IpcChannels } from '../../shared/types/ipc';
import { logError } from '../logger';

const execFileAsync = promisify(execFile);

let mainWindow: BrowserWindow | null = null;
export function setResolverWindow(win: BrowserWindow): void {
  mainWindow = win;
}
function notifyError(videoId: string, message: string): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IpcChannels.STREAM_ERROR, { videoId, message });
  }
}

export interface StreamMetadata {
  duration: number; // seconds
  title: string;
  artist: string;
  thumbnailUrl: string;
}

interface CachedInfo {
  metadata: StreamMetadata;
  directUrl: string;
  httpHeaders: Record<string, string>;
  resolvedAt: number;
}

// Shared cache — single yt-dlp call provides both metadata and URL
const cache = new Map<string, CachedInfo>();
const CACHE_TTL = 5 * 60 * 60 * 1000; // 5 hours

// Failed video cache — prevents re-resolving videos that already failed
const failedCache = new Map<string, { message: string; failedAt: number }>();
const FAILED_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Audio quality setting — controlled from renderer via IPC
let audioQuality: 'best' | 'medium' | 'low' = 'best';

const FORMAT_MAP = {
  best: 'bestaudio[ext=m4a]/bestaudio',
  medium: 'bestaudio[abr<=128]',
  low: 'worstaudio',
};

export function setAudioQuality(quality: 'best' | 'medium' | 'low'): void {
  if (quality !== audioQuality) {
    audioQuality = quality;
    cache.clear();
  }
}

// Browser cookies setting — enables age-restricted content
let cookiesBrowser = '';

export function setCookiesBrowser(browser: string): void {
  if (browser !== cookiesBrowser) {
    cookiesBrowser = browser;
    cache.clear();
    failedCache.clear(); // Allow retrying previously failed videos
  }
}

// Concurrency control — max 6 simultaneous yt-dlp processes
const MAX_CONCURRENT = 6;
let activeCount = 0;
const waitQueue: Array<{ resolve: () => void; priority: boolean }> = [];

// Dedup in-flight requests — if videoId is already being resolved, reuse the promise
const inflight = new Map<string, Promise<CachedInfo>>();

async function acquireSlot(priority = false): Promise<void> {
  if (activeCount < MAX_CONCURRENT) {
    activeCount++;
    return;
  }
  return new Promise<void>((resolve) => {
    const entry = { resolve: () => { activeCount++; resolve(); }, priority };
    // Priority requests go to front of queue (user-clicked songs)
    if (priority) {
      waitQueue.unshift(entry);
    } else {
      waitQueue.push(entry);
    }
  });
}

function releaseSlot(): void {
  activeCount--;
  const next = waitQueue.shift();
  if (next) next.resolve();
}

/**
 * Single yt-dlp --dump-json call that resolves metadata + best audio URL.
 * Results are cached. Max 6 concurrent yt-dlp processes.
 */
async function resolveAll(videoId: string, priority = false): Promise<CachedInfo> {
  const cached = cache.get(videoId);
  if (cached && Date.now() - cached.resolvedAt < CACHE_TTL) {
    return cached;
  }

  // Don't retry recently failed videos
  const failed = failedCache.get(videoId);
  if (failed && Date.now() - failed.failedAt < FAILED_CACHE_TTL) {
    throw new Error(failed.message);
  }

  // Dedup: if already in-flight, reuse the same promise
  const existing = inflight.get(videoId);
  if (existing) return existing;

  const promise = (async () => {
    await acquireSlot(priority);
    try {
      // Check cache again (may have been populated while waiting in queue)
      const cached2 = cache.get(videoId);
      if (cached2 && Date.now() - cached2.resolvedAt < CACHE_TTL) {
        return cached2;
      }

      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const start = Date.now();
      console.log(`[yt-dlp] Resolving ${videoId}...`);
      const args = [
        '-f', FORMAT_MAP[audioQuality],
        '--dump-json',
        '--no-warnings',
        '--no-playlist',
      ];
      if (cookiesBrowser) {
        args.push('--cookies-from-browser', cookiesBrowser);
      }
      args.push(videoUrl);
      const { stdout } = await execFileAsync(getYtDlpPath(), args, {
        timeout: 30000, maxBuffer: 10 * 1024 * 1024,
      });
      console.log(`[yt-dlp] Resolved ${videoId} in ${Date.now() - start}ms`);

      const info = JSON.parse(stdout);

      const entry: CachedInfo = {
        metadata: {
          duration: info.duration || 0,
          title: info.title || 'Unknown',
          artist: info.uploader || info.channel || 'Unknown',
          thumbnailUrl: info.thumbnail || '',
        },
        directUrl: info.url,
        httpHeaders: info.http_headers || {},
        resolvedAt: Date.now(),
      };

      cache.set(videoId, entry);
      return entry;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[yt-dlp] Failed for ${videoId}:`, msg);
      // Provide a user-friendly error for common failures
      let userMsg = msg;
      if (msg.includes('Could not copy') && msg.includes('cookie database')) {
        userMsg = 'Could not read browser cookies. Try closing your browser first, or select a different browser in Settings.';
      } else if (msg.includes('Sign in to confirm your age') || msg.includes('inappropriate')) {
        userMsg = 'This video is age-restricted. Enable browser cookies in Settings to play it.';
      } else if (msg.includes('Private video') || msg.includes('Video unavailable')) {
        userMsg = 'This video is private or unavailable.';
      }
      failedCache.set(videoId, { message: userMsg, failedAt: Date.now() });
      logError('yt-dlp', videoId, userMsg, msg !== userMsg ? msg : undefined);
      notifyError(videoId, userMsg);
      throw new Error(userMsg);
    } finally {
      releaseSlot();
      inflight.delete(videoId);
    }
  })();

  inflight.set(videoId, promise);
  return promise;
}

/**
 * Get metadata for a YouTube video (called from IPC handler).
 * Priority=true so user-clicked songs resolve before prefetch.
 */
export async function resolveStreamMetadata(videoId: string): Promise<StreamMetadata> {
  const info = await resolveAll(videoId, true);
  return info.metadata;
}

/**
 * Get the direct audio URL and HTTP headers (called from stream server).
 * Returns instantly if already cached by prefetch.
 */
export async function getDirectUrl(videoId: string, priority = false): Promise<{ url: string; headers: Record<string, string> }> {
  const info = await resolveAll(videoId, priority);
  return { url: info.directUrl, headers: info.httpHeaders };
}

/**
 * Remove a cached entry (called when YouTube CDN returns an error).
 */
export function invalidateCache(videoId: string): void {
  cache.delete(videoId);
}
