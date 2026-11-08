import type { WorkLog, WorkerSummary } from '../types.ts';
import { adminDb } from '../lib/firebase-admin.ts';
import { getCachedWorkLogsSync } from './atomicStorage.ts';

// In-memory cache for O(1) instantaneous passbook reads
const summaryCache = new Map<string, WorkerSummary>();

/**
 * Updates or increments the materialized summary for a worker when a log is committed.
 * Adheres to CQRS principles: write model updates read projection asynchronously.
 */
export async function updateWorkerMaterializedSummary(log: WorkLog): Promise<WorkerSummary> {
  const phone = log.phone_number;
  const allLogs = getCachedWorkLogsSync();
  const workerLogs = allLogs.filter((l) => l.phone_number === phone);
  if (!workerLogs.some((l) => l.id === log.id)) {
    workerLogs.push(log);
  }

  // Compute summary from worker's logs
  const uniqueDates = new Set(workerLogs.map((l) => (l.date || l.created_at || '').slice(0, 10)));
  const totalDays = uniqueDates.size;
  const totalEarnings = workerLogs.reduce(
    (acc, curr) => acc + (Number(curr.actual_wage_earned ?? curr.estimated_wage) || 600),
    0
  );
  const totalPaid = workerLogs.reduce((acc, curr) => acc + (Number(curr.amount_paid) || 0), 0);
  const outstandingAmount = Math.max(0, totalEarnings - totalPaid);
  const locations = Array.from(new Set(workerLogs.map((l) => l.location_name).filter((loc): loc is string => Boolean(loc))));
  const lastActive = workerLogs.length > 0 ? workerLogs[0].created_at : new Date().toISOString();

  const summary: WorkerSummary = {
    phoneNumber: phone,
    totalDays,
    totalEarnings,
    totalPaid,
    outstandingAmount,
    lastActive,
    locations,
  };

  // 1. Update in-memory fast tier
  summaryCache.set(phone, summary);

  // 2. Persist to Firestore Hot Tier in background (non-blocking)
  if (adminDb) {
    try {
      const sanitizedPhone = phone.replace(/[^a-zA-Z0-9_+]/g, '_');
      await adminDb.collection('worker_summaries').doc(sanitizedPhone).set({
        ...summary,
        lastUpdated: new Date().toISOString(),
      }, { merge: true });
    } catch (err: any) {
      // Non-fatal if offline or Firestore permissions pending
      console.warn(`[CQRS] Firestore projection sync note for ${phone}:`, err.message || err);
    }
  }

  return summary;
}

/**
 * Retrieve the pre-computed materialized summary in O(1) time.
 */
export async function getMaterializedSummary(phoneNumber: string): Promise<WorkerSummary> {
  // Check fast cache first
  const cached = summaryCache.get(phoneNumber);
  if (cached) {
    return cached;
  }

  // Check Firestore Hot Tier
  if (adminDb) {
    try {
      const sanitizedPhone = phoneNumber.replace(/[^a-zA-Z0-9_+]/g, '_');
      const snap = await adminDb.collection('worker_summaries').doc(sanitizedPhone).get();
      if (snap.exists) {
        const data = snap.data() as WorkerSummary;
        summaryCache.set(phoneNumber, data);
        return data;
      }
    } catch (err) {
      // Fall through to calculation
    }
  }

  // Cold calculation fallback and cache populate
  const allLogs = getCachedWorkLogsSync();
  const workerLogs = allLogs.filter((l) => l.phone_number === phoneNumber);

  const uniqueDates = new Set(workerLogs.map((l) => (l.date || l.created_at || '').slice(0, 10)));
  const totalDays = uniqueDates.size;
  const totalEarnings = workerLogs.reduce(
    (acc, curr) => acc + (Number(curr.actual_wage_earned ?? curr.estimated_wage) || 600),
    0
  );
  const totalPaid = workerLogs.reduce((acc, curr) => acc + (Number(curr.amount_paid) || 0), 0);
  const outstandingAmount = Math.max(0, totalEarnings - totalPaid);
  const locations = Array.from(new Set(workerLogs.map((l) => l.location_name).filter((loc): loc is string => Boolean(loc))));
  const lastActive = workerLogs.length > 0 ? workerLogs[0].created_at : new Date().toISOString();

  const summary: WorkerSummary = {
    phoneNumber,
    totalDays,
    totalEarnings,
    totalPaid,
    outstandingAmount,
    lastActive,
    locations,
  };

  summaryCache.set(phoneNumber, summary);
  return summary;
}

/**
 * Bulk warm-up all worker summaries on boot.
 */
export function warmupSummaries(logs: WorkLog[]): void {
  const phoneNumbers = new Set(logs.map((l) => l.phone_number));
  for (const phone of phoneNumbers) {
    const workerLogs = logs.filter((l) => l.phone_number === phone);
    const uniqueDates = new Set(workerLogs.map((l) => (l.date || l.created_at || '').slice(0, 10)));
    const totalDays = uniqueDates.size;
    const totalEarnings = workerLogs.reduce(
      (acc, curr) => acc + (Number(curr.actual_wage_earned ?? curr.estimated_wage) || 600),
      0
    );
    const totalPaid = workerLogs.reduce((acc, curr) => acc + (Number(curr.amount_paid) || 0), 0);
    const outstandingAmount = Math.max(0, totalEarnings - totalPaid);
    const locations = Array.from(new Set(workerLogs.map((l) => l.location_name).filter((loc): loc is string => Boolean(loc))));
    const lastActive = workerLogs.length > 0 ? workerLogs[0].created_at : new Date().toISOString();

    summaryCache.set(phone, {
      phoneNumber: phone,
      totalDays,
      totalEarnings,
      totalPaid,
      outstandingAmount,
      lastActive,
      locations,
    });
  }
}
