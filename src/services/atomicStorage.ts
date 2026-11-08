/**
 * Production-Grade Atomic Storage Engine with Concurrency Mutex
 * 
 * Solves:
 * 1. Lost-Update Race Conditions under concurrent multi-client requests
 * 2. Corrupted file writes via write-to-temp + atomic rename (POSIX rename guarantee)
 * 3. In-memory read caching with write-through serialization
 */

import fs from 'node:fs';
import path from 'node:path';
import type { WorkLog } from '../types.ts';
import { INITIAL_WORK_LOGS } from '../data/initialLogs.ts';

const WORK_LOGS_FILE = path.resolve('work_logs_db.json');
const DISPUTES_FILE = path.resolve('disputes_db.json');

// Serialization mutex queue to guarantee sequential asynchronous writes
class AsyncMutex {
  private queue: Promise<void> = Promise.resolve();

  public runExclusive<T>(callback: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue = this.queue.then(async () => {
        try {
          const result = await callback();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
    });
  }
}

const fileMutex = new AsyncMutex();

// Cache in memory to eliminate redundant disk reads on high traffic
let cachedLogs: WorkLog[] | null = null;

export function getCachedWorkLogsSync(): WorkLog[] {
  if (cachedLogs) return cachedLogs;
  try {
    if (fs.existsSync(WORK_LOGS_FILE)) {
      const raw = fs.readFileSync(WORK_LOGS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedLogs = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[AtomicStorage] Error reading work_logs_db.json, falling back to initial data:', err);
  }
  cachedLogs = [...INITIAL_WORK_LOGS];
  return cachedLogs;
}

/**
 * Atomic write operation: Writes to a unique temp file first, then atomically renames it.
 * This guarantees that even if the server crashes or loses power mid-write,
 * the primary database file is never corrupted or left in a partial state.
 */
export async function atomicWriteWorkLogs(logs: WorkLog[]): Promise<void> {
  return fileMutex.runExclusive(async () => {
    cachedLogs = logs;
    const tempFile = `${WORK_LOGS_FILE}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
    const data = JSON.stringify(logs, null, 2);

    try {
      await fs.promises.writeFile(tempFile, data, 'utf-8');
      await fs.promises.rename(tempFile, WORK_LOGS_FILE);
    } catch (err) {
      console.error('[AtomicStorage] Failed atomic file write:', err);
      // Clean up orphaned temp file if exists
      if (fs.existsSync(tempFile)) {
        try {
          await fs.promises.unlink(tempFile);
        } catch {}
      }
      throw err;
    }
  });
}

/**
 * Thread-safe mutation helper: executes an atomic read-modify-write block
 */
export async function mutateWorkLogsAtomically<T>(
  mutator: (currentLogs: WorkLog[]) => { updatedLogs: WorkLog[]; result: T } | WorkLog[]
): Promise<T> {
  return fileMutex.runExclusive(async () => {
    const current = getCachedWorkLogsSync();
    const rawOutput = mutator([...current]);
    
    let updatedLogs: WorkLog[];
    let result: any;

    if (Array.isArray(rawOutput)) {
      updatedLogs = rawOutput;
      result = rawOutput as unknown as T;
    } else {
      updatedLogs = rawOutput.updatedLogs;
      result = rawOutput.result;
    }

    cachedLogs = updatedLogs;

    const tempFile = `${WORK_LOGS_FILE}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
    const data = JSON.stringify(updatedLogs, null, 2);

    await fs.promises.writeFile(tempFile, data, 'utf-8');
    await fs.promises.rename(tempFile, WORK_LOGS_FILE);
    return result;
  });
}
