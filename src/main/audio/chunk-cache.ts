import https from 'https';
import { getDirectUrl } from './stream-resolver';

const CHUNK_SIZE = 102400; // 100KB ≈ 5 seconds of m4a at 128kbps
const MAX_CHUNK_DOWNLOADS = 5;

export interface CachedChunk {
  buffer: Buffer;
  contentType: string;
  totalSize: number | null;
}

const chunkCache = new Map<string, CachedChunk>();
const inflight = new Map<string, Promise<void>>();
let activeDownloads = 0;
const downloadQueue: Array<() => void> = [];

async function acquireDownloadSlot(): Promise<void> {
  if (activeDownloads < MAX_CHUNK_DOWNLOADS) {
    activeDownloads++;
    return;
  }
  return new Promise<void>((resolve) => {
    downloadQueue.push(() => {
      activeDownloads++;
      resolve();
    });
  });
}

function releaseDownloadSlot(): void {
  activeDownloads--;
  const next = downloadQueue.shift();
  if (next) next();
}

async function downloadChunk(videoId: string, priority = false): Promise<void> {
  if (chunkCache.has(videoId)) return;
  if (chunkCache.size > 50) return; // Safety cap

  await acquireDownloadSlot();
  try {
    if (chunkCache.has(videoId)) return; // Re-check after waiting

    const { url, headers: ytHeaders } = await getDirectUrl(videoId, priority);

    const buffer = await new Promise<{ data: Buffer; contentType: string; totalSize: number | null }>((resolve, reject) => {
      const headers: Record<string, string> = {
        ...ytHeaders,
        Range: `bytes=0-${CHUNK_SIZE - 1}`,
      };

      const req = https.get(url, { headers }, (res) => {
        const status = res.statusCode || 0;
        if (status >= 400) {
          req.destroy();
          reject(new Error(`HTTP ${status}`));
          return;
        }

        const chunks: Buffer[] = [];
        const contentType = res.headers['content-type'] || 'audio/mp4';

        // Parse total size from Content-Range: bytes 0-102399/4523891
        let totalSize: number | null = null;
        const contentRange = res.headers['content-range'];
        if (contentRange) {
          const match = contentRange.match(/\/(\d+)/);
          if (match) totalSize = parseInt(match[1], 10);
        }

        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => resolve({ data: Buffer.concat(chunks), contentType, totalSize }));
        res.on('error', reject);
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Chunk download timeout'));
      });
    });

    chunkCache.set(videoId, {
      buffer: buffer.data,
      contentType: buffer.contentType,
      totalSize: buffer.totalSize,
    });

    console.log(`[ChunkCache] Cached ${videoId} (${buffer.data.length} bytes)`);
  } catch (err) {
    // Silently ignore — will fall back to normal proxy
    console.warn(`[ChunkCache] Failed for ${videoId}:`, err instanceof Error ? err.message : err);
  } finally {
    releaseDownloadSlot();
  }
}

/**
 * Resolve URL via yt-dlp then download first 100KB chunk.
 * Concurrency-limited and deduplicated.
 */
export function prefetchWithChunk(videoId: string, priority = false): Promise<void> {
  if (chunkCache.has(videoId)) return Promise.resolve();

  const existing = inflight.get(videoId);
  if (existing) return existing;

  const promise = downloadChunk(videoId, priority).finally(() => {
    inflight.delete(videoId);
  });

  inflight.set(videoId, promise);
  return promise;
}

export function getCachedChunk(videoId: string): CachedChunk | undefined {
  return chunkCache.get(videoId);
}

export function clearChunkCache(): void {
  chunkCache.clear();
  console.log('[ChunkCache] Cleared');
}
