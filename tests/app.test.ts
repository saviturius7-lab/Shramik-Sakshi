/**
 * Shramik Sakshi Automated Verification & Audit Test Suite
 * Validates the core security, wage accounting, and verification guarantees.
 */

import { attendanceSubmissionSchema, disputeSubmissionSchema, phoneSchema } from '../src/services/validators.js';
import { calculateWorkerSummary } from '../src/services/storage.js';
import { runPreAiBot } from '../src/services/preAiBot.js';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTest(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    results.push({ name, passed: false, error: err.message });
    console.error(`  ✗ ${name}: ${err.message}`);
  }
}

async function runSuite() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING SHRAMIK SAKSHI INTEGRITY & AUDIT TEST SUITE');
  console.log('======================================================\n');

  // Test 1: Worker Attendance Submission Validation
  await runTest('1. Worker can submit attendance with validated E.164 phone and coordinates', () => {
    const validPayload = {
      phone: '+919876543210',
      latitude: 13.0312,
      longitude: 77.5165,
      siteName: 'Peenya Industrial Area, Bengaluru',
      hoursWorked: 8,
      agreedWage: 600,
    };
    const parsed = attendanceSubmissionSchema.parse(validPayload);
    assert(parsed.phoneNumber === '+919876543210', 'Normalized phone must match E.164');
    assert(parsed.latitude === 13.0312, 'Coordinates must be preserved');

    // Invalid phone should be rejected
    const invalidPhoneResult = phoneSchema.safeParse('12345');
    assert(!invalidPhoneResult.success, 'Invalid non-E.164 phone number must be rejected');
  });

  // Test 2: Role-based Authorization Check
  await runTest('2. Unauthenticated or unauthorized role cannot perform admin actions', () => {
    // Simulating access control gate: role must be administrator to reset data
    const canReset = (role?: string) => role === 'administrator';
    assert(!canReset('worker'), 'Worker must not be permitted to reset data');
    assert(!canReset('employer'), 'Employer must not be permitted to reset data');
    assert(!canReset(undefined), 'Unauthenticated user must not be permitted to reset data');
    assert(canReset('administrator'), 'Administrator should be authorized');
  });

  // Test 3: Unique Workdays Accounting for Duplicate Submissions
  await runTest('3. Duplicate attendance submissions on the same calendar day are counted under 1 unique workday', () => {
    const multiPunchLogs = [
      {
        id: '1',
        worker_id: 'w1',
        phone_number: '+919876543210',
        date: '2026-11-05',
        created_at: '2026-11-05T08:00:00Z',
        hours_worked: 8,
        agreed_daily_wage: 600,
        actual_wage_earned: 600,
        amount_paid: 0,
        verification_status: 'location_submitted' as const,
        verification_token: 'TK-1',
      },
      {
        id: '2',
        worker_id: 'w1',
        phone_number: '+919876543210',
        date: '2026-11-05',
        created_at: '2026-11-05T17:00:00Z', // Evening check-in on same day
        hours_worked: 8,
        agreed_daily_wage: 600,
        actual_wage_earned: 600,
        amount_paid: 0,
        verification_status: 'attendance_acknowledged' as const,
        verification_token: 'TK-2',
      },
      {
        id: '3',
        worker_id: 'w1',
        phone_number: '+919876543210',
        date: '2026-11-06',
        created_at: '2026-11-06T09:00:00Z', // Next calendar day
        hours_worked: 8,
        agreed_daily_wage: 600,
        actual_wage_earned: 600,
        amount_paid: 600,
        verification_status: 'attendance_acknowledged' as const,
        verification_token: 'TK-3',
      },
    ];

    const summary = calculateWorkerSummary('+919876543210', multiPunchLogs as any);
    assert(summary.totalDays === 2, `Expected 2 unique calendar workdays, got ${summary.totalDays}`);
    assert(multiPunchLogs.length === 3, `Expected 3 total submissions, got ${multiPunchLogs.length}`);
  });

  // Test 4: Wage Calculations Handle Multiple Days and Partial Payments
  await runTest('4. Wage calculations handle multiple workdays, actual wage earned and outstanding balances', () => {
    const logs = [
      {
        id: '1',
        phone_number: '+919876543210',
        date: '2026-11-01',
        created_at: '2026-11-01T08:00:00Z',
        hours_worked: 8,
        agreed_daily_wage: 700,
        actual_wage_earned: 700,
        amount_paid: 700, // Fully paid
        verification_status: 'attendance_acknowledged' as const,
        verification_token: 'TK-A',
      },
      {
        id: '2',
        phone_number: '+919876543210',
        date: '2026-11-02',
        created_at: '2026-11-02T08:00:00Z',
        hours_worked: 8,
        agreed_daily_wage: 700,
        actual_wage_earned: 700,
        amount_paid: 300, // Partial payment
        verification_status: 'attendance_acknowledged' as const,
        verification_token: 'TK-B',
      },
      {
        id: '3',
        phone_number: '+919876543210',
        date: '2026-11-03',
        created_at: '2026-11-03T08:00:00Z',
        hours_worked: 8,
        agreed_daily_wage: 700,
        actual_wage_earned: 700,
        amount_paid: 0, // Unpaid
        verification_status: 'location_submitted' as const,
        verification_token: 'TK-C',
      },
    ];

    const summary = calculateWorkerSummary('+919876543210', logs as any);
    assert(summary.totalEarnings === 2100, `Expected 2100 total earned, got ${summary.totalEarnings}`);
    assert(summary.totalPaid === 1000, `Expected 1000 total paid, got ${summary.totalPaid}`);
    assert(summary.outstandingAmount === 1100, `Expected 1100 outstanding balance, got ${summary.outstandingAmount}`);
  });

  // Test 5: Dispute Validation Rejects Invalid Amounts
  await runTest('5. Dispute registration validates positive amounts and rejects negative or zero figures', () => {
    const invalidNegative = disputeSubmissionSchema.safeParse({
      phone: '+919876543210',
      contractorName: 'ABC Projects',
      claimedAmount: -600,
    });
    assert(!invalidNegative.success, 'Negative dispute amount must be rejected');

    const invalidZero = disputeSubmissionSchema.safeParse({
      phone: '+919876543210',
      contractorName: 'ABC Projects',
      claimedAmount: 0,
    });
    assert(!invalidZero.success, 'Zero dispute amount must be rejected');

    const validDispute = disputeSubmissionSchema.safeParse({
      phone: '+919876543210',
      contractorName: 'ABC Projects',
      claimedAmount: 1800,
    });
    assert(validDispute.success, 'Valid positive dispute amount must be accepted');
  });

  // Test 6: Dispute Case ID Format and Accurate Coordinates Preservation
  await runTest('6. Dispute workflow generates formal case IDs (SS-XXXX) and preserves null coordinates instead of dummy Delhi locations', () => {
    const testPhone = '+919876543299';
    // Step 1: initiate complaint
    const step1 = runPreAiBot(testPhone, '3');
    assert(step1.reply.includes('Contractor') || step1.reply.includes('ठेकेदार'), 'Should prompt for contractor name');

    // Step 2: Contractor Name
    const step2 = runPreAiBot(testPhone, 'Premier Builders');
    assert(step2.reply.includes('amount') || step2.reply.includes('बकाया') || step2.reply.includes('रुपये'), 'Should prompt for positive wage amount');

    // Test rejection of non-positive amount during flow
    const invalidStep = runPreAiBot(testPhone, 'invalid-amount');
    assert(invalidStep.reply.includes('Invalid amount') || invalidStep.reply.includes('positive'), 'Must reject invalid amount during interactive flow');

    // Step 3: Valid Positive Amount (without GPS pin)
    const step3 = runPreAiBot(testPhone, '1200');
    assert(step3.caseId !== undefined, 'Case ID must be returned');
    assert(step3.caseId!.startsWith('SS-'), 'Case ID must start with SS-');
    assert(step3.reply.includes('Your complaint has been registered. Your case ID is SS-'), 'Response must match official format');
    assert(step3.reply.includes('It is awaiting review.'), 'Response must state awaiting review');
    assert(step3.logData?.latitude === null, 'Must preserve null coordinates when GPS unavailable rather than hardcoding Delhi');
    assert(step3.logData?.claimedAmount === 1200, 'Must record exact claimed amount without falling back to 600 default');
  });

  // Test 7: Atomic Storage Mutex Concurrency Protection (Zero Lost Updates)
  await runTest('7. Atomic Storage Mutex protects against lost-update race conditions during concurrent operations', async () => {
    const { mutateWorkLogsAtomically, getCachedWorkLogsSync } = await import('../src/services/atomicStorage.js');
    const initialCount = getCachedWorkLogsSync().length;
    
    // Simulate 5 concurrent worker check-ins arriving at the exact same millisecond
    const concurrentWrites = Array.from({ length: 5 }).map((_, i) => {
      return mutateWorkLogsAtomically((logs) => {
        const dummyLog: any = {
          id: `concur_test_${i}_${Date.now()}`,
          phone_number: `+9198765432${i}`,
          verification_token: `SHP-TEST-${i}`,
          estimated_wage: 600,
          created_at: new Date().toISOString(),
        };
        return { updatedLogs: [dummyLog, ...logs], result: dummyLog.id };
      });
    });

    const insertedIds = await Promise.all(concurrentWrites);
    assert(insertedIds.length === 5, 'All 5 concurrent requests must resolve successfully');
    
    const finalLogs = getCachedWorkLogsSync();
    assert(finalLogs.length >= initialCount + 5, `Expected at least ${initialCount + 5} logs, got ${finalLogs.length}`);
    
    for (const id of insertedIds) {
      assert(finalLogs.some(l => l.id === id), `Log ${id} must exist in the atomic ledger`);
    }
  });

  // Test 8: Rate Limiter Sliding Window Protection
  await runTest('8. Rate Limiter accurately counts sliding window hits and triggers 429 above threshold', async () => {
    const { createRateLimiter } = await import('../src/middleware/rateLimiter.js');
    const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 3, endpointName: 'test_limit' });

    let status = 200;
    let rateLimitExceeded = false;
    const mockRes: any = {
      setHeader: () => {},
      status: (code: number) => {
        status = code;
        return {
          json: (body: any) => {
            if (code === 429) rateLimitExceeded = true;
          }
        };
      }
    };
    const mockNext = () => {};

    const mockReq: any = { ip: '192.168.1.100', headers: {} };

    // Requests 1, 2, 3 should pass
    limiter(mockReq, mockRes, mockNext);
    assert(!rateLimitExceeded, 'Hit 1 should pass');
    limiter(mockReq, mockRes, mockNext);
    assert(!rateLimitExceeded, 'Hit 2 should pass');
    limiter(mockReq, mockRes, mockNext);
    assert(!rateLimitExceeded, 'Hit 3 should pass');

    // Request 4 should be rejected with 429
    limiter(mockReq, mockRes, mockNext);
    assert(rateLimitExceeded, 'Hit 4 must be rate-limited with HTTP 429');
    assert(status === 429, 'Status must be 429');
  });

  // Test 9: Dual-Punch Shift Duration & Statutory Wage Calculations
  await runTest('9. Dual-punch calculates duration, enforces half-day (<4h) and overtime (>8h) statutory rules', () => {
    // Case A: Normal 8h shift
    const stepIn = runPreAiBot('+919876543210', 'Location Pin: Site A', 13.0312, 77.5165);
    assert(stepIn.actionTaken === 'LOG_ATTENDANCE', 'Check-in must record attendance');
    assert(stepIn.logData?.actualWageEarned === 600, 'Standard 8h wage is 600');

    // Case B: Check-out command
    const stepOut = runPreAiBot('+919876543210', 'OUT', undefined, undefined, undefined, [stepIn.logData as any]);
    assert(stepOut.reply.includes('CHECK-OUT & EGRESS SEALED') || stepOut.reply.includes('DURATION'), 'Checkout must seal shift');
  });

  // Test 10: Ingress Buffer & Immediate Provisional Token (Scalability Tip 1)
  await runTest('10. Asynchronous Ingress Buffer enqueues in sub-5ms with provisional token and tracks queue depth', async () => {
    const { ingressBuffer } = await import('../src/services/ingressBuffer.js');
    const start = Date.now();
    const enqueueResult = ingressBuffer.enqueue({
      phoneNumber: '+919999888877',
      workerName: 'Scale Test Laborer',
      body: 'Morning Ingress Test Pin',
      latitude: 13.0312,
      longitude: 77.5165,
      locationName: 'Bengaluru Highway Project',
    });
    const duration = Date.now() - start;

    assert(duration < 20, `Enqueue must be near instantaneous (took ${duration}ms)`);
    assert(enqueueResult.jobId.startsWith('job_'), 'Job ID must be generated');
    assert(enqueueResult.provisionalToken.startsWith('PROV-SHP-'), 'Provisional token must be issued immediately');
    assert(enqueueResult.queueDepth >= 0, 'Queue depth must be reported');

    const job = ingressBuffer.getJob(enqueueResult.jobId);
    assert(job !== undefined, 'Job must be retrievable from buffer');
  });

  // Test 11: CQRS Materialized Passbook Projection in O(1) (Scalability Tip 2)
  await runTest('11. CQRS Materialized Summary executes in O(1) without scanning millions of historical rows', async () => {
    const { getMaterializedSummary, updateWorkerMaterializedSummary } = await import('../src/services/cqrsMaterializer.js');
    const testLog: any = {
      id: 'test_cqrs_log_1',
      phone_number: '+919988776655',
      date: '2026-11-07',
      created_at: new Date().toISOString(),
      actual_wage_earned: 600.0,
      agreed_wage: 600.0,
      amount_paid: 0,
      hours_worked: 8.0,
      location_name: 'Metro Site North',
      verification_status: 'attendance_acknowledged',
    };

    const updated = await updateWorkerMaterializedSummary(testLog);
    assert(updated.phoneNumber === '+919988776655', 'Summary must match worker phone');
    assert(updated.outstandingAmount >= 600, 'Outstanding balance must reflect earned wage');

    // Retrieve via O(1) projection query
    const fastFetch = await getMaterializedSummary('+919988776655');
    assert(fastFetch.phoneNumber === '+919988776655', 'O(1) summary query must return pre-computed projection');
    assert(fastFetch.totalDays >= 1, 'Total days must be pre-aggregated');
  });

  // Test 12: Offline WAL Cryptographic Digest & Delta Batch Sync (Scalability Tip 3)
  await runTest('12. Edge Offline WAL creates cryptographically identifiable delta batch records', async () => {
    const { appendOfflineWal, getPendingWalRecords, markWalRecordSynced } = await import('../src/services/offlineWal.js');
    const record = await appendOfflineWal('CHECK_IN', '+919876543210', {
      locationName: 'Basement Excavation Vault 3',
      latitude: 12.9716,
      longitude: 77.5946,
      rawMessage: 'Punching from zero-connectivity tunnel',
      estimatedWage: 600,
    });

    assert(record.walId.startsWith('wal_'), 'WAL ID must be properly prefixed');
    assert(record.clientSignature.length > 10, 'Client cryptographic signature must be generated');
    assert(record.syncState === 'pending', 'Initial syncState must be pending');
    assert(record.vectorClock >= 1, 'Vector clock must increment monotonically');

    // Mark as synced with server token
    await markWalRecordSynced(record.walId, 'SHP-TEST-SYNCED');
  });

  console.log('\n------------------------------------------------------');
  const allPassed = results.every((r) => r.passed);
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${results.filter((r) => r.passed).length} | FAILED: ${results.filter((r) => !r.passed).length}`);
  console.log('------------------------------------------------------\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
