import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

let cachedPath: string | null = null;

/**
 * Resolve the yt-dlp executable path.
 * Checks: bundled (extraResources), PATH, WinGet, common install locations.
 */
export function getYtDlpPath(): string {
  if (cachedPath) return cachedPath;

  // Bundled with the app (extraResources/yt-dlp.exe)
  const bundled = path.join(process.resourcesPath, 'yt-dlp.exe');

  const candidates = [
    bundled,
    'yt-dlp', // system PATH
    path.join(
      process.env.LOCALAPPDATA || '',
      'Microsoft/WinGet/Packages/yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe/yt-dlp.exe'
    ),
    path.join(
      process.env.LOCALAPPDATA || '',
      'Microsoft/WinGet/Links/yt-dlp.exe'
    ),
    path.join(process.env.LOCALAPPDATA || '', 'Programs/yt-dlp/yt-dlp.exe'),
  ];

  for (const candidate of candidates) {
    try {
      if (candidate === 'yt-dlp') {
        // Test if it's on PATH
        execFileSync('yt-dlp', ['--version'], { stdio: 'ignore', timeout: 5000 });
        cachedPath = 'yt-dlp';
        console.log('[yt-dlp] Found on PATH');
        return cachedPath;
      } else if (fs.existsSync(candidate)) {
        cachedPath = candidate;
        console.log(`[yt-dlp] Found at: ${candidate}`);
        return cachedPath;
      }
    } catch {
      // Try next candidate
    }
  }

  throw new Error(
    'yt-dlp not found. Install it via: winget install yt-dlp'
  );
}
