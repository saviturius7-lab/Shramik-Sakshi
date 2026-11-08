import { relations } from 'drizzle-orm';
import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  integer, 
  boolean, 
  doublePrecision, 
  numeric,
  uuid
} from 'drizzle-orm/pg-core';

// 1. Users Table (Workers, Employers/Contractors, Administrators)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  phoneNumber: text('phone_number'),
  name: text('name').notNull().default('Laborer'),
  role: text('role').notNull().default('worker'), // 'worker' | 'employer' | 'administrator'
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Employment Engagements Table
export const engagements = pgTable('engagements', {
  id: serial('id').primaryKey(),
  workerId: integer('worker_id')
    .references(() => users.id)
    .notNull(),
  employerId: integer('employer_id')
    .references(() => users.id),
  worksite: text('worksite').notNull(),
  agreedDailyWage: numeric('agreed_daily_wage', { precision: 10, scale: 2 }).notNull().default('600.00'),
  paymentTerms: text('payment_terms').notNull().default('Weekly on Friday'),
  status: text('status').notNull().default('active'), // 'active' | 'completed' | 'disputed'
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Attendance Records Table (Append-only, strictly immutable)
export const attendanceRecords = pgTable('attendance_records', {
  id: text('id').primaryKey(), // UUID
  workerId: integer('worker_id')
    .references(() => users.id)
    .notNull(),
  engagementId: integer('engagement_id')
    .references(() => engagements.id),
  date: text('date').notNull(), // YYYY-MM-DD
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  locationName: text('location_name').notNull().default('Job Site'),
  locationMethod: text('location_method').notNull().default('manual_preset'), // 'gps_device' | 'manual_preset' | 'telegraph'
  // Verification levels:
  // - location_submitted: Worker shared GPS coordinates or selected site
  // - location_matched: Coordinates match geo-fence
  // - attendance_acknowledged: Employer or supervisor confirmed
  // - attendance_disputed: Disputed by contractor
  verificationStatus: text('verification_status').notNull().default('location_submitted'),
  hoursWorked: doublePrecision('hours_worked').notNull().default(8.0),
  agreedWage: numeric('agreed_wage', { precision: 10, scale: 2 }).notNull().default('600.00'),
  actualWageEarned: numeric('actual_wage_earned', { precision: 10, scale: 2 }).notNull().default('600.00'),
  token: text('token').notNull(), // SHP-XXXX-XXXX
  tokenHash: text('token_hash').notNull(), // SHA256 of token
  verifiedBy: integer('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at'),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Wage Transactions & Payments Table
export const wageRecords = pgTable('wage_records', {
  id: serial('id').primaryKey(),
  attendanceId: text('attendance_id')
    .references(() => attendanceRecords.id),
  workerId: integer('worker_id')
    .references(() => users.id)
    .notNull(),
  amountEarned: numeric('amount_earned', { precision: 10, scale: 2 }).notNull().default('600.00'),
  amountPaid: numeric('amount_paid', { precision: 10, scale: 2 }).notNull().default('0.00'),
  outstandingAmount: numeric('outstanding_amount', { precision: 10, scale: 2 }).notNull().default('600.00'),
  paymentDate: text('payment_date'),
  paymentStatus: text('payment_status').notNull().default('unpaid'), // 'unpaid' | 'partial' | 'paid'
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Disputes Management Table
export const disputes = pgTable('disputes', {
  id: text('id').primaryKey(), // Case ID SS-XXXX
  workerId: integer('worker_id')
    .references(() => users.id)
    .notNull(),
  workerPhone: text('worker_phone').notNull(),
  contractorName: text('contractor_name'),
  claimedAmount: numeric('claimed_amount', { precision: 10, scale: 2 }),
  workLocation: text('work_location'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  status: text('status').notNull().default('registered'), // 'registered' | 'under_review' | 'assigned_to_ngo' | 'resolved'
  assignedTo: text('assigned_to'),
  sessionStep: text('session_step').notNull().default('completed'), // 'step_contractor' | 'step_amount' | 'completed'
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 6. Audit Logs Table (Append-only record of changes & corrections)
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  entityType: text('entity_type').notNull(), // 'attendance' | 'wage' | 'dispute' | 'engagement'
  entityId: text('entity_id').notNull(),
  action: text('action').notNull(), // 'create' | 'acknowledge' | 'dispute' | 'correct' | 'payout'
  performedBy: integer('performed_by').references(() => users.id),
  performedByRole: text('performed_by_role').notNull(),
  reason: text('reason'),
  previousState: text('previous_state'),
  newState: text('new_state').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  attendanceRecords: many(attendanceRecords),
  engagements: many(engagements),
  disputes: many(disputes),
  wageRecords: many(wageRecords),
}));

export const attendanceRelations = relations(attendanceRecords, ({ one, many }) => ({
  worker: one(users, {
    fields: [attendanceRecords.workerId],
    references: [users.id],
  }),
  engagement: one(engagements, {
    fields: [attendanceRecords.engagementId],
    references: [engagements.id],
  }),
  wageRecords: many(wageRecords),
}));

export const disputesRelations = relations(disputes, ({ one }) => ({
  worker: one(users, {
    fields: [disputes.workerId],
    references: [users.id],
  }),
}));
