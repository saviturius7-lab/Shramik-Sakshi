# Shramik Sakshi (श्रमिक साक्षी)
### Secure Attendance, Wage Accounting & Muster Roll Ledger for Informal Labor

[![System Status](https://img.shields.io/badge/System-Production%20Hardened-emerald.svg)]()
[![Android App](https://img.shields.io/badge/Android%20App-Download%20%26%20Install-3DDC84?style=flat&logo=android&logoColor=white)](https://ais-pre-x4rlowsrpgz7hlodoxfidm-834356401001.asia-southeast1.run.app)
[![PWA](https://img.shields.io/badge/PWA-Standalone%20WebAPK-success)](https://ais-pre-x4rlowsrpgz7hlodoxfidm-834356401001.asia-southeast1.run.app)
[![Database](https://img.shields.io/badge/Database-Cloud%20SQL%20PostgreSQL-336791.svg)]()
[![Auth & RBAC](https://img.shields.io/badge/Auth-Firebase%20%2B%20RBAC-FFA611.svg)]()
[![Deterministic Rule Engine](https://img.shields.io/badge/Engine-100%25%20Deterministic%20(Pre--AI)-blue.svg)]()
[![Audit Logging](https://img.shields.io/badge/Audit-Append--Only%20Ledger-purple.svg)]()
[![Languages](https://img.shields.io/badge/Languages-EN%20%7C%20HI%20%7C%20KN%20%7C%20TE%20%7C%20TA%20%7C%20ML-indigo.svg)]()
[![Test Suite](https://img.shields.io/badge/Tests-Automated%20Integrity%20Suite-brightgreen.svg)]()

---

## 📲 Download & Launch Android App

| Platform | Download / Access Link | Status |
| :--- | :--- | :--- |
| **Android App (Live PWA / WebAPK)** | [**👉 Download & Open App**](https://ais-pre-x4rlowsrpgz7hlodoxfidm-834356401001.asia-southeast1.run.app) | **Production Active** |
| **Development Preview** | [**👉 Open Dev Server**](https://ais-dev-x4rlowsrpgz7hlodoxfidm-834356401001.asia-southeast1.run.app) | **Development Ready** |
| **Web App Manifest** | [`/manifest.webmanifest`](https://ais-pre-x4rlowsrpgz7hlodoxfidm-834356401001.asia-southeast1.run.app/manifest.webmanifest) | **W3C Validated** |

### How to Install on Android Phone:
1. Open the [**Direct Download Link**](https://ais-pre-x4rlowsrpgz7hlodoxfidm-834356401001.asia-southeast1.run.app) on any Android mobile browser (Google Chrome, Brave, Samsung Internet).
2. Tap the **"📲 Download App (ऐप डाउनलोड)"** button in the header or bottom banner, or tap your browser's menu (**⋮**) $\rightarrow$ select **"Install app"** or **"Add to Home screen"**.
3. Tap **"Install"** to confirm. The official **Shramik Sakshi 🛠️** app icon will appear directly on your Android phone's home screen.
4. **Offline Ready**: Works without internet connectivity once loaded; syncs attendance automatically when signal is restored.

---

## 1. Problem Statement

Across the informal economy, over **450 million unorganized and daily-wage laborers**—such as construction workers, domestic staff, masons, and farm hands—work without formal written contracts. Their compensation relies on oral agreements and opaque paper muster rolls controlled exclusively by labor contractors (*thekedars*).

This informal structure creates severe systemic vulnerabilities:

1. **Rampant Wage Theft & Arbitrary Deductions**: At cash settlement, workers are told: *"You missed two days,"* or *"You arrived late."* Without independent attendance documentation, workers cannot contest arbitrary withholdings.
2. **Ghost Worker Inflation vs. Real Worker Exclusion**: Corrupt middlemen inflate physical paper logs with fictitious names while underpaying real laborers on site.
3. **Severe Digital Literacy Barriers**: Mainstream enterprise HR and biometric portals fail in the field—they demand high-speed internet, app store installs, complex passwords, and English literacy.
4. **Unprotected Endpoints & Modifiable Logs**: Conventional prototypes often use unprotected API endpoints, in-memory dispute sessions that vanish upon server restart, and modifiable JSON files that leave no audit trail when records are tampered with.
5. **Misleading Legal Claims & GPS Spoofing**: Simple GPS pins are often mistakenly advertised as "cryptographically verified legal evidence," ignoring that coordinates can be faked and that being near a worksite does not independently prove an 8-hour workday.

---

## 2. The Solution: Shramik Sakshi

**Shramik Sakshi (श्रमिक साक्षी — "Worker's Witness")** bridges the gap between informal work environments and verifiable wage accounting. It replaces vulnerable flat files and mock data with a production-grade relational backend, multi-role authorization, transparent attendance verification levels, and an immutable audit trail.

- **1-Click Attendance with Distinct Verification Levels**: Submissions are never marked blindly as "verified." Records transition through explicit states:
  - `location_submitted`: Worker submitted coordinates via GPS or manual preset.
  - `location_matched`: Coordinates match within permitted radius of the designated worksite.
  - `attendance_acknowledged`: Site supervisor or authorized employer acknowledges the day worked.
  - `attendance_disputed`: Employer or worker flags discrepancy for formal dispute review.
- **Relational Cloud SQL (PostgreSQL) Storage**: All workers, employers, engagements, attendance slips, wage calculations, disputes, and audit logs are persisted in PostgreSQL with ACID transaction guarantees.
- **Role-Based Access Control (RBAC)**: Secure authorization separating `worker`, `employer`, and `administrator`. Dangerous operations like database resets are strictly restricted to administrators.
- **True Wage Accounting by Unique Workdays**: Wage calculations count unique calendar workdays (not raw counts of duplicate pins) and maintain separate ledger fields for:
  $$\text{Outstanding Wage} = \text{Total Earned} - \text{Total Paid}$$
- **Persistent Dispute Management (`SS-XXXX`)**: Multi-turn dispute workflow validates positive INR amounts, preserves exact worker coordinates (or `null` if unavailable—never substituting dummy Delhi locations), and generates persistent case IDs (`SS-XXXX`) that survive server restarts.
- **Append-Only Tamper-Evident Audit Trail**: Attendance records are never destructively overwritten. Corrections and state transitions are logged to an append-only `audit_logs` table recording who made the change, when, and the reason.
- **Offline Synchronization (IndexedDB Queue)**: When mobile connectivity drops on construction sites, submissions queue in browser IndexedDB with UUID idempotency keys and sync automatically once back online.
- **Accessible Indic Storybook UI**: Organic, hand-inked comic cards (`comic-card`), high-contrast Indic typography across 6 languages (EN, HI, KN, TE, TA, ML), dual interactive walkthroughs (Worker vs. Admin), and a background flocking boids canvas in an optical twilight sky.
- **Legally Accurate Terminology**: Honest notices stating: *"Digital attendance record containing the submitted time, location and verification status"*—free of false claims of automatic court admissibility without employer acknowledgement.

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER (React 18 SPA)                      │
│                                                                             │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌───────────────┐  │
│  │ Field Telegraph Station│  │  Worker Passbook & Slip│  │ Live Work Map │  │
│  │ (IndexedDB Offline Q)  │  │   (Unique Workdays)    │  │ (Leaflet GIS) │  │
│  └───────────┬────────────┘  └───────────┬────────────┘  └───────┬───────┘  │
│              │                           │                       │          │
│  ┌───────────┴───────────────────────────┴───────────────────────┴───────┐  │
│  │ Role Switcher & Context: Worker (👷) | Employer (🏢) | Admin (🛡️)     │  │
│  │ Multilingual SpeechSynthesis (Audio Read-Aloud in 6 Indic Languages)  │  │
│  │ Craig Reynolds Flocking Boids Canvas (HTML5 2D Simulation)            │  │
│  └───────────────────────────────────────┬───────────────────────────────┘  │
└──────────────────────────────────────────┼──────────────────────────────────┘
                                           │ HTTPS (Bearer Auth & Zod Payload)
┌──────────────────────────────────────────▼──────────────────────────────────┐
│                         BACKEND LAYER (Node.js & Express 5)                 │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Authentication & RBAC Middleware (src/middleware/auth.ts)             │  │
│  │  - Firebase ID Token Verification / Development Role Gate             │  │
│  │  - Strict Permissions: requireRole(['administrator', 'employer'])     │  │
│  └───────────────────────────────────────┬───────────────────────────────┘  │
│                                          │                                  │
│  ┌───────────────────────────────────────▼───────────────────────────────┐  │
│  │ Input Validation Pipeline (src/services/validators.ts via Zod)        │  │
│  │  - E.164 Phone Normalization (e.g. +919876543210)                    │  │
│  │  - Positive Dispute Amounts (rejects zero/negative values)            │  │
│  │  - Attendance Action Schemas (acknowledge / dispute)                  │  │
│  └───────────────────────────────────────┬───────────────────────────────┘  │
│                                          │                                  │
│  ┌───────────────────────────────────────▼───────────────────────────────┐  │
│  │ Pre-AI Deterministic Rule Engine (src/services/preAiBot.ts)           │  │
│  │  - Finite State Automaton (FSM) for Multilingual Wire Commands        │  │
│  │  - Crypto UUID & RandomBytes Verification Tokens (SHP-XXXX-XXXX)      │  │
│  │  - Multi-Turn Dispute Case Generator (SS-XXXX)                        │  │
│  └───────────────────────────────────────┬───────────────────────────────┘  │
└──────────────────────────────────────────┼──────────────────────────────────┘
                                           │ SQL (Drizzle ORM & pg Pool)
┌──────────────────────────────────────────▼──────────────────────────────────┐
│                   PERSISTENCE LAYER (Cloud SQL PostgreSQL)                  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  - users               (id, uid, phone, role, is_demo)                │  │
│  │  - engagements         (worker_id, employer_id, agreed_wage, status)  │  │
│  │  - attendance_records  (id, token, coords, verification_status)       │  │
│  │  - wage_records        (earned, paid, outstanding, status)            │  │
│  │  - disputes            (id: SS-XXXX, contractor, amount, status)      │  │
│  │  - audit_logs          (append-only: who, when, why, prev/new state)  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Architectural Highlights & Solutions

### 4.1. Secure Authentication & Role-Based Access Control (RBAC)
- **Problem Solved**: Unprotected endpoints (`/api/logs`, `/api/reset`, `/api/dispatch`) permitted unauthenticated tampering.
- **Implementation**: 
  - Express middleware (`requireAuth`, `requireRole`) checks role permissions before route execution.
  - Resetting data (`POST /api/reset`) strictly requires the `administrator` role.
  - Employer actions (`POST /api/attendance/action`) require `employer` or `administrator`.

### 4.2. Cloud SQL PostgreSQL & ACID Relational Schema
- **Problem Solved**: Flat JSON file storage (`work_logs_db.json`) risks file corruption and lack of atomic updates.
- **Implementation**: 
  - Configured with Cloud SQL PostgreSQL instance and Drizzle ORM (`drizzle-orm`, `pg`).
  - Strict foreign keys linking workers, employers, attendance records, wages, and disputes.
  - Database migrations managed via Drizzle Kit (`src/db/drizzle.config.ts`).

### 4.3. 3-Tier Attendance Verification Hierarchy
- **Problem Solved**: Raw GPS was falsely labeled "cryptographically verified legal evidence" without proof of actual work.
- **Implementation**:
  1. `location_submitted`: Attendance submitted with GPS or manual site preset. Marked `Pending Supervisor Confirmation`.
  2. `location_matched`: Coordinates verified within worksite bounds.
  3. `attendance_acknowledged`: Authorized supervisor or employer confirms attendance.
  4. `attendance_disputed`: Attendance disputed by employer or worker with recorded rationale.

### 4.4. Accurate Wage Accounting by Unique Workdays
- **Problem Solved**: Previous logic multiplied total attendance pins by ₹600, inflating pay when workers punched multiple times a day or received partial payments.
- **Implementation**:
  - Deduplicates by calendar date: $\text{Unique Workdays} = |\text{Set}(\text{dates})|$.
  - Stores distinct values: `agreed_wage`, `actual_wage_earned`, `amount_paid`, and `outstanding_amount`.
  - Calculates balance strictly as $\text{Outstanding} = \text{Total Earned} - \text{Total Paid}$.

### 4.5. Persistent Dispute Workflow (`SS-XXXX`)
- **Problem Solved**: Previous dispute state vanished upon server restart, defaulted invalid amounts to ₹600, and hardcoded dummy Delhi coordinates.
- **Implementation**:
  - Validates positive amounts; rejects zero or negative amounts with informative errors.
  - Preserves worker coordinates if available, or stores `null`—never hardcoding unrelated locations.
  - Generates official case ID `SS-XXXX` stored in the PostgreSQL `disputes` table.
  - Responds honestly: *"Your complaint has been registered. Your case ID is SS-XXXX. It is awaiting review."*

### 4.6. Append-Only Tamper-Evident Audit Trail
- **Problem Solved**: Admins or malicious users could silently alter records.
- **Implementation**:
  - `audit_logs` table records every critical action (`ATTENDANCE_ACKNOWLEDGED`, `ATTENDANCE_DISPUTED`, `DATA_RESET`).
  - Logs `performedBy`, `performedByRole`, `reason`, `previousState`, `newState`, and timestamp.
  - Prior attendance records are never destructively overwritten.

### 4.7. Offline Resilience via IndexedDB
- **Problem Solved**: LocalStorage is unreliable for multi-field offline sync.
- **Implementation**:
  - Uses browser IndexedDB queue (`saveOfflinePendingSubmission`, `getPendingOfflineSubmissions`).
  - Generates UUID submission tokens to prevent duplicate replay upon network restoration.
  - Marks unsynced records as `pending-sync` until server returns HTTP 200 acknowledgement.

### 4.8. Android PWA & WebAPK Installation Engine
- **Problem Solved**: Daily wage laborers and low-literacy workers cannot navigate complex app store signups, password resets, or heavy APK downloads.
- **Implementation**:
  - Integrated `vite-plugin-pwa` generating a compliant Web App Manifest (`manifest.webmanifest`) with standalone display mode.
  - Generates adaptive Android icons (`192x192`, `512x512`, and safe-zone padded `512x512` maskable).
  - Built-in `usePWAInstall` hook and `AndroidInstallModal` offering 1-tap direct installation, multilingual voice narration (EN, HI, KN, TE, TA, ML), and desktop-to-mobile QR transfer.
  - Workbox service worker precaches application assets for offline startup without consuming user mobile data.

---

## 5. Automated Integrity Test Suite

The codebase includes an automated verification suite covering the 6 critical user journeys:

```bash
npm test
```

### Verified Test Cases:
1. **Worker Submission Validation**: Validates E.164 phone numbers and worksite coordinates.
2. **Access Control Gates**: Asserts that unauthenticated and non-admin roles cannot reset database or execute restricted actions.
3. **Unique Workdays Accounting**: Asserts that multiple punches on the same calendar day are counted under 1 unique workday.
4. **Wage Calculations**: Verifies gross earned, partial disbursement, and outstanding balance accuracy.
5. **Dispute Input Validation**: Rejects negative, zero, or non-numeric dispute amounts.
6. **Dispute Workflow & Case IDs**: Asserts generation of `SS-XXXX` case IDs, honest status responses, and preservation of `null` coordinates when GPS is unavailable.

---

## 6. API Reference

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/status` | Public | System health check and database status |
| `GET` | `/api/logs` | Any authenticated user | Retrieves attendance muster roll records |
| `POST` | `/api/dispatch` | Worker, Employer, Admin | Processes wire message or punch submission |
| `POST` | `/api/attendance/action` | Employer, Admin | Acknowledges or disputes an attendance record |
| `POST` | `/api/disputes` | Worker, Admin | Registers a wage theft dispute |
| `POST` | `/api/reset` | **Administrator only** | Resets demonstration data with audit logging |

---

## 7. Local Setup & Execution

### Prerequisites
- **Node.js**: v20.0 or higher
- **npm**: v10.0 or higher
- **PostgreSQL**: Cloud SQL instance or local PostgreSQL (runtime variables `SQL_HOST`, `SQL_USER`, `SQL_PASSWORD`, `SQL_DB_NAME`)

### Running the Application
```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite
npm test

# 3. Start development server
npm run dev
```

Visit `http://localhost:3000` to interact with the system.

---

## 8. Statutory Reference & Legal Notice

Shramik Sakshi is architected in reference to:
- **The Unorganized Workers' Social Security Act, 2008 (Act No. 33 of 2008)**
- **The Minimum Wages Act, 1948**
- **Building and Other Construction Workers (BOCW) Act, 1996**

*Legal Notice*: Shramik Sakshi records provide digital evidence of submitted time, location, and supervisor verification status. They do not constitute automatic, unilateral legal proof without employer acknowledgement or corroborating worksite records.

---

## 9. License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
