import {
  WorkLog,
  RegisteredLabour,
  RetentionHoldRecord,
  SiteComplianceSummary,
  WorkerSkillCredential,
  SkillTier,
  SiteDeploymentOffer,
} from '../types';
import { isEstoppelActive, getPeerQuorumCount } from './storage';

const RETENTION_HOLDS_KEY = 'shramik_sakshi_retention_holds_v1';
const SITE_OFFERS_KEY = 'shramik_sakshi_site_offers_v1';

export const DEFAULT_SITE_OFFERS: SiteDeploymentOffer[] = [
  {
    id: 'OFFER-2026-101',
    workerPhone: '+919876543210',
    workerName: 'Rameshwar Yadav',
    trade: 'Mason (राजमिस्त्री)',
    employerName: 'Larsen & Metro Civic Works Ltd.',
    projectSite: 'Peenya Metro Corridor Phase III, Bengaluru',
    offeredDailyWage: 750,
    durationDays: 30,
    startDate: '2026-11-18',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 'OFFER-2026-102',
    workerPhone: '+919822012345',
    workerName: 'Suresh Paswan',
    trade: 'Carpenter (बढ़ई / शटरिंग)',
    employerName: 'Deccan Infrastructure EPC',
    projectSite: 'Peenya Industrial Area, Bengaluru',
    offeredDailyWage: 800,
    durationDays: 45,
    startDate: '2026-11-20',
    status: 'accepted',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
];

function normalizeSiteKey(name?: string): { key: string; label: string } {
  const raw = (name || 'Unassigned Worksite').trim();
  const shortLabel = raw.split('(')[0].trim() || raw;
  const normalized = shortLabel
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/,\s*/g, ', ');
  return { key: normalized, label: shortLabel };
}

function inferContractorForSite(siteLabel: string): string {
  const lower = siteLabel.toLowerCase();
  if (lower.includes('azadpur')) return 'North Delhi Infra & Yard Contractors';
  if (lower.includes('dharavi')) return 'Western Civic Redevelopment Corp.';
  if (lower.includes('peenya')) return 'Peenya Fabrication & EPC Associates';
  if (lower.includes('gomti') || lower.includes('lucknow')) return 'Awadh Expressway Sub-Contractors';
  if (lower.includes('okhla')) return 'Yamuna Industrial Civil Works';
  if (lower.includes('sanathnagar')) return 'Deccan Logistics & Civil Guild';
  return 'Site Sub-Contractor (Form V Principal)';
}

function deriveCredentialHash(phone: string, verifiedDays: number, totalHours: number): string {
  const seed = `${phone}::${verifiedDays}::${totalHours.toFixed(1)}::SHRAMIK_BSA63`;
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 16777619);
    h2 = Math.imul(h2 ^ c, 2246822507);
  }
  const part1 = Math.abs(h1).toString(16).toUpperCase().padStart(8, '0');
  const part2 = Math.abs(h2).toString(16).toUpperCase().padStart(8, '0');
  return `CRED-${part1}-${part2}`;
}

/**
 * Pivot 1: Principal Employer & EPC Statutory Joint-Liability Compliance Aggregation.
 * Computes Form V readiness, ghost-worker anomaly flags, Sec 121 estoppel lock counts,
 * and unpaid wage joint-liability exposure per worksite/sub-contractor.
 */
export function computeSiteComplianceSummaries(
  logs: WorkLog[],
  workers: RegisteredLabour[],
  holds: RetentionHoldRecord[]
): SiteComplianceSummary[] {
  const siteGroups = new Map<string, { label: string; logs: WorkLog[] }>();

  logs.forEach((log) => {
    const { key, label } = normalizeSiteKey(log.location_name || log.nearest_hub_name || 'Unassigned Worksite');
    const existing = siteGroups.get(key);
    if (existing) {
      existing.logs.push(log);
    } else {
      siteGroups.set(key, { label, logs: [log] });
    }
  });

  // Also ensure registered worksites with zero logs yet appear if needed? Only if logs exist, or include registered sites without logs cleanly
  const workerPhoneMap = new Map<string, RegisteredLabour>();
  workers.forEach((w) => workerPhoneMap.set(w.phoneNumber, w));

  const summaries: SiteComplianceSummary[] = [];

  siteGroups.forEach(({ label, logs: siteLogs }, siteKey) => {
    const uniqueWorkersSet = new Set(siteLogs.map((l) => l.phone_number).filter(Boolean));

    let verifiedCount = 0;
    let pendingCount = 0;
    let disputedCount = 0;
    let estoppelLockedCount = 0;
    let grossWagesINR = 0;
    let paidWagesINR = 0;
    let courtCompleteCount = 0;

    let hasCoarseGps = false;
    let hasSingletonQuorum = false;
    let hasSpoofRisk = false;
    let hasStaleActiveShift = false;
    let flaggedExposureINR = 0;

    const nowMs = Date.now();

    siteLogs.forEach((log) => {
      const earned = Number(log.actual_wage_earned ?? log.agreed_wage ?? log.estimated_wage) || 600;
      const paid = Number(log.amount_paid) || 0;
      grossWagesINR += earned;
      paidWagesINR += paid;

      const isDisputed = log.verification_status === 'attendance_disputed' || log.status === 'disputed';
      const isAck = log.verification_status === 'attendance_acknowledged' || log.status === 'verified';
      const estoppel = isEstoppelActive(log);

      if (isDisputed) {
        disputedCount += 1;
      } else if (isAck) {
        verifiedCount += 1;
      } else {
        pendingCount += 1;
      }

      if (estoppel && !isDisputed) {
        estoppelLockedCount += 1;
      }

      const acc = log.gps_accuracy_meters;
      const hasCoords = log.latitude !== null && log.longitude !== null && !isNaN(Number(log.latitude)) && !isNaN(Number(log.longitude));
      if (!hasCoords || (acc !== undefined && acc > 25)) {
        hasCoarseGps = true;
        flaggedExposureINR += Math.max(0, earned - paid);
      }

      if (log.mock_location_detected) {
        hasSpoofRisk = true;
        flaggedExposureINR += Math.max(0, earned - paid);
      }

      const quorum = getPeerQuorumCount(log, logs);
      if (quorum <= 1) {
        hasSingletonQuorum = true;
      }

      if (!log.check_out_time && log.shift_status === 'active_in_progress') {
        const checkInMs = new Date(log.check_in_time || log.created_at).getTime();
        if (nowMs - checkInMs > 14 * 60 * 60 * 1000) {
          hasStaleActiveShift = true;
        }
      }

      if (hasCoords && !log.mock_location_detected && (isAck || estoppel)) {
        courtCompleteCount += 1;
      }
    });

    const anomalyFlags: string[] = [];
    if (hasSpoofRisk) anomalyFlags.push('Mock GPS / Spoof Anomaly');
    if (hasCoarseGps) anomalyFlags.push('Coarse or Missing GPS (>25m)');
    if (disputedCount > 0) anomalyFlags.push(`${disputedCount} Disputed Muster Entry`);
    if (hasSingletonQuorum) anomalyFlags.push('Low Peer Quorum (1 Worker)');
    if (hasStaleActiveShift) anomalyFlags.push('Unclosed Shift >14h');

    const totalLogs = siteLogs.length;
    const formVReadinessPct = totalLogs > 0 ? Math.round((courtCompleteCount / totalLogs) * 100) : 0;
    const jointLiabilityINR = Math.max(0, Math.round(grossWagesINR - paidWagesINR));

    const holdRecord = holds.find((h) => h.siteKey === siteKey);
    const retentionHeld = Boolean(holdRecord?.held);
    const recommendedHoldbackINR =
      anomalyFlags.length > 0 || jointLiabilityINR > 0
        ? Math.round(jointLiabilityINR * 0.1 + flaggedExposureINR * 0.15)
        : 0;

    summaries.push({
      siteKey,
      siteName: label,
      contractorName: holdRecord?.contractorName || inferContractorForSite(label),
      totalLogs,
      uniqueWorkers: uniqueWorkersSet.size,
      verifiedCount,
      pendingCount,
      disputedCount,
      estoppelLockedCount,
      anomalyFlags,
      formVReadinessPct,
      grossWagesINR: Math.round(grossWagesINR),
      paidWagesINR: Math.round(paidWagesINR),
      jointLiabilityINR,
      recommendedHoldbackINR,
      retentionHeld,
      logs: siteLogs,
    });
  });

  // Sort: flagged or highest unpaid joint liability first
  return summaries.sort((a, b) => {
    if (b.anomalyFlags.length !== a.anomalyFlags.length) {
      return b.anomalyFlags.length - a.anomalyFlags.length;
    }
    return b.jointLiabilityINR - a.jointLiabilityINR;
  });
}

/**
 * Pivot 3: Verified Workforce Skill & Credit Credentials.
 * Computes transparent, audit-backed skill credentials and credit eligibility directly
 * from Section 63 BSA logs + registered trade directory.
 */
export function computeWorkerCredentials(
  workers: RegisteredLabour[],
  logs: WorkLog[]
): WorkerSkillCredential[] {
  const byPhone = new Map<string, { reg?: RegisteredLabour; logs: WorkLog[] }>();

  workers.forEach((w) => {
    if (w.phoneNumber) {
      byPhone.set(w.phoneNumber, { reg: w, logs: [] });
    }
  });

  logs.forEach((l) => {
    if (!l.phone_number) return;
    const entry = byPhone.get(l.phone_number);
    if (entry) {
      entry.logs.push(l);
    } else {
      byPhone.set(l.phone_number, { logs: [l] });
    }
  });

  const credentials: WorkerSkillCredential[] = [];

  byPhone.forEach(({ reg, logs: workerLogs }, phoneNumber) => {
    const uniqueDays = new Set(workerLogs.map((l) => (l.date || l.created_at || '').slice(0, 10)).filter(Boolean));
    const verifiedDays = uniqueDays.size;
    const totalLoggedHours = Number(
      workerLogs.reduce((sum, l) => sum + (Number(l.hours_worked) || 8), 0).toFixed(1)
    );

    let verifiedOrEstoppelCount = 0;
    let disputedCount = 0;
    let judicialGradeCount = 0;
    let peerCorroboratedCount = 0;
    let estoppelSealedCount = 0;
    const gpsSamples: number[] = [];

    let latestTimestamp = reg?.registeredAt || new Date().toISOString();

    workerLogs.forEach((l) => {
      if (new Date(l.created_at).getTime() > new Date(latestTimestamp).getTime()) {
        latestTimestamp = l.created_at;
      }

      const isDisputed = l.verification_status === 'attendance_disputed' || l.status === 'disputed';
      const isAck = l.verification_status === 'attendance_acknowledged' || l.status === 'verified';
      const estoppel = isEstoppelActive(l);

      if (isDisputed) {
        disputedCount += 1;
      } else {
        if (isAck || estoppel) verifiedOrEstoppelCount += 1;
        if (estoppel) estoppelSealedCount += 1;
      }

      const acc = l.gps_accuracy_meters;
      if (acc !== undefined && !isNaN(Number(acc))) {
        gpsSamples.push(Number(acc));
      }

      if (l.evidence_grade === 'JUDICIAL_GRADE' || (acc !== undefined && acc <= 6.5)) {
        judicialGradeCount += 1;
      }

      const quorum = getPeerQuorumCount(l, logs);
      if (quorum >= 2) {
        peerCorroboratedCount += 1;
      }
    });

    const totalLogs = workerLogs.length;
    const verifiedRatioPct = totalLogs > 0 ? Math.round((verifiedOrEstoppelCount / totalLogs) * 100) : 0;
    const avgGpsAccuracyM =
      gpsSamples.length > 0
        ? Number((gpsSamples.reduce((a, b) => a + b, 0) / gpsSamples.length).toFixed(1))
        : null;

    const latestLog = workerLogs[0];
    const dailyWage =
      reg?.dailyWage ||
      Number(latestLog?.agreed_daily_wage || latestLog?.agreed_wage || latestLog?.estimated_wage) ||
      600;
    const name = reg?.name || latestLog?.worker_name || `Worker ${phoneNumber.slice(-4)}`;
    const trade = reg?.trade || 'Construction & Site Worker';
    const worksite = reg?.worksite || latestLog?.location_name || 'Unassigned Zone';

    let tier: SkillTier = 'Provisional';
    if (
      verifiedDays >= 5 &&
      verifiedRatioPct >= 85 &&
      disputedCount === 0 &&
      (avgGpsAccuracyM === null || avgGpsAccuracyM <= 15)
    ) {
      tier = 'Master Artisan';
    } else if (verifiedDays >= 2 && verifiedRatioPct >= 70 && disputedCount === 0) {
      tier = 'Verified Skilled';
    } else if (verifiedDays >= 1 && verifiedOrEstoppelCount >= 1) {
      tier = 'Certified Active';
    }

    const microCreditLimitINR =
      disputedCount > 0 || verifiedDays === 0
        ? 0
        : Math.min(25000, verifiedDays * Math.round(dailyWage * 0.75) + (verifiedRatioPct >= 90 ? 1500 : 0));

    const insuranceEligible =
      verifiedDays >= 2 &&
      disputedCount === 0 &&
      (avgGpsAccuracyM === null || avgGpsAccuracyM <= 25);

    const bocwDaysProgressPct = Math.min(100, Math.round((verifiedDays / 90) * 100));

    credentials.push({
      workerId: reg?.id || `SHR-REG-${phoneNumber.slice(-4)}`,
      name,
      phoneNumber,
      trade,
      dailyWage,
      worksite,
      aadhaarLastFour: reg?.aadhaarLastFour,
      verifiedDays,
      totalLoggedHours,
      verifiedRatioPct,
      avgGpsAccuracyM,
      judicialGradeCount,
      peerCorroboratedCount,
      estoppelSealedCount,
      disputedCount,
      tier,
      microCreditLimitINR,
      insuranceEligible,
      bocwDaysProgressPct,
      credentialHash: deriveCredentialHash(phoneNumber, verifiedDays, totalLoggedHours),
      lastActiveAt: latestTimestamp,
    });
  });

  // Sort by verifiedDays desc, then verifiedRatioPct desc
  return credentials.sort((a, b) => {
    if (b.verifiedDays !== a.verifiedDays) return b.verifiedDays - a.verifiedDays;
    return b.verifiedRatioPct - a.verifiedRatioPct;
  });
}

// Client-side localStorage persistence helpers (fallback when offline or prior to API sync)
export function getStoredRetentionHolds(): RetentionHoldRecord[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(RETENTION_HOLDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredRetentionHolds(holds: RetentionHoldRecord[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(RETENTION_HOLDS_KEY, JSON.stringify(holds));
    }
  } catch {}
}

export function getStoredSiteOffers(): SiteDeploymentOffer[] {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_SITE_OFFERS;
    const raw = localStorage.getItem(SITE_OFFERS_KEY);
    if (!raw) {
      localStorage.setItem(SITE_OFFERS_KEY, JSON.stringify(DEFAULT_SITE_OFFERS));
      return DEFAULT_SITE_OFFERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SITE_OFFERS;
  } catch {
    return DEFAULT_SITE_OFFERS;
  }
}

export function saveStoredSiteOffers(offers: SiteDeploymentOffer[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SITE_OFFERS_KEY, JSON.stringify(offers));
    }
  } catch {}
}
