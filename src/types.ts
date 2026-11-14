export type SupportedLanguage = 'en' | 'kn' | 'te' | 'ta' | 'ml' | 'hi';

export type UserRole = 'worker' | 'employer' | 'administrator';

export type VerificationStatus = 
  | 'location_submitted' 
  | 'location_matched' 
  | 'attendance_acknowledged' 
  | 'attendance_disputed'
  | 'verified' // legacy support
  | 'pending'
  | 'disputed';

export interface WorkLog {
  id: string;
  phone_number: string;
  worker_id?: string | number;
  latitude: number | null;
  longitude: number | null;
  message_type?: 'location' | 'text';
  raw_message: string;
  estimated_wage: number;
  agreed_wage?: number;
  agreed_daily_wage?: number;
  actual_wage_earned?: number;
  amount_paid?: number;
  outstanding_amount?: number;
  hours_worked?: number;
  created_at: string;
  date?: string;
  worker_name?: string;
  location_name?: string;
  location_method?: 'gps_device' | 'manual_preset' | 'telegraph';
  status: VerificationStatus;
  verification_status: VerificationStatus;
  verification_token: string;
  verification_hash?: string;
  token_hash?: string;
  verified_by?: number | null;
  verified_at?: string | null;
  is_demo?: boolean;
  dispute_case_id?: string;

  // Dual-Punch Shift Duration & Anti-Punch-and-Run Telemetry
  check_in_time?: string;
  check_out_time?: string;
  shift_status?: 'active_in_progress' | 'completed' | 'half_day' | 'overtime';
  gps_accuracy_meters?: number;
  telemetry_source?: 'hardware_gps' | 'cell_triangulated' | 'manual_preset' | 'pin_adjusted' | 'telegraph';

  // Section 121 BSA / Estoppel 2-Hour Employer Acquiescence Window
  employer_notified_at?: string;
  dispute_window_expires_at?: string;
  estoppel_active?: boolean;

  // Section 9 & 11 BSA Corroborative Evidence
  peer_quorum_count?: number;

  // Tangible Work Proof Artifacts
  work_photo_url?: string;
  work_photo_hash?: string;

  // Section 63 BSA Custodian Certificate & Forensic Court Telemetry
  custodian_cert_id?: string;
  statutory_rule?: string;
  altitude?: number | null;
  altitude_accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  satellite_samples_count?: number;
  initial_accuracy_meters?: number;
  clock_skew_ms?: number;
  mock_location_detected?: boolean;
  evidence_grade?: 'JUDICIAL_GRADE' | 'EVIDENTIARY_GRADE' | 'CORROBORATIVE_GRADE' | 'INADMISSIBLE';
  evidence_confidence_score?: number; // 0-100 forensic score
  telemetry_sha256?: string;
  device_fingerprint?: string;
  network_carrier_type?: string;
  geofence_status?: 'within_boundary' | 'perimeter_buffer' | 'outside_boundary';
  geofence_distance_m?: number;
  nearest_hub_name?: string;
}

export interface WorkerSummary {
  phoneNumber: string;
  totalDays: number; // Unique workdays
  totalEarnings: number;
  totalPaid: number;
  outstandingAmount: number;
  lastActive: string;
  locations: string[];
}

export interface DisputeRecord {
  id: string; // Case ID SS-XXXX
  workerPhone: string;
  contractorName: string;
  claimedAmount: number;
  workLocation?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: 'registered' | 'under_review' | 'assigned_to_ngo' | 'resolved';
  assignedTo?: string | null;
  isDemo?: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isLocationPin?: boolean;
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

export interface CurrentUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  phoneNumber?: string;
}

export interface RegisteredLabour {
  id: string; // e.g. "SHR-2026-0814"
  name: string;
  phoneNumber: string;
  trade: string; // Mason, Helper, Carpenter, Painter, Electrician, Plumber, Loader, Bar Bender, etc.
  dailyWage: number;
  worksite: string;
  emergencyContact?: string;
  aadhaarLastFour?: string;
  registeredAt: string;
  notes?: string;
}

export interface ShiftState {
  isActive: boolean;
  shiftLogId?: string;
  checkInTime?: string;
  worksite?: string;
  elapsedHours?: number;
  projectedWage?: number;
  hourlyRate?: number;
}

export interface RetentionHoldRecord {
  siteKey: string;
  contractorName: string;
  held: boolean;
  reason?: string;
  updatedAt: string;
  updatedByRole: UserRole;
}

export interface SiteComplianceSummary {
  siteKey: string;
  siteName: string;
  contractorName: string;
  totalLogs: number;
  uniqueWorkers: number;
  verifiedCount: number;
  pendingCount: number;
  disputedCount: number;
  estoppelLockedCount: number;
  anomalyFlags: string[];
  formVReadinessPct: number;
  grossWagesINR: number;
  paidWagesINR: number;
  jointLiabilityINR: number;
  recommendedHoldbackINR: number;
  retentionHeld: boolean;
  logs: WorkLog[];
}

export type SkillTier = 'Master Artisan' | 'Verified Skilled' | 'Certified Active' | 'Provisional';

export interface WorkerSkillCredential {
  workerId: string;
  name: string;
  phoneNumber: string;
  trade: string;
  dailyWage: number;
  worksite: string;
  aadhaarLastFour?: string;
  verifiedDays: number;
  totalLoggedHours: number;
  verifiedRatioPct: number;
  avgGpsAccuracyM: number | null;
  judicialGradeCount: number;
  peerCorroboratedCount: number;
  estoppelSealedCount: number;
  disputedCount: number;
  tier: SkillTier;
  microCreditLimitINR: number;
  insuranceEligible: boolean;
  bocwDaysProgressPct: number;
  credentialHash: string;
  lastActiveAt: string;
}

export interface SiteDeploymentOffer {
  id: string;
  workerPhone: string;
  workerName: string;
  trade: string;
  employerName: string;
  projectSite: string;
  offeredDailyWage: number;
  durationDays: number;
  startDate: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}


