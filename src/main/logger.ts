import fs from 'fs';
import path from 'path';
import { app } from 'electron';

const LOG_FILE = path.join(app.getPath('userData'), 'error.log');
const MAX_LOG_SIZE = 2 * 1024 * 1024; // 2 MB — rotate when exceeded

/** Ensure the log file exists so "View Log" never opens a missing file. */
export function initLogger(): void {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      fs.writeFileSync(LOG_FILE, `MyTube Player — Error Log\nCreated: ${new Date().toISOString()}\n\n`, 'utf-8');
    }
  } catch {
    // Non-critical — will be created on first error
  }
}

function rotateIfNeeded(): void {
  try {
    const stat = fs.statSync(LOG_FILE);
    if (stat.size > MAX_LOG_SIZE) {
      const backup = LOG_FILE + '.old';
      if (fs.existsSync(backup)) fs.unlinkSync(backup);
      fs.renameSync(LOG_FILE, backup);
    }
  } catch {
    // File doesn't exist yet — that's fine
  }
}

export function logError(context: string, videoId: string, message: string, details?: string): void {
  rotateIfNeeded();
  const timestamp = new Date().toISOString();
  const line = [
    `[${timestamp}] [${context}] videoId=${videoId}`,
    `  Error: ${message}`,
    details ? `  Details: ${details}` : '',
    '',
  ].filter(Boolean).join('\n') + '\n';

  try {
    fs.appendFileSync(LOG_FILE, line, 'utf-8');
  } catch (err) {
    console.error('[Logger] Failed to write log:', err);
  }
}

export function getLogPath(): string {
  return LOG_FILE;
}
