import crypto from 'node:crypto';
import type { WorkLog } from '../types.ts';
import { runPreAiBot } from './preAiBot.ts';
import { getOrCreateUser } from '../db/users.ts';
import { mutateWorkLogsAtomically, getCachedWorkLogsSync } from './atomicStorage.ts';
import { updateWorkerMaterializedSummary } from './cqrsMaterializer.ts';

export interface IngressPayload {
  phoneNumber: string;
  workerName?: string;
  body?: string;
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string;
  clientTimestamp?: string;
  idempotencyKey?: string;
  isCheckOut?: boolean;
}

export type IngressJobStatus = 'queued' | 'processing' | 'completed' | 'dead_letter';

export interface IngressJob {
  jobId: string;
  provisionalToken: string;
  payload: IngressPayload;
  status: IngressJobStatus;
  attempts: number;
  enqueuedAt: string;
  processedAt?: string;
  resultLog?: WorkLog;
  error?: string;
}

class IngressBufferService {
  private queue: IngressJob[] = [];
  private jobs: Map<string, IngressJob> = new Map();
  private deadLetterQueue: IngressJob[] = [];
  private isDraining: boolean = false;
  private drainTimer: NodeJS.Timeout | null = null;

  // Telemetry metrics
  public metrics = {
    totalEnqueued: 0,
    totalProcessed: 0,
    totalDeadLettered: 0,
    peakQueueDepth: 0,
    lastDrainDurationMs: 0,
  };

  constructor() {
    // Start consumer event loop (every 50ms)
    this.drainTimer = setInterval(() => {
      this.drainQueueBatch().catch((err) => {
        console.error('[IngressBuffer] Drain loop error:', err);
      });
    }, 50);
    if (this.drainTimer.unref) {
      this.drainTimer.unref();
    }
  }

  /**
   * Enqueue a raw ingress event in sub-5ms with immediate provisional token issuance.
   * High-throughput non-blocking ingestion designed for 10M+ morning punch spikes.
   */
  public enqueue(payload: IngressPayload): { jobId: string; provisionalToken: string; queueDepth: number } {
    const rawId = crypto.randomUUID();
    const tokenBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
    const provisionalToken = `PROV-SHP-${tokenBytes.slice(0, 4)}-${tokenBytes.slice(4, 8)}`;
    const jobId = `job_${Date.now()}_${rawId.slice(0, 8)}`;

    // Normalize phone number
    const cleanPhone = payload.phoneNumber.startsWith('+') ? payload.phoneNumber : `+${payload.phoneNumber.replace(/^whatsapp:/, '').trim()}`;

    const job: IngressJob = {
      jobId,
      provisionalToken,
      payload: {
        ...payload,
        phoneNumber: cleanPhone,
      },
      status: 'queued',
      attempts: 0,
      enqueuedAt: new Date().toISOString(),
    };

    this.queue.push(job);
    this.jobs.set(jobId, job);

    this.metrics.totalEnqueued++;
    if (this.queue.length > this.metrics.peakQueueDepth) {
      this.metrics.peakQueueDepth = this.queue.length;
    }

    // Retain only latest 10,000 completed jobs in memory
    if (this.jobs.size > 15000) {
      const keys = Array.from(this.jobs.keys()).slice(0, 2000);
      for (const k of keys) {
        const j = this.jobs.get(k);
        if (j && (j.status === 'completed' || j.status === 'dead_letter')) {
          this.jobs.delete(k);
        }
      }
    }

    return {
      jobId,
      provisionalToken,
      queueDepth: this.queue.length,
    };
  }

  public getJob(jobId: string): IngressJob | undefined {
    return this.jobs.get(jobId);
  }

  public getQueueDepth(): number {
    return this.queue.length;
  }

  public getDeadLetters(): IngressJob[] {
    return this.deadLetterQueue.slice(-100);
  }

  /**
   * Batch drains events from the buffer and atomically commits to the ledger and CQRS passbook projection.
   */
  private async drainQueueBatch(batchSize: number = 50): Promise<void> {
    if (this.isDraining || this.queue.length === 0) return;
    this.isDraining = true;
    const startTime = Date.now();

    const batch = this.queue.splice(0, batchSize);

    for (const job of batch) {
      job.attempts++;
      job.status = 'processing';

      try {
        const log = await this.processIngressJob(job);
        job.status = 'completed';
        job.processedAt = new Date().toISOString();
        job.resultLog = log;
        this.metrics.totalProcessed++;

        // Update CQRS Materialized Summary in O(1)
        updateWorkerMaterializedSummary(log).catch((cqrsErr) => {
          console.warn('[IngressBuffer] CQRS Materializer error (non-fatal):', cqrsErr);
        });
      } catch (err: any) {
        console.error(`[IngressBuffer] Failed processing job ${job.jobId} (Attempt ${job.attempts}):`, err);
        if (job.attempts < 3) {
          // Re-enqueue for retry
          this.queue.push(job);
        } else {
          // Send to Dead-Letter Queue
          job.status = 'dead_letter';
          job.error = err.message || 'Exceeded max retry attempts';
          this.deadLetterQueue.push(job);
          this.metrics.totalDeadLettered++;
        }
      }
    }

    this.metrics.lastDrainDurationMs = Date.now() - startTime;
    this.isDraining = false;
  }

  /**
   * Internal deterministic processor for an enqueued ingress item
   */
  private async processIngressJob(job: IngressJob): Promise<WorkLog> {
    const { payload, provisionalToken } = job;
    const cleanPhone = payload.phoneNumber;
    const rawMessage = payload.body || `Attendance clocked at ${payload.locationName || 'Work Site'}`;
    const lat = payload.latitude ?? null;
    const lng = payload.longitude ?? null;
    const siteName = payload.locationName || 'Work Site';
    const today = (payload.clientTimestamp || new Date().toISOString()).slice(0, 10);

    const worker = await getOrCreateUser(
      `user-${cleanPhone}`,
      `${cleanPhone.replace(/\D/g, '')}@labor.local`,
      payload.workerName || 'Laborer',
      'worker',
      cleanPhone
    );

    // Official Sealed Token (replacing provisional)
    const tokenBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
    const officialToken = `SHP-${tokenBytes.slice(0, 4)}-${tokenBytes.slice(4, 8)}`;
    const tokenHash = crypto.createHash('sha256').update(officialToken).digest('hex');

    // Check if worker is checking out
    const isOutIntent = payload.isCheckOut || /(out|chutti|khatam|exit|finish|home)/i.test(rawMessage);
    const nowIso = new Date().toISOString();

    let createdLog: WorkLog | null = null;

    await mutateWorkLogsAtomically((existingLogs) => {
      // Find today's existing log for this phone if present
      const todayExistingIndex = existingLogs.findIndex(
        (l) => l.phone_number === cleanPhone && (l.date === today || (l.created_at && l.created_at.slice(0, 10) === today))
      );

      if (isOutIntent && todayExistingIndex !== -1) {
        // Evening Egress Check-Out: Seal shift duration
        const target = { ...existingLogs[todayExistingIndex] };
        const checkInTime = target.check_in_time || target.created_at;
        const diffHours = Math.max(
          0.5,
          Number(((new Date(nowIso).getTime() - new Date(checkInTime).getTime()) / (1000 * 60 * 60)).toFixed(1))
        );

        let earnedWage = target.agreed_wage || 600.0;
        let shiftStatus: 'completed' | 'half_day' | 'overtime' = 'completed';

        if (diffHours < 4.0) {
          earnedWage = 300.0;
          shiftStatus = 'half_day';
        } else if (diffHours > 8.5) {
          const extraHours = diffHours - 8.0;
          const hourlyBase = earnedWage / 8.0;
          earnedWage = Number((earnedWage + extraHours * hourlyBase * 2).toFixed(2));
          shiftStatus = 'overtime';
        }

        target.check_out_time = nowIso;
        target.hours_worked = diffHours;
        target.actual_wage_earned = earnedWage;
        target.shift_status = shiftStatus;
        target.verification_status = 'attendance_acknowledged';
        target.status = 'verified';

        existingLogs[todayExistingIndex] = target;
        createdLog = target;
        return existingLogs;
      }

      // Morning Ingress Check-In
      const newLog: WorkLog = {
        id: crypto.randomUUID(),
        phone_number: cleanPhone,
        worker_id: worker.id,
        worker_name: worker.name,
        latitude: lat,
        longitude: lng,
        message_type: lat ? 'location' : 'text',
        raw_message: rawMessage,
        estimated_wage: 600.0,
        agreed_wage: 600.0,
        actual_wage_earned: 600.0,
        amount_paid: 0,
        hours_worked: 8.0,
        created_at: nowIso,
        check_in_time: nowIso,
        date: today,
        location_name: siteName,
        status: 'pending',
        verification_status: 'location_submitted',
        verification_token: officialToken,
        token_hash: tokenHash,
        dispute_window_expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        estoppel_active: false,
        gps_accuracy_meters: 5.4,
        is_demo: false,
      };

      existingLogs.unshift(newLog);
      createdLog = newLog;
      return existingLogs;
    });

    if (!createdLog) {
      throw new Error('Failed to create or update work log');
    }

    return createdLog;
  }
}

export const ingressBuffer = new IngressBufferService();
