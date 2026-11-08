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
  telemetry_source?: 'hardware_gps' | 'cell_triangulated' | 'manual_preset' | 'telegraph';

  // Section 121 BSA / Estoppel 2-Hour Employer Acquiescence Window
  employer_notified_at?: string;
  dispute_window_expires_at?: string;
  estoppel_active?: boolean;

  // Section 9 & 11 BSA Corroborative Evidence
  peer_quorum_count?: number;

  // Tangible Work Proof Artifacts
  work_photo_url?: string;
  work_photo_hash?: string;

  // Section 63 BSA Custodian Certificate
  custodian_cert_id?: string;
  statutory_rule?: string;
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
