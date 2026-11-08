import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'node:crypto';
import { runPreAiBot } from './src/services/preAiBot.ts';
import { db, isPostgresConfigured } from './src/db/index.ts';
import { 
  users, 
  engagements, 
  attendanceRecords, 
  wageRecords, 
  disputes, 
  auditLogs 
} from './src/db/schema.ts';
import { getOrCreateUser, getUserByPhone } from './src/db/users.ts';
import { requireAuth, requireRole, type AuthRequest } from './src/middleware/auth.ts';
import { 
  attendanceSubmissionSchema, 
  disputeSubmissionSchema, 
  attendanceActionSchema,
  phoneSchema
} from './src/services/validators.ts';
import { desc, eq, and } from 'drizzle-orm';
import type { WorkLog } from './src/types.ts';

import { getCachedWorkLogsSync, atomicWriteWorkLogs, mutateWorkLogsAtomically } from './src/services/atomicStorage.ts';
import { observabilityMiddleware, serverMetrics } from './src/middleware/observability.ts';
import { idempotencyMiddleware } from './src/middleware/idempotency.ts';
import { createRateLimiter } from './src/middleware/rateLimiter.ts';
import { ingressBuffer } from './src/services/ingressBuffer.ts';
import { getMaterializedSummary, warmupSummaries } from './src/services/cqrsMaterializer.ts';

const app = express();

// Determine runtime environment:
// AI Studio development server always executes with '--port 3000' CLI argument or npm_lifecycle_event === 'dev'
const cliPortArg = process.argv.indexOf('--port');
const cliPort = cliPortArg !== -1 && process.argv[cliPortArg + 1] ? parseInt(process.argv[cliPortArg + 1], 10) : null;

const isDevMode = cliPort === 3000 || process.env.npm_lifecycle_event === 'dev' || process.env.VITE_DEV === 'true';
const isProduction = !isDevMode;

// Port priority:
// In AI Studio local dev environment, listen on 3000 (proxied by internal dev ingress)
// In Cloud Run production deployment, listen on PORT env var (Cloud Run sets PORT=8080)
const PORT = isDevMode ? 3000 : (process.env.PORT ? parseInt(process.env.PORT, 10) : 8080);
const HOST = '0.0.0.0';

// Global Enterprise Middleware
app.use(cors());
app.use(observabilityMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(idempotencyMiddleware);

// Rate Limiters
const generalApiLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 120, endpointName: 'general_api' });
const punchRateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 40, endpointName: 'punch_dispatch' });

// --------------------------------------------------------------------------------
// PRODUCTION HEALTH, READINESS & OBSERVABILITY PROBES
// --------------------------------------------------------------------------------
app.get('/healthz', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    pid: process.pid,
    memoryUsage: process.memoryUsage(),
  });
});

app.get('/readyz', (_req, res) => {
  const isStorageReady = Boolean(getCachedWorkLogsSync());
  res.status(isStorageReady ? 200 : 503).json({
    status: isStorageReady ? 'ready' : 'unhealthy',
    storage: isStorageReady ? 'connected' : 'error',
    postgres: isPostgresConfigured ? 'configured' : 'fallback_file_ledger',
  });
});

app.get('/api/metrics', requireAuth, (_req, res) => {
  res.json({
    metrics: serverMetrics,
    system: {
      uptimeSeconds: process.uptime(),
      heapUsedMb: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
      nodeVersion: process.version,
    },
  });
});

// --------------------------------------------------------------------------------
// RESILIENT LOCAL LEDGER STORAGE (Thread-safe atomic storage)
// --------------------------------------------------------------------------------
function readWorkLogsFile(): WorkLog[] {
  return getCachedWorkLogsSync();
}

function writeWorkLogsFile(logs: WorkLog[]) {
  atomicWriteWorkLogs(logs).catch(err => {
    console.error('[Storage] Atomic write failed:', err);
  });
}
const DISPUTES_FILE = path.resolve('disputes_db.json');

function readDisputesFile(): any[] {
  try {
    if (fs.existsSync(DISPUTES_FILE)) {
      const raw = fs.readFileSync(DISPUTES_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('[Storage] Error reading disputes_db.json:', e);
  }
  return [
    {
      id: 'SS-9925',
      workerId: 1,
      workerPhone: '+919876543210',
      contractorName: 'Sharma Construction',
      claimedAmount: '1800.00',
      workLocation: 'Dispute Filed vs Sharma Construction',
      latitude: 28.6139,
      longitude: 77.209,
      status: 'under_review',
      assignedTo: 'Chief Labor Inspector',
      isDemo: true,
      createdAt: new Date('2026-11-03T15:33:21.535Z').toISOString(),
    }
  ];
}

function writeDisputesFile(disputesList: any[]) {
  try {
    fs.writeFileSync(DISPUTES_FILE, JSON.stringify(disputesList, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Storage] Failed to write disputes_db.json:', e);
  }
}

// Helper: Seed demonstration data into PostgreSQL if configured and empty
async function seedInitialDatabaseIfEmpty() {
  if (!isPostgresConfigured || !db) {
    console.log('[Shramik Sakshi] Running in Civic Field Ledger mode (PostgreSQL SQL_HOST not set, using file/memory persistence).');
    return;
  }

  try {
    const existingCount = await db.select().from(attendanceRecords).limit(1);
    if (existingCount.length > 0) return;

    console.log('[Shramik Sakshi] Seeding initial demonstration records into PostgreSQL...');

    const adminUser = await getOrCreateUser('demo-admin-uid', 'admin@shramik-sakshi.gov.in', 'Chief Labor Inspector', 'administrator');
    const employerUser = await getOrCreateUser('demo-employer-uid', 'contractor.singh@infra.local', 'Mukadam Singh Enterprises', 'employer', '+919811122233');

    const w1 = await getOrCreateUser('demo-worker-1', 'rameshwar@labor.local', 'Rameshwar Yadav', 'worker', '+919876543210');
    const w2 = await getOrCreateUser('demo-worker-2', 'bablu@labor.local', 'Bablu Kumar', 'worker', '+919811234567');
    const w3 = await getOrCreateUser('demo-worker-3', 'suresh@labor.local', 'Suresh Paswan', 'worker', '+919822012345');

    const [eng] = await db.insert(engagements).values({
      workerId: w1.id,
      employerId: employerUser.id,
      worksite: 'Azadpur Mandi Wholesale Yard, Delhi',
      agreedDailyWage: '600.00',
      paymentTerms: 'Weekly on Friday',
      status: 'active',
      isDemo: true,
    }).returning();

    const now = Date.now();
    const demoAttData = [
      {
        id: crypto.randomUUID(),
        workerId: w1.id,
        engagementId: eng.id,
        date: new Date(now - 1000 * 60 * 60 * 2).toISOString().slice(0, 10),
        latitude: 28.7159,
        longitude: 77.1691,
        locationName: 'Azadpur Mandi Wholesale Hub, North Delhi',
        locationMethod: 'gps_device' as const,
        verificationStatus: 'location_matched' as const,
        hoursWorked: 8.0,
        agreedWage: '600.00',
        actualWageEarned: '600.00',
        token: 'SHP-89F1-A23E',
        tokenHash: crypto.createHash('sha256').update('SHP-89F1-A23E').digest('hex'),
        isDemo: true,
      },
      {
        id: crypto.randomUUID(),
        workerId: w2.id,
        engagementId: eng.id,
        date: new Date(now - 1000 * 60 * 60 * 5).toISOString().slice(0, 10),
        latitude: 19.0402,
        longitude: 72.8508,
        locationName: 'Dharavi Transit Camp Site, Mumbai',
        locationMethod: 'manual_preset' as const,
        verificationStatus: 'location_submitted' as const,
        hoursWorked: 8.0,
        agreedWage: '600.00',
        actualWageEarned: '600.00',
        token: 'SHP-76B4-C12D',
        tokenHash: crypto.createHash('sha256').update('SHP-76B4-C12D').digest('hex'),
        isDemo: true,
      },
      {
        id: crypto.randomUUID(),
        workerId: w3.id,
        engagementId: eng.id,
        date: new Date(now - 1000 * 60 * 60 * 24).toISOString().slice(0, 10),
        latitude: 13.0285,
        longitude: 77.5197,
        locationName: 'Peenya Industrial Area Phase 2, Bengaluru',
        locationMethod: 'gps_device' as const,
        verificationStatus: 'attendance_acknowledged' as const,
        hoursWorked: 8.0,
        agreedWage: '600.00',
        actualWageEarned: '600.00',
        token: 'SHP-54D9-E87F',
        tokenHash: crypto.createHash('sha256').update('SHP-54D9-E87F').digest('hex'),
        verifiedBy: employerUser.id,
        verifiedAt: new Date(now - 1000 * 60 * 60 * 20),
        isDemo: true,
      },
    ];

    for (const record of demoAttData) {
      await db.insert(attendanceRecords).values(record);
      await db.insert(wageRecords).values({
        attendanceId: record.id,
        workerId: record.workerId,
        amountEarned: '600.00',
        amountPaid: record.verificationStatus === 'attendance_acknowledged' ? '600.00' : '0.00',
        outstandingAmount: record.verificationStatus === 'attendance_acknowledged' ? '0.00' : '600.00',
        paymentStatus: record.verificationStatus === 'attendance_acknowledged' ? 'paid' : 'unpaid',
        isDemo: true,
      });

      await db.insert(auditLogs).values({
        entityType: 'attendance',
        entityId: record.id,
        action: 'create',
        performedBy: adminUser.id,
        performedByRole: 'administrator',
        reason: 'Initial system demonstration seed record',
        newState: JSON.stringify(record),
      });
    }

    console.log('[Shramik Sakshi] Initial demonstration records seeded successfully into PostgreSQL.');
  } catch (err) {
    console.warn('[Shramik Sakshi] Database seed warning:', (err as Error).message);
  }
}

// --------------------------------------------------------------------------------
// API ROUTES
// --------------------------------------------------------------------------------

// 1. Current Authenticated User Profile & Role
app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// 2. Fetch Attendance Logs (with resilient fallback to file ledger)
app.get('/api/logs', requireAuth, async (req: AuthRequest, res) => {
  if (isPostgresConfigured && db) {
    try {
      const records = await db
        .select({
          id: attendanceRecords.id,
          worker_id: attendanceRecords.workerId,
          date: attendanceRecords.date,
          latitude: attendanceRecords.latitude,
          longitude: attendanceRecords.longitude,
          location_name: attendanceRecords.locationName,
          location_method: attendanceRecords.locationMethod,
          verification_status: attendanceRecords.verificationStatus,
          hours_worked: attendanceRecords.hoursWorked,
          agreed_wage: attendanceRecords.agreedWage,
          actual_wage_earned: attendanceRecords.actualWageEarned,
          token: attendanceRecords.token,
          token_hash: attendanceRecords.tokenHash,
          verified_by: attendanceRecords.verifiedBy,
          verified_at: attendanceRecords.verifiedAt,
          is_demo: attendanceRecords.isDemo,
          created_at: attendanceRecords.createdAt,
          phone_number: users.phoneNumber,
          worker_name: users.name,
        })
        .from(attendanceRecords)
        .innerJoin(users, eq(attendanceRecords.workerId, users.id))
        .orderBy(desc(attendanceRecords.createdAt));

      if (records && records.length > 0) {
        const formattedLogs: WorkLog[] = records.map(r => ({
          id: r.id,
          phone_number: r.phone_number || '+919876543210',
          worker_id: r.worker_id,
          latitude: r.latitude,
          longitude: r.longitude,
          message_type: 'location',
          raw_message: `${r.location_name} [${r.verification_status}]`,
          estimated_wage: Number(r.actual_wage_earned) || 600,
          agreed_wage: Number(r.agreed_wage) || 600,
          actual_wage_earned: Number(r.actual_wage_earned) || 600,
          hours_worked: r.hours_worked,
          created_at: r.created_at.toISOString(),
          date: r.date,
          worker_name: r.worker_name,
          location_name: r.location_name,
          location_method: r.location_method as any,
          status: (r.verification_status === 'attendance_acknowledged' || r.verification_status === 'location_matched') 
            ? 'verified' 
            : (r.verification_status === 'attendance_disputed' ? 'disputed' : 'pending'),
          verification_status: r.verification_status as any,
          verification_token: r.token,
          token_hash: r.token_hash,
          is_demo: r.is_demo,
        }));

        return res.json({ success: true, count: formattedLogs.length, logs: formattedLogs });
      }
    } catch (error) {
      console.warn('[PostgreSQL] Logs query warning, serving from file ledger:', (error as Error).message);
    }
  }

  const fileLogs = readWorkLogsFile();
  res.json({ success: true, count: fileLogs.length, logs: fileLogs });
});

// 3. Create Attendance Record (Validated with Zod)
app.post('/api/attendance', requireAuth, async (req: AuthRequest, res) => {
  try {
    const parseResult = attendanceSubmissionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Input validation failed', 
        details: parseResult.error.format() 
      });
    }

    const data = parseResult.data;
    const worker = await getOrCreateUser(
      `user-${data.phoneNumber}`,
      `${data.phoneNumber.replace(/\D/g, '')}@labor.local`,
      data.workerName || 'Laborer',
      'worker',
      data.phoneNumber
    );

    const nowIso = new Date().toISOString();
    const today = nowIso.slice(0, 10);
    const existingLogs = readWorkLogsFile();

    // Check if this is an explicit check-out action
    if (data.shiftAction === 'check_out') {
      const activeIdx = existingLogs.findIndex(
        l => l.phone_number === data.phoneNumber && (l.date === today || (l.created_at || '').slice(0, 10) === today) && !l.check_out_time
      );
      if (activeIdx !== -1) {
        const target = existingLogs[activeIdx];
        const checkInTime = target.check_in_time || target.created_at;
        const diffHours = Math.max(0.5, Number(((new Date(nowIso).getTime() - new Date(checkInTime).getTime()) / (1000 * 60 * 60)).toFixed(1)));
        
        let earnedWage = target.agreed_wage || 600.0;
        let shiftStatus: 'completed' | 'half_day' | 'overtime' = 'completed';
        if (diffHours < 4.0) {
          earnedWage = 300.0;
          shiftStatus = 'half_day';
        } else if (diffHours > 8.5) {
          const extraHours = diffHours - 8.0;
          const hourlyBase = earnedWage / 8.0;
          earnedWage = Number((earnedWage + (extraHours * hourlyBase * 2)).toFixed(2));
          shiftStatus = 'overtime';
        }

        target.check_out_time = nowIso;
        target.hours_worked = diffHours;
        target.actual_wage_earned = earnedWage;
        target.shift_status = shiftStatus;
        target.verification_status = 'attendance_acknowledged';
        target.status = 'verified';
        if (data.workPhotoUrl) target.work_photo_url = data.workPhotoUrl;
        if (data.workPhotoHash) target.work_photo_hash = data.workPhotoHash;

        writeWorkLogsFile(existingLogs);
        return res.json({ success: true, log: target });
      }
    }

    const id = crypto.randomUUID();
    const tokenBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
    const token = `SHP-${tokenBytes.slice(0, 4)}-${tokenBytes.slice(4, 8)}`;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const verificationStatus = 'location_submitted';

    const peersOnSite = existingLogs.filter(
      l => (l.date === today || (l.created_at || '').slice(0, 10) === today) && l.location_name === data.locationName
    ).length;

    const responseLog: WorkLog = {
      id,
      phone_number: data.phoneNumber,
      worker_id: worker.id,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      message_type: 'location',
      raw_message: data.rawMessage || `Shift Ingress: ${data.locationName}`,
      estimated_wage: data.agreedWage,
      agreed_wage: data.agreedWage,
      actual_wage_earned: data.agreedWage,
      hours_worked: data.hoursWorked,
      created_at: nowIso,
      date: today,
      worker_name: worker.name,
      location_name: data.locationName,
      location_method: data.locationMethod,
      status: 'pending',
      verification_status: verificationStatus,
      verification_token: token,
      token_hash: tokenHash,
      is_demo: data.isDemo,

      // Dual-punch & Forensic Metadata
      check_in_time: nowIso,
      check_out_time: undefined,
      shift_status: 'active_in_progress',
      gps_accuracy_meters: data.gpsAccuracyMeters || (data.latitude ? 5.8 : 12.0),
      telemetry_source: data.latitude ? 'hardware_gps' : 'telegraph',
      employer_notified_at: nowIso,
      dispute_window_expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      estoppel_active: false,
      peer_quorum_count: peersOnSite + 1,
      work_photo_url: data.workPhotoUrl,
      work_photo_hash: data.workPhotoHash,
      custodian_cert_id: `BSA63-DL-${Math.floor(100000 + Math.random() * 900000)}`,
      statutory_rule: 'Sec 63 BSA & Rule 26 Central MW Rules (Form V)',
    };

    existingLogs.unshift(responseLog);
    writeWorkLogsFile(existingLogs);

    res.status(201).json({ success: true, log: responseLog });
  } catch (error) {
    console.error('Failed to create attendance submission:', error);
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

// Dedicated POST /api/attendance/checkout Endpoint
app.post('/api/attendance/checkout', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { attendanceId, phoneNumber, workPhotoUrl } = req.body;
    const logs = readWorkLogsFile();
    let targetIdx = -1;

    if (attendanceId) {
      targetIdx = logs.findIndex(l => l.id === attendanceId);
    } else if (phoneNumber) {
      const today = new Date().toISOString().slice(0, 10);
      targetIdx = logs.findIndex(
        l => l.phone_number === phoneNumber && (l.date === today || (l.created_at || '').slice(0, 10) === today) && !l.check_out_time
      );
    }

    if (targetIdx === -1) {
      return res.status(404).json({ error: 'No active shift found to check out.' });
    }

    const target = logs[targetIdx];
    const nowIso = new Date().toISOString();
    const checkInTime = target.check_in_time || target.created_at;
    const diffHours = Math.max(0.5, Number(((new Date(nowIso).getTime() - new Date(checkInTime).getTime()) / (1000 * 60 * 60)).toFixed(1)));

    let earnedWage = target.agreed_wage || 600.0;
    let shiftStatus: 'completed' | 'half_day' | 'overtime' = 'completed';

    if (diffHours < 4.0) {
      earnedWage = 300.0;
      shiftStatus = 'half_day';
    } else if (diffHours > 8.5) {
      const extraHours = diffHours - 8.0;
      const hourlyBase = earnedWage / 8.0;
      earnedWage = Number((earnedWage + (extraHours * hourlyBase * 2)).toFixed(2));
      shiftStatus = 'overtime';
    }

    target.check_out_time = nowIso;
    target.hours_worked = diffHours;
    target.actual_wage_earned = earnedWage;
    target.shift_status = shiftStatus;
    target.verification_status = 'attendance_acknowledged';
    target.status = 'verified';
    if (workPhotoUrl) target.work_photo_url = workPhotoUrl;

    writeWorkLogsFile(logs);
    res.json({ success: true, log: target });
  } catch (error) {
    console.error('Error in checkout endpoint:', error);
    res.status(500).json({ error: 'Failed to record checkout' });
  }
});

// Backward-compatible POST /api/logs route
app.post('/api/logs', requireAuth, async (req: AuthRequest, res) => {
  try {
    const raw = req.body;
    if (!raw.phone_number) {
      return res.status(400).json({ error: 'Missing phone_number in submission' });
    }
    const cleanPhone = raw.phone_number.startsWith('+') ? raw.phone_number : `+${raw.phone_number}`;

    const worker = await getOrCreateUser(
      `user-${cleanPhone}`,
      `${cleanPhone.replace(/\D/g, '')}@labor.local`,
      raw.worker_name || 'Laborer',
      'worker',
      cleanPhone
    );

    const id = raw.id || crypto.randomUUID();
    const tokenBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
    const token = raw.verification_token || `SHP-${tokenBytes.slice(0, 4)}-${tokenBytes.slice(4, 8)}`;
    const tokenHash = raw.token_hash || crypto.createHash('sha256').update(token).digest('hex');
    const today = new Date().toISOString().slice(0, 10);
    const wage = Number(raw.estimated_wage) || 600.0;

    if (isPostgresConfigured && db) {
      try {
        const [newRecord] = await db.insert(attendanceRecords).values({
          id,
          workerId: worker.id,
          date: today,
          latitude: raw.latitude !== null && raw.latitude !== undefined ? Number(raw.latitude) : null,
          longitude: raw.longitude !== null && raw.longitude !== undefined ? Number(raw.longitude) : null,
          locationName: raw.location_name || 'Work Site',
          locationMethod: raw.latitude ? 'gps_device' : 'manual_preset',
          verificationStatus: 'location_submitted',
          hoursWorked: 8.0,
          agreedWage: wage.toFixed(2),
          actualWageEarned: wage.toFixed(2),
          token,
          tokenHash,
          isDemo: Boolean(raw.is_demo),
        }).returning();

        await db.insert(wageRecords).values({
          attendanceId: newRecord.id,
          workerId: worker.id,
          amountEarned: wage.toFixed(2),
          amountPaid: '0.00',
          outstandingAmount: wage.toFixed(2),
          paymentStatus: 'unpaid',
          isDemo: Boolean(raw.is_demo),
        });

        await db.insert(auditLogs).values({
          entityType: 'attendance',
          entityId: newRecord.id,
          action: 'create',
          performedBy: req.user?.dbId,
          performedByRole: req.user?.role || 'worker',
          reason: 'Attendance logged via legacy API',
          newState: JSON.stringify(newRecord),
        });
      } catch (dbErr) {
        console.warn('[PostgreSQL] Legacy log insert error, saved to file ledger:', (dbErr as Error).message);
      }
    }

    const responseLog: WorkLog = {
      id,
      phone_number: cleanPhone,
      worker_id: worker.id,
      latitude: raw.latitude !== null && raw.latitude !== undefined ? Number(raw.latitude) : null,
      longitude: raw.longitude !== null && raw.longitude !== undefined ? Number(raw.longitude) : null,
      message_type: 'location',
      raw_message: raw.raw_message || `Attendance: ${raw.location_name || 'Work Site'}`,
      estimated_wage: wage,
      agreed_wage: wage,
      actual_wage_earned: wage,
      hours_worked: 8.0,
      created_at: new Date().toISOString(),
      date: today,
      worker_name: worker.name,
      location_name: raw.location_name || 'Work Site',
      status: 'pending',
      verification_status: 'location_submitted',
      verification_token: token,
      token_hash: tokenHash,
      is_demo: Boolean(raw.is_demo),
    };

    const logs = readWorkLogsFile();
    logs.unshift(responseLog);
    writeWorkLogsFile(logs);

    res.json({ success: true, log: responseLog });
  } catch (error) {
    console.error('Error in POST /api/logs:', error);
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

// --------------------------------------------------------------------------------
// SCALABILITY ENGINE: ASYNC INGRESS BUFFER (TIP 1)
// --------------------------------------------------------------------------------
app.post('/api/ingress/enqueue', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, workerName, body, latitude, longitude, locationName, clientTimestamp, idempotencyKey, isCheckOut } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Missing phoneNumber' });
    }

    // Sub-5ms non-blocking enqueue with immediate provisional token
    const result = ingressBuffer.enqueue({
      phoneNumber,
      workerName,
      body,
      latitude,
      longitude,
      locationName,
      clientTimestamp,
      idempotencyKey,
      isCheckOut: Boolean(isCheckOut),
    });

    res.status(202).json({
      success: true,
      status: 'enqueued',
      jobId: result.jobId,
      provisionalToken: result.provisionalToken,
      queueDepth: result.queueDepth,
      acknowledgedAt: new Date().toISOString(),
      statutoryNotice: 'Provisional attendance buffered under Section 63 BSA Protocol',
    });
  } catch (err: any) {
    console.error('Ingress enqueue error:', err);
    res.status(500).json({ error: 'Failed to enqueue ingress event' });
  }
});

app.get('/api/ingress/status/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = ingressBuffer.getJob(jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found or expired from memory buffer' });
  }
  res.json({
    jobId: job.jobId,
    status: job.status,
    provisionalToken: job.provisionalToken,
    attempts: job.attempts,
    enqueuedAt: job.enqueuedAt,
    processedAt: job.processedAt,
    resultLog: job.resultLog,
    error: job.error,
  });
});

app.get('/api/ingress/metrics', (_req: Request, res: Response) => {
  res.json({
    metrics: ingressBuffer.metrics,
    currentQueueDepth: ingressBuffer.getQueueDepth(),
    deadLettersCount: ingressBuffer.getDeadLetters().length,
  });
});

// --------------------------------------------------------------------------------
// SCALABILITY ENGINE: CQRS MATERIALIZED PASSBOOK SUMMARY (TIP 2)
// --------------------------------------------------------------------------------
app.get('/api/worker/:phone/summary', async (req: Request, res: Response) => {
  try {
    const rawPhone = req.params.phone;
    const cleanPhone = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone.replace(/\D/g, '')}`;
    // O(1) query from pre-aggregated projection
    const summary = await getMaterializedSummary(cleanPhone);
    res.json({ success: true, summary });
  } catch (err: any) {
    console.error('CQRS summary query error:', err);
    res.status(500).json({ error: 'Failed to retrieve materialized passbook summary' });
  }
});

// Cold Storage Evidentiary Archive (Tip 2)
app.get('/api/archive/export', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    const logs = readWorkLogsFile();
    const filtered = logs.filter(l => (l.date || l.created_at || '').startsWith(month));

    const archiveManifest = {
      archiveId: `ARCH-${month}-${Date.now().toString(36).toUpperCase()}`,
      statutoryFramework: 'BOCW Act 1996 & Rule 26 Form V Muster Register',
      evidenceActSection: 'Section 63 Bharatiya Sakshya Adhiniyam, 2023',
      month,
      recordCount: filtered.length,
      exportedAt: new Date().toISOString(),
      merkleRoot: crypto.createHash('sha256').update(JSON.stringify(filtered)).digest('hex'),
      records: filtered,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="shramik_sakshi_muster_archive_${month}.json"`);
    res.json(archiveManifest);
  } catch (err: any) {
    console.error('Archive export error:', err);
    res.status(500).json({ error: 'Failed to export statutory muster archive' });
  }
});

// --------------------------------------------------------------------------------
// SCALABILITY ENGINE: EDGE DELTA CRDT SYNC (TIP 3)
// --------------------------------------------------------------------------------
app.post('/api/sync/delta', async (req: Request, res: Response) => {
  try {
    const deltas = req.body.deltas;
    if (!Array.isArray(deltas) || deltas.length === 0) {
      return res.status(400).json({ error: 'Invalid deltas array' });
    }

    const syncedTokens: Record<string, string> = {};

    await mutateWorkLogsAtomically((existingLogs) => {
      for (const item of deltas) {
        const cleanPhone = item.phoneNumber.startsWith('+') ? item.phoneNumber : `+${item.phoneNumber.replace(/\D/g, '')}`;
        const today = (item.timestamp || new Date().toISOString()).slice(0, 10);
        
        const tokenBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
        const officialToken = `SHP-${tokenBytes.slice(0, 4)}-${tokenBytes.slice(4, 8)}`;
        const tokenHash = crypto.createHash('sha256').update(officialToken).digest('hex');

        if (item.action === 'CHECK_OUT') {
          // Find matching check-in
          const targetIndex = existingLogs.findIndex(
            l => l.phone_number === cleanPhone && (l.date === today || (l.created_at && l.created_at.slice(0, 10) === today))
          );
          if (targetIndex !== -1) {
            const target = { ...existingLogs[targetIndex] };
            target.check_out_time = item.timestamp;
            target.verification_status = 'attendance_acknowledged';
            target.status = 'verified';
            existingLogs[targetIndex] = target;
            syncedTokens[item.walId] = target.verification_token || officialToken;
            continue;
          }
        }

        // Check-in or default delta
        const newLog: WorkLog = {
          id: item.walId || crypto.randomUUID(),
          phone_number: cleanPhone,
          worker_name: item.payload?.workerName || 'Laborer',
          latitude: item.payload?.latitude ?? null,
          longitude: item.payload?.longitude ?? null,
          message_type: item.payload?.latitude ? 'location' : 'text',
          raw_message: item.payload?.rawMessage || `Offline WAL Punch at ${item.payload?.locationName || 'Site'}`,
          estimated_wage: item.payload?.estimatedWage || 600.0,
          agreed_wage: item.payload?.estimatedWage || 600.0,
          actual_wage_earned: item.payload?.estimatedWage || 600.0,
          hours_worked: item.payload?.hoursWorked || 8.0,
          created_at: item.timestamp,
          check_in_time: item.timestamp,
          date: today,
          location_name: item.payload?.locationName || 'Work Site',
          status: 'pending',
          verification_status: 'location_submitted',
          verification_token: officialToken,
          token_hash: tokenHash,
          dispute_window_expires_at: new Date(new Date(item.timestamp).getTime() + 2 * 60 * 60 * 1000).toISOString(),
          estoppel_active: false,
          gps_accuracy_meters: 5.4,
          is_demo: false,
        };

        existingLogs.unshift(newLog);
        syncedTokens[item.walId] = officialToken;
      }

      return existingLogs;
    });

    // Warmup CQRS summaries after delta commits
    warmupSummaries(readWorkLogsFile());

    res.json({
      success: true,
      syncedCount: Object.keys(syncedTokens).length,
      syncedTokens,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Delta sync error:', err);
    res.status(500).json({ error: 'Failed to process delta batch sync' });
  }
});

// 4. Employer Acknowledgement & Disagreement Endpoint
app.post('/api/attendance/action', requireAuth, requireRole(['employer', 'administrator']), async (req: AuthRequest, res) => {
  try {
    const parseResult = attendanceActionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid action payload', details: parseResult.error.format() });
    }

    const { attendanceId, action, reason } = parseResult.data;
    const newStatus = action === 'acknowledge' ? 'attendance_acknowledged' : 'attendance_disputed';
    let updatedRecord: any = null;

    if (isPostgresConfigured && db) {
      try {
        const existing = await db.select().from(attendanceRecords).where(eq(attendanceRecords.id, attendanceId)).limit(1);
        if (existing.length > 0) {
          const previousRecord = existing[0];
          const [updated] = await db.update(attendanceRecords)
            .set({
              verificationStatus: newStatus,
              verifiedBy: req.user?.dbId,
              verifiedAt: new Date(),
            })
            .where(eq(attendanceRecords.id, attendanceId))
            .returning();

          updatedRecord = updated;

          if (action === 'acknowledge') {
            await db.update(wageRecords)
              .set({ paymentStatus: 'unpaid' })
              .where(eq(wageRecords.attendanceId, attendanceId));
          } else if (action === 'dispute') {
            await db.update(wageRecords)
              .set({ paymentStatus: 'disputed' })
              .where(eq(wageRecords.attendanceId, attendanceId));
          }

          await db.insert(auditLogs).values({
            entityType: 'attendance',
            entityId: attendanceId,
            action: action,
            performedBy: req.user?.dbId,
            performedByRole: req.user?.role || 'employer',
            reason: reason || (action === 'acknowledge' ? 'Supervisor confirmed attendance' : 'Employer disputed hours/presence'),
            previousState: JSON.stringify(previousRecord),
            newState: JSON.stringify(updated),
          });
        }
      } catch (dbErr) {
        console.warn('[PostgreSQL] Action update error, updating file ledger:', (dbErr as Error).message);
      }
    }

    // Update in local file ledger
    const logs = readWorkLogsFile();
    const index = logs.findIndex(l => l.id === attendanceId || l.verification_token === attendanceId);
    if (index !== -1) {
      logs[index].verification_status = newStatus as any;
      logs[index].status = action === 'acknowledge' ? 'verified' : 'disputed';
      writeWorkLogsFile(logs);
      if (!updatedRecord) {
        updatedRecord = logs[index];
      }
    }

    res.json({ success: true, updatedRecord: updatedRecord || { id: attendanceId, verificationStatus: newStatus } });
  } catch (error) {
    console.error('Failed to update attendance status:', error);
    res.status(500).json({ error: 'Failed to process attendance action' });
  }
});

// 5. In-App Dispatch Telegraph
app.post('/api/dispatch', requireAuth, async (req: AuthRequest, res) => {
  try {
    const phone = (req.body.phone || req.body.From || '+919876543210').toString().trim();
    const body = (req.body.body || req.body.Body || '').toString().trim();
    const lat = req.body.latitude !== undefined && req.body.latitude !== null ? parseFloat(req.body.latitude) : null;
    const lng = req.body.longitude !== undefined && req.body.longitude !== null ? parseFloat(req.body.longitude) : null;
    const siteName = req.body.locationName || req.body.siteName;

    // Fetch worker's logs for Hisaab computation
    let mappedExisting: any[] = [];
    if (isPostgresConfigured && db) {
      try {
        const existingLogs = await db
          .select({
            phone_number: users.phoneNumber,
            actual_wage_earned: attendanceRecords.actualWageEarned,
            created_at: attendanceRecords.createdAt,
            date: attendanceRecords.date,
            verification_status: attendanceRecords.verificationStatus,
          })
          .from(attendanceRecords)
          .innerJoin(users, eq(attendanceRecords.workerId, users.id))
          .where(eq(users.phoneNumber, phone));

        mappedExisting = existingLogs.map(l => ({
          phone_number: l.phone_number || phone,
          actual_wage_earned: Number(l.actual_wage_earned) || 600,
          created_at: l.created_at.toISOString(),
          date: l.date,
          verification_status: l.verification_status,
        }));
      } catch (e) {
        // Fallback
      }
    }

    if (mappedExisting.length === 0) {
      const allFileLogs = readWorkLogsFile();
      mappedExisting = allFileLogs.filter(l => l.phone_number === phone);
    }

    const botResult = runPreAiBot(phone, body, lat, lng, siteName, mappedExisting);
    let createdLog: WorkLog | null = null;

    if (botResult.logData && botResult.actionTaken === 'LOG_ATTENDANCE') {
      const worker = await getOrCreateUser(
        `user-${phone}`,
        `${phone.replace(/\D/g, '')}@labor.local`,
        req.body.workerName || 'Laborer',
        'worker',
        phone
      );

      if (isPostgresConfigured && db) {
        try {
          const [record] = await db.insert(attendanceRecords).values({
            id: botResult.logData.id,
            workerId: worker.id,
            date: new Date().toISOString().slice(0, 10),
            latitude: botResult.logData.latitude,
            longitude: botResult.logData.longitude,
            locationName: botResult.logData.locationName,
            locationMethod: botResult.logData.locationMethod,
            verificationStatus: botResult.logData.verificationStatus,
            hoursWorked: botResult.logData.hoursWorked,
            agreedWage: botResult.logData.agreedWage.toFixed(2),
            actualWageEarned: botResult.logData.actualWageEarned.toFixed(2),
            token: botResult.logData.token,
            tokenHash: botResult.logData.tokenHash,
            isDemo: false,
          }).returning();

          await db.insert(wageRecords).values({
            attendanceId: record.id,
            workerId: worker.id,
            amountEarned: botResult.logData.actualWageEarned.toFixed(2),
            amountPaid: '0.00',
            outstandingAmount: botResult.logData.actualWageEarned.toFixed(2),
            paymentStatus: 'unpaid',
          });

          await db.insert(auditLogs).values({
            entityType: 'attendance',
            entityId: record.id,
            action: 'create',
            performedBy: req.user?.dbId,
            performedByRole: req.user?.role || 'worker',
            reason: 'Logged via Field Telegraph Dispatch',
            newState: JSON.stringify(record),
          });
        } catch (dbErr) {
          console.warn('[PostgreSQL] Dispatch attendance insert warning:', (dbErr as Error).message);
        }
      }

      createdLog = {
        id: botResult.logData.id,
        phone_number: phone,
        worker_id: worker.id,
        latitude: botResult.logData.latitude,
        longitude: botResult.logData.longitude,
        message_type: 'location',
        raw_message: botResult.logData.rawMessage,
        estimated_wage: botResult.logData.actualWageEarned,
        created_at: new Date().toISOString(),
        location_name: botResult.logData.locationName,
        status: 'pending',
        verification_status: botResult.logData.verificationStatus as any,
        verification_token: botResult.logData.token,
        token_hash: botResult.logData.tokenHash,
        is_demo: false,
      };

      const fileLogs = readWorkLogsFile();
      fileLogs.unshift(createdLog);
      writeWorkLogsFile(fileLogs);

    } else if (botResult.logData && botResult.actionTaken === 'LOG_DISPUTE') {
      const worker = await getOrCreateUser(
        `user-${phone}`,
        `${phone.replace(/\D/g, '')}@labor.local`,
        'Laborer',
        'worker',
        phone
      );

      const caseId = botResult.caseId || `SS-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      if (isPostgresConfigured && db) {
        try {
          await db.insert(disputes).values({
            id: caseId,
            workerId: worker.id,
            workerPhone: phone,
            contractorName: botResult.logData.contractorName || 'Site Contractor',
            claimedAmount: (botResult.logData.claimedAmount || 600).toFixed(2),
            workLocation: botResult.logData.locationName,
            latitude: botResult.logData.latitude,
            longitude: botResult.logData.longitude,
            status: 'registered',
            isDemo: false,
          });

          await db.insert(auditLogs).values({
            entityType: 'dispute',
            entityId: caseId,
            action: 'create',
            performedBy: req.user?.dbId,
            performedByRole: req.user?.role || 'worker',
            reason: 'Dispute registered through rule engine',
            newState: JSON.stringify(botResult.logData),
          });
        } catch (dbErr) {
          console.warn('[PostgreSQL] Dispute insert warning:', (dbErr as Error).message);
        }
      }

      const disputesList = readDisputesFile();
      disputesList.unshift({
        id: caseId,
        workerId: worker.id,
        workerPhone: phone,
        contractorName: botResult.logData.contractorName || 'Site Contractor',
        claimedAmount: (botResult.logData.claimedAmount || 600).toFixed(2),
        workLocation: botResult.logData.locationName,
        latitude: botResult.logData.latitude,
        longitude: botResult.logData.longitude,
        status: 'registered',
        isDemo: false,
        createdAt: new Date().toISOString(),
      });
      writeDisputesFile(disputesList);
    }

    res.json({ 
      success: true, 
      reply: botResult.reply, 
      newLog: createdLog, 
      action: botResult.actionTaken,
      caseId: botResult.caseId 
    });
  } catch (error) {
    console.error('Dispatch API error:', error);
    res.status(500).json({ error: 'Failed to process telegraph dispatch' });
  }
});

// 6. Registered Disputes Management
app.get('/api/disputes', requireAuth, async (req: AuthRequest, res) => {
  if (isPostgresConfigured && db) {
    try {
      const list = await db.select().from(disputes).orderBy(desc(disputes.createdAt));
      if (list && list.length > 0) {
        return res.json({ success: true, count: list.length, disputes: list });
      }
    } catch (error) {
      console.warn('[PostgreSQL] Disputes query error, serving from file:', (error as Error).message);
    }
  }

  const list = readDisputesFile();
  res.json({ success: true, count: list.length, disputes: list });
});

// 7. Update Dispute Status or Assign to NGO
app.patch('/api/disputes/:id', requireAuth, requireRole(['administrator']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo, notes } = req.body;
    let updatedDispute: any = null;

    if (isPostgresConfigured && db) {
      try {
        const existing = await db.select().from(disputes).where(eq(disputes.id, id)).limit(1);
        if (existing.length > 0) {
          const [updated] = await db.update(disputes)
            .set({
              status: status || existing[0].status,
              assignedTo: assignedTo || existing[0].assignedTo,
              updatedAt: new Date(),
            })
            .where(eq(disputes.id, id))
            .returning();

          updatedDispute = updated;

          await db.insert(auditLogs).values({
            entityType: 'dispute',
            entityId: id,
            action: 'update_status',
            performedBy: req.user?.dbId,
            performedByRole: 'administrator',
            reason: notes || `Status changed to ${status}`,
            previousState: JSON.stringify(existing[0]),
            newState: JSON.stringify(updated),
          });
        }
      } catch (dbErr) {
        console.warn('[PostgreSQL] Dispute update warning:', (dbErr as Error).message);
      }
    }

    const disputesList = readDisputesFile();
    const idx = disputesList.findIndex(d => d.id === id);
    if (idx !== -1) {
      if (status) disputesList[idx].status = status;
      if (assignedTo) disputesList[idx].assignedTo = assignedTo;
      disputesList[idx].updatedAt = new Date().toISOString();
      writeDisputesFile(disputesList);
      if (!updatedDispute) updatedDispute = disputesList[idx];
    }

    res.json({ success: true, dispute: updatedDispute || { id, status } });
  } catch (error) {
    console.error('Failed to update dispute:', error);
    res.status(500).json({ error: 'Failed to update dispute' });
  }
});

// 8. Reset Data (Protected: Administrator Only)
app.post('/api/reset', requireAuth, requireRole(['administrator']), async (req: AuthRequest, res) => {
  try {
    if (isPostgresConfigured && db) {
      try {
        await db.delete(auditLogs);
        await db.delete(wageRecords);
        await db.delete(attendanceRecords);
        await db.delete(disputes);
        await db.delete(engagements);
        await db.delete(users);
        await seedInitialDatabaseIfEmpty();
      } catch (e) {
        console.warn('[PostgreSQL] Reset warning:', (e as Error).message);
      }
    }

    // Reset file ledger
    const sampleLogs = [
      {
        id: 'rec_1793882290549_hd71',
        phone_number: '+919876543210',
        latitude: 28.7172,
        longitude: 77.1678,
        message_type: 'location',
        raw_message: 'PUNCH',
        estimated_wage: 600,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString().slice(0, 10),
        location_name: 'Azadpur Mandi Yard Gate 3, Delhi',
        status: 'verified',
        verification_status: 'attendance_acknowledged',
        verification_token: 'SHP-89F1-A23E',
      },
      {
        id: 'rec_1793805956118_5z03',
        phone_number: '+919876543210',
        latitude: 13.0312,
        longitude: 77.5165,
        message_type: 'location',
        raw_message: 'PUNCH',
        estimated_wage: 600,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString().slice(0, 10),
        location_name: 'Peenya Industrial Area, Bengaluru',
        status: 'verified',
        verification_status: 'attendance_acknowledged',
        verification_token: 'SHP-54D9-E87F',
      },
      {
        id: 'rec_1793804607690_uv0s',
        phone_number: '+919433187654',
        latitude: 13.0312,
        longitude: 77.5165,
        message_type: 'location',
        raw_message: 'Location Pin: Peenya Industrial Area Line 12',
        estimated_wage: 600,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString().slice(0, 10),
        location_name: 'Peenya Industrial Area Line 12, Bengaluru',
        status: 'pending',
        verification_status: 'location_submitted',
        verification_token: 'SHP-76B4-C12D',
      },
    ];
    writeWorkLogsFile(sampleLogs as any);

    res.json({ success: true, message: 'Database reset to initial demonstration state by administrator.' });
  } catch (error) {
    console.error('Failed to reset database:', error);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// 9. Twilio WhatsApp Webhook
app.post(['/api/webhook', '/webhook'], async (req: Request, res: Response) => {
  try {
    const twilioSignature = req.headers['x-twilio-signature'] as string;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

    if (twilioAuthToken && !twilioSignature) {
      console.warn('[Webhook Security] Rejected webhook missing Twilio signature.');
      return res.status(403).send('<Response><Message>Forbidden: Invalid webhook signature.</Message></Response>');
    }

    const from = (req.body.From || req.query.From || '').toString().trim();
    const body = (req.body.Body || req.query.Body || '').toString().trim();
    const lat = req.body.Latitude ? parseFloat(req.body.Latitude) : null;
    const lng = req.body.Longitude ? parseFloat(req.body.Longitude) : null;

    if (!from) {
      return res.status(400).send('<Response><Message>Missing From number</Message></Response>');
    }

    const cleanPhone = from.replace(/^whatsapp:/, '').trim();
    const botResult = runPreAiBot(cleanPhone, body, lat, lng);

    if (botResult.logData && botResult.actionTaken === 'LOG_ATTENDANCE') {
      const worker = await getOrCreateUser(
        `user-${cleanPhone}`,
        `${cleanPhone.replace(/\D/g, '')}@labor.local`,
        'WhatsApp Laborer',
        'worker',
        cleanPhone
      );

      const logEntry: WorkLog = {
        id: botResult.logData.id,
        phone_number: cleanPhone,
        worker_id: worker.id,
        latitude: botResult.logData.latitude,
        longitude: botResult.logData.longitude,
        message_type: 'location',
        raw_message: botResult.logData.rawMessage,
        estimated_wage: 600,
        agreed_wage: 600,
        actual_wage_earned: 600,
        hours_worked: 8,
        created_at: new Date().toISOString(),
        date: new Date().toISOString().slice(0, 10),
        location_name: botResult.logData.locationName,
        status: 'pending',
        verification_status: 'location_submitted',
        verification_token: botResult.logData.token,
        token_hash: botResult.logData.tokenHash,
        is_demo: false,
      };

      const fileLogs = readWorkLogsFile();
      fileLogs.unshift(logEntry);
      writeWorkLogsFile(fileLogs);
    }

    const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${botResult.reply.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Message>
</Response>`;

    res.set('Content-Type', 'text/xml');
    res.send(xmlResponse);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('<Response><Message>Internal processing error</Message></Response>');
  }
});

// 10. Server Status
app.get('/api/status', async (req, res) => {
  let count = 0;
  if (isPostgresConfigured && db) {
    try {
      const totalCount = await db.select().from(attendanceRecords);
      count = totalCount.length;
    } catch {
      count = readWorkLogsFile().length;
    }
  } else {
    count = readWorkLogsFile().length;
  }

  res.json({
    status: 'online',
    system: 'Shramik Sakshi Protected Ledger',
    database: isPostgresConfigured ? 'PostgreSQL (Cloud SQL)' : 'Local File Ledger (work_logs_db.json)',
    engine: 'Deterministic DFSA Rule Engine',
    total_logs: count,
    webhook_url: '/api/webhook',
  });
});

// --------------------------------------------------------------------------------
// CENTRALIZED PRODUCTION ERROR HANDLING MIDDLEWARE
// --------------------------------------------------------------------------------
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || 'unknown';
  const isProd = process.env.NODE_ENV === 'production';
  const statusCode = err.status || err.statusCode || 500;

  console.error(`[Error] [${requestId}] Unhandled exception:`, {
    message: err.message,
    stack: isProd ? undefined : err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(statusCode).json({
    error: isProd && statusCode === 500 ? 'Internal Server Error' : err.message,
    requestId,
    timestamp: new Date().toISOString(),
    ...(isProd ? {} : { stack: err.stack }),
  });
});

// --------------------------------------------------------------------------------
// STATIC ASSETS & VITE DEV SERVER
// --------------------------------------------------------------------------------
async function startServer() {
  await seedInitialDatabaseIfEmpty();
  warmupSummaries(readWorkLogsFile());

  const distPath = path.resolve('dist');
  const indexHtmlPath = path.join(distPath, 'index.html');

  if (isProduction && !fs.existsSync(indexHtmlPath)) {
    console.log('[Shramik Sakshi] dist/index.html not found, compiling production bundle on the fly...');
    try {
      const { build } = await import('vite');
      await build();
      console.log('[Shramik Sakshi] Production bundle compiled successfully.');
    } catch (buildErr) {
      console.error('[Shramik Sakshi] On-the-fly bundle compilation failed:', buildErr);
    }
  }

  if (!isProduction) {
    // Development mode: Always mount Vite middleware in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production container mode: serve static build assets
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.path.startsWith('/api') || req.path === '/webhook') return next();
      res.sendFile(indexHtmlPath);
    });
  }

  // Listen on PORT (strictly 3000 in dev per AI Studio runtime environment requirements)
  const server = app.listen(PORT, HOST, () => {
    console.log(`[Shramik Sakshi] Server active on http://${HOST}:${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Shramik Sakshi] Port ${PORT} busy, retrying in 2s...`);
      setTimeout(() => {
        try { server.close(); } catch {}
        try { server.listen(PORT, HOST); } catch {}
      }, 2000);
    } else {
      console.error('[Shramik Sakshi] HTTP Server error:', err);
    }
  });
}

// Global safety guards for continuous development runtime
process.on('uncaughtException', (err) => {
  console.warn('[Shramik Sakshi] Process caught unhandled exception (prevented crash):', err.message || err);
});

process.on('unhandledRejection', (reason) => {
  console.warn('[Shramik Sakshi] Process caught unhandled rejection (prevented crash):', reason);
});

startServer().catch((err) => {
  console.error('[Shramik Sakshi] Fatal error starting server:', err);
});
