# Shramik Sakshi (श्रमिक साक्षी)
### Civic Wage Ledger, Principal Employer BOCW Compliance Console & Verifiable Skill Passports

[![System Status](https://img.shields.io/badge/System-Production%20Hardened-emerald.svg)]()
[![PWA / WebAPK](https://img.shields.io/badge/PWA-Standalone%20WebAPK%20Ready-success)](https://ais-pre-kow6nu3nag7pcrf54yqprh-834356401001.asia-southeast1.run.app)
[![Legal Framework](https://img.shields.io/badge/Evidentiary%20Standard-Sec%2063%20BSA%202023-amber.svg)]()
[![Statutory Rule](https://img.shields.io/badge/Muster%20Roll-BOCW%20%26%20Code%20on%20Wages%202019-blue.svg)]()
[![Enterprise Console](https://img.shields.io/badge/Enterprise-EPC%20Compliance%20%26%20Skill%20Bench-1b4332.svg)]()
[![Database](https://img.shields.io/badge/Database-Cloud%20SQL%20PostgreSQL%20%2B%20Atomic%20POSIX-336791.svg)]()
[![Auth & RBAC](https://img.shields.io/badge/Auth-Firebase%20%2B%20Multi--Role%20RBAC-FFA611.svg)]()
[![Indic Speech](https://img.shields.io/badge/Indic%20Speech-EN%20%7C%20HI%20%7C%20KN%20%7C%20TE%20%7C%20TA%20%7C%20ML-indigo.svg)]()
[![Test Suite](https://img.shields.io/badge/Tests-18%2F18%20Integrity%20Audits%20Passing-brightgreen.svg)]()

---

## 📲 Live Application & Progressive Web App (PWA)

| Environment | Access Link | Protocol / Port |
| :--- | :--- | :--- |
| **Shared / Production PWA** | [**Open Shramik Sakshi App**](https://ais-pre-kow6nu3nag7pcrf54yqprh-834356401001.asia-southeast1.run.app) | Cloud Run Container (`PORT=8080`) |
| **Development Preview** | [**Open Dev Server**](https://ais-dev-kow6nu3nag7pcrf54yqprh-834356401001.asia-southeast1.run.app) | Vite Dev Proxy (`PORT=3000`) |
| **Web App Manifest** | [`/manifest.webmanifest`](https://ais-pre-kow6nu3nag7pcrf54yqprh-834356401001.asia-southeast1.run.app/manifest.webmanifest) | W3C Validated Standalone PWA |
| **Health Probe** | [`/healthz`](https://ais-pre-kow6nu3nag7pcrf54yqprh-834356401001.asia-southeast1.run.app/healthz) | Production Liveness Probe |
| **Readiness Probe** | [`/readyz`](https://ais-pre-kow6nu3nag7pcrf54yqprh-834356401001.asia-southeast1.run.app/readyz) | Storage & Schema Readiness |

### How to Install on Android Phone:
1. Open the [**Shared / Production App Link**](https://ais-pre-kow6nu3nag7pcrf54yqprh-834356401001.asia-southeast1.run.app) on any Android mobile browser (Chrome, Brave, Samsung Internet).
2. Tap **"📲 Download App (ऐप डाउनलोड)"** in the header or mobile install banner, or select **"Install app / Add to Home screen"** from the browser menu (**⋮**).
3. The **Shramik Sakshi** WebAPK icon installs directly onto the home screen.
4. **Zero-Connectivity Field Operation**: Precached by Workbox service workers; records punch events offline into local IndexedDB Write-Ahead Logs (WAL) and automatically synchronizes when connectivity returns.

---

## 1. Problem Statement

Across India's informal construction and transit labor economy, over **450 million daily-wage workers** operate without formal contracts—exposing workers to arbitrary deductions and exposing **Principal Employers / Tier-1 EPCs** to severe statutory **joint liability** under the **BOCW Act, 1996** and **Code on Wages, 2019** when sub-contractors fail to maintain authentic Form V muster rolls or disburse wages.

### Systemic Gaps Solved:
1. **Wage Theft & Arbitrary Deductions**: Workers lack contemporaneous morning-in and evening-out proof, enabling weekend settlement disputes (*"You left early"*).
2. **Principal Employer Joint-Liability Blind Spots**: Builders and EPCs disburse contractor bills without verifying whether sub-contractors actually paid field workers or inflated rosters with ghost entries.
3. **Lack of Portable Worker Credit & Skill Proof**: Skilled masons, carpenters, and electricians work for years without an auditable track record usable for micro-credit, BOCW 90-day welfare eligibility, or direct employer hiring.
4. **Low-Precision GPS & Literacy Barriers**: Single-shot IP/cell geolocation drifts by 50–500m, while English-only HR tools fail low-literacy workers on low-connectivity sites.

---

## 2. Core Architecture

```
═══════════════════════════════════════════════════════════════════════════════
                      SHRAMIK SAKSHI PLATFORM ARCHITECTURE
═══════════════════════════════════════════════════════════════════════════════

   [Field Worker]             [Principal Employer / EPC]      [Labor Inspector]
          │                               │                            │
   Offline Mobile PWA         EPC Compliance & Talent Bench     Civic Audit Desk
          │                               │                            │
          ▼                               ▼                            ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                       HIGH-THROUGHPUT INGRESS LAYER                         │
 │  • Sub-5ms Ingress Buffer with Immediate Provisional Token (PROV-SHP-XXXX)  │
 │  • Edge Offline Write-Ahead Log (WAL) with Vector Clocks & SHA-256 Digest   │
 │  • Idempotency Cache, Sliding-Window Rate Limiter & Signed Session RBAC     │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
 ┌──────────────────────────────────────▼──────────────────────────────────────┐
 │            STATUTORY EVIDENCE, EPC COMPLIANCE & SKILL ENGINE                │
 │  • Dual-Punch Shift Engine (Check-In / Check-Out + 2x Overtime / 50% Half)  │
 │  • Section 63 BSA Telemetry (6-Decimal GNSS, Clock Parity, Anti-Spoofing)   │
 │  • Pivot 1: EPC Joint-Liability Audit, Ghost-GPS Flags & Retention Holds    │
 │  • Pivot 3: Verified Skill & Micro-Credit Passports + Direct Site Offers    │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
 ┌──────────────────────────────────────▼──────────────────────────────────────┐
 │                      STORAGE & SCALABILITY TIER                             │
 │  • Cloud SQL PostgreSQL (Drizzle ORM) + POSIX Atomic JSON Persistence       │
 │  • CQRS Materialized Passbook Projections (O(1) Fetch)                      │
 │  • Fluid Leaflet GIS Map (Anti-Collision Pins, FlyTo, 3 Tile Layers)        │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Feature Matrix & Capabilities

### 3.1. Forensic Statutory Shift & Wage Engine
- **Dual-Punch Shift Protocol**: Tracks morning ingress and evening egress (`check_in_time`, `check_out_time`) with live shift duration ticking.
- **Central Minimum Wages Rules (Rule 26 Form V)**:
  - **Half-Day (< 4.0 hrs)**: Automatically prorated to `half_day` (50% of agreed daily wage).
  - **Standard Day (4.0 – 8.5 hrs)**: Recorded as `completed` at 100% agreed daily wage (supports custom trade wages such as ₹600, ₹700, ₹800, ₹1000+).
  - **Statutory Overtime (> 8.5 hrs)**: Calculates double-rate overtime automatically:
    $$\text{Earned Wage} = \text{Base Wage} + \left((\text{Hours} - 8) \times \frac{\text{Base Wage}}{8} \times 2\right)$$
- **Section 63 BSA Evidentiary Slips & Court Exhibits**: Generates cryptographically signed verification slips (`SHP-XXXX-XXXX`), SHA-256 telemetry digests, custodian certificate IDs (`BSA63-XX-XXXXXX`), and printable Section 63(4) BSA court evidence certificates (`CourtEvidenceCertificateModal.tsx`).
- **2-Hour Estoppel Window (Sec 121 BSA) & Peer Quorum**: Tracks the 2-hour employer dispute window (`dispute_window_expires_at`) and on-site co-worker quorum (`peer_quorum_count`).

### 3.2. Enterprise EPC & Principal Employer Compliance Console (`src/components/EnterpriseComplianceConsole.tsx`)
Designed for builders, EPCs, and principal employers liable under the **BOCW Act, 1996** and **Code on Wages, 2019**:
- **Site & Sub-Contractor Joint-Liability Matrix**: Aggregates gross wages, disbursed wages, unpaid exposure (₹), Form V readiness percentage, and Section 121 estoppel lock counts per worksite.
- **Automated Ghost-Worker & Telemetry Anomaly Flags**: Highlights coarse or missing GPS (`>25m`), singleton peer quorum (`1` worker), mock-location flags, unclosed shifts (`>14h`), and unresolved disputes.
- **Retention Hold & Bulk Audit Controls**:
  - **Hold / Release Contractor Retention**: Toggle retention payout holds per worksite (`POST /api/compliance/holds`) with persistent audit metadata.
  - **Bulk Confirm Clean Slips**: Approve clean geotagged pending shifts in one action (`POST /api/compliance/bulk-acknowledge`).
  - **Inline Muster Inspection & Form V CSV Export**: Expand any worksite row to inspect individual slips, approve/dispute entries, open Court Exhibits, or export a statutory BOCW audit CSV.

### 3.3. Verified Workforce Bench, Skill Credentials & Micro-Credit Passports (`src/components/WorkforceTalentBench.tsx`)
Turns verified attendance logs and the trade registry into portable economic credentials:
- **Deterministic Skill & Credit Passports**: Computes each worker's tier (`Master Artisan`, `Verified Skilled`, `Certified Active`, `Provisional`), verified workdays, logged hours, verified ratio percentage, average GNSS accuracy, BOCW 90-day welfare progress, and pre-qualified micro-credit limit (₹) with a QR-verifiable credential hash (`SHRAMIK_SKILL_PASSPORT_V1`).
- **Pre-Verified Recruitment Bench**: Filter skilled workers by trade (Mason, Carpenter, Electrician, Helper, etc.), minimum verified days, and worksite hub.
- **Direct Site Deployment Offers**: Employers can dispatch structured job offers (project site, daily wage, duration, start date via `POST /api/recruitment/offers`), and workers can **Accept** or **Decline** offers directly inside their **Worker Passbook** (`WorkerProfile.tsx`) or the Talent Bench (`PATCH /api/recruitment/offers/:id`).

### 3.4. Fluid Live GIS Map & Sub-Meter GNSS Convergence (`src/components/LiveMap.tsx`, `src/utils/geolocation.ts`)
- **Smooth Map Physics & Viewport Sync**: Configured with fractional zoom (`zoomSnap: 0.25`, `zoomDelta: 0.5`), wheel smoothing, inertial drag (`inertia: true`), canvas vector rendering (`preferCanvas: true`), and `ResizeObserver` invalidation.
- **Anti-Collision Pin Spreading**: Deterministic spiral offset with tether lines back to raw WGS-84 coordinates ensures workers punching from the exact same gate or tower remain individually clickable.
- **Multi-Layer Cartography & Geofences**: Switch between **Clean GIS (Carto Voyager)**, **Street (OpenStreetMap)**, and **Satellite HD (Esri World Imagery)**, with toggleable authorized hub geofence boundaries (`KNOWN_HUBS`).
- **Interactive Fly-To Directory**: Search and filter pins (`All`, `Verified`, `Pending`, `Disputed`), hover to highlight confidence rings, click to smoothly `flyTo` the pin and open its popup, **Fit All** pins, toggle fullscreen expansion, or open **View Slip** and **Court Exhibit** directly from the map footer.
- **Multi-Sample Hardware GNSS Lock**: Uses `navigator.geolocation.watchPosition` over a convergence window with 6-decimal coordinates (~0.11m ground resolution), clock-skew checks, anti-spoofing heuristics, and Nominatim reverse geocoding.

### 3.5. Extreme Scalability Architecture (3-Pillar Engine)
1. **Asynchronous Ingress Buffer (`src/services/ingressBuffer.ts`)**: Non-blocking `POST /api/ingress/enqueue` returning HTTP 202 in `<5ms` with provisional tokens (`PROV-SHP-XXXX`), drained by background workers with Dead-Letter Queue isolation.
2. **CQRS Materialized Passbook Projections (`src/services/cqrsMaterializer.ts`)**: Maintains pre-aggregated `WorkerSummary` projections for `O(1)` lookup (`GET /api/worker/:phone/summary`) plus monthly Merkle-rooted archive exports (`GET /api/archive/export`).
3. **Edge Write-Ahead Log & Delta Sync (`src/services/offlineWal.ts`)**: Browser IndexedDB WAL with vector clocks and client SHA-256 digests reconciled via `POST /api/sync/delta`.

### 3.6. Accessible Indic UI & Multilingual Voice Read-Aloud
- **6 Indic Languages (`src/i18n/translations.ts`)**: Full UI + Web Speech API voice narration (`src/utils/speech.ts`) across **English (`en-IN`)**, **Hindi (`hi-IN`)**, **Kannada (`kn-IN`)**, **Telugu (`te-IN`)**, **Tamil (`ta-IN`)**, and **Malayalam (`ml-IN`)**.
- **6 Workspace Views**: `1. Mark Attendance`, `2. Worker Passbook`, `3. Attendance Register`, `4. Work Map`, `5. EPC Compliance`, `6. Talent & Credentials`, plus `All-in-One`.
- **₹2 CSC Single-Page Passbook Printout**: Formatted A4 printable **Shramik Pramaan-Patra** with verification QR code.

### 3.7. Avian Flocking Simulation & Dual-Tier Resilient Persistence
- **Craig Reynolds Flying Bird Flock Boids (`src/components/BoidsCanvas.tsx`)**: 38-agent 60 FPS background canvas implementing Separation, Alignment, Cohesion, dynamic roll banking, 2.5D parallax depth, pointer startle, wind shockwave scatter, and Zen Sky View.
- **Dual-Tier Storage**: Cloud SQL PostgreSQL (Drizzle ORM in `src/db/`) with automatic zero-downtime POSIX atomic file fallback (`work_logs_db.json`, `workers_db.json`, `disputes_db.json`, `compliance_holds_db.json`, `site_offers_db.json`).

---

## 4. System Architecture & File Map

```
├── server.ts                          # Express 5 API server, RBAC, Cloud Run port handling & Vite middleware
├── index.html                         # HTML entry point, SEO/OG metadata, Indic fonts & Leaflet CSS
├── vite.config.ts                     # Vite bundler + Workbox PWA manifest configuration
├── package.json                       # Dependencies, build hooks (gcp-build) & scripts
├── work_logs_db.json                  # Atomic local work logs store (POSIX fallback)
├── workers_db.json                    # Registered labourers & trade directory store
├── compliance_holds_db.json           # Persisted Principal Employer retention holds (Pivot 1)
├── site_offers_db.json                # Persisted direct site deployment offers (Pivot 3)
│
├── src/
│   ├── App.tsx                        # Main orchestration, 6-tab workspace, role switching & offline sync
│   ├── types.ts                       # Core TypeScript types (WorkLog, SiteComplianceSummary, WorkerSkillCredential, etc.)
│   │
│   ├── components/
│   │   ├── Header.tsx                 # Masthead, role switcher, Indic language picker, voice guide & Zen toggle
│   │   ├── FieldTelegraphStation.tsx  # Dual-punch Sign-In / Sign-Off desk, live duty ticker & DFSA macros
│   │   ├── EnterpriseComplianceConsole.tsx # Pivot 1: EPC joint-liability audit, retention holds & bulk approve
│   │   ├── WorkforceTalentBench.tsx   # Pivot 3: Verified labor bench, skill passports & direct site offers
│   │   ├── LiveMap.tsx                # Fluid Leaflet GIS map (flyTo, anti-collision pins, 3 layers, geofences)
│   │   ├── WorkerProfile.tsx          # Passbook, Skill & Credit strip, job offer actions & CSC A4 printout
│   │   ├── LedgerTable.tsx            # Form V muster roll table with Sec 63 BSA stamps & CSV export
│   │   ├── CourtEvidenceCertificateModal.tsx # Printable Section 63(4) BSA court admissibility exhibit
│   │   ├── DigitalReceiptModal.tsx    # Official wage slip modal with verification QR code
│   │   ├── LabourRegistrationModal.tsx # BOCW Form 1 worker registration & Shramik Card generator
│   │   ├── MetricsOverview.tsx        # Summary KPI cards with voice read-aloud
│   │   ├── NetworkSyncRibbon.tsx      # Real-time online/offline & IndexedDB WAL sync indicator
│   │   ├── AndroidInstallModal.tsx    # Android PWA / WebAPK QR install modal
│   │   ├── TutorialModal.tsx          # Dual-role multilingual walkthrough (Worker vs Supervisor)
│   │   ├── BoidsCanvas.tsx            # 38-agent Craig Reynolds flocking swallow simulation
│   │   └── Sidebar.tsx                # Worker selector, direct phone search & quick actions
│   │
│   ├── services/
│   │   ├── enterpriseCompliance.ts    # Pivot 1 compliance aggregation & Pivot 3 skill/credit math
│   │   ├── storage.ts                 # Client ledger sync, wage accounting & offline queue manager
│   │   ├── validators.ts              # Zod validation schemas for attendance, disputes, holds & offers
│   │   ├── ingressBuffer.ts           # Sub-5ms asynchronous ingress queue & DLQ
│   │   ├── cqrsMaterializer.ts        # O(1) materialized worker summaries & Merkle archive exporter
│   │   ├── offlineWal.ts              # IndexedDB Write-Ahead Log with vector clocks
│   │   ├── atomicStorage.ts           # POSIX mutex-guarded atomic JSON persistence
│   │   ├── preAiBot.ts                # Deterministic DFSA multilingual rule engine
│   │   └── auth.ts                    # Signed session token acquisition & authenticated fetch helper
│   │
│   ├── middleware/
│   │   ├── auth.ts                    # HMAC session & Firebase ID token verification + role RBAC
│   │   ├── observability.ts           # Request IDs, latency tracking & metrics
│   │   ├── idempotency.ts             # Idempotency key deduplication
│   │   └── rateLimiter.ts             # Sliding-window rate limiter
│   │
│   ├── db/                            # Drizzle ORM schema, pg Pool & user store
│   ├── i18n/                          # Translations & onboarding scripts across 6 Indic languages
│   ├── hooks/                         # PWA install lifecycle hook
│   └── utils/                         # High-accuracy GNSS telemetry & Web Speech narration
│
└── tests/
    └── app.test.ts                    # 18-point automated integrity, audit & compliance test suite
```

---

## 5. Automated Verification & Audit Test Suite

Run the full 18-point verification suite:
```bash
npm test
```

| # | Test Case | Verification Guarantee |
| :-: | :--- | :--- |
| **1** | **E.164 Phone & Coordinate Validation** | Validates E.164 phone formats (`+919876543210`) and rejects malformed numbers via Zod. |
| **2** | **Role-Based Authorization Gates** | Asserts non-admin and unauthenticated roles cannot execute administrative resets. |
| **3** | **Unique Workdays Accounting** | Proves duplicate punches on the same calendar day count as 1 unique workday. |
| **4** | **Wage Balance Accounting** | Verifies $\text{Outstanding} = \text{Earned} - \text{Paid}$ across full, partial, and unpaid days. |
| **5** | **Dispute Amount Validation** | Rejects zero and negative monetary claims during dispute submission. |
| **6** | **Dispute Workflow & Case IDs** | Verifies `SS-XXXX` case ID generation and `null` coordinate preservation when GPS is absent. |
| **7** | **Atomic Storage Mutex Concurrency** | Simulates 5 simultaneous writes at the same millisecond with zero lost updates. |
| **8** | **Sliding Window Rate Limiter** | Verifies request bursts beyond threshold return HTTP 429 Too Many Requests. |
| **9** | **Dual-Punch Statutory Rules** | Enforces half-day (`<4h` @ 50%) and overtime (`>8.5h` @ 2x) rules. |
| **10** | **Asynchronous Ingress Buffer** | Verifies sub-5ms enqueue, immediate provisional token (`PROV-SHP-XXXX`), and queue tracking. |
| **11** | **CQRS Materialized Summary** | Asserts O(1) passbook summary lookups without scanning full historical tables. |
| **12** | **Offline Write-Ahead Log (WAL)** | Validates client signatures, vector clocks, and sync state transitions. |
| **13** | **Strict Session Authentication** | Verifies signed token verification, tamper rejection, and HTTP 401 enforcement. |
| **14** | **Dynamic Trade Wage Accruals** | Enforces half-day and 2x overtime math across custom daily wage rates (₹850, ₹1000). |
| **15** | **Sub-Meter 6-Decimal GNSS Precision** | Validates 6-decimal resolution, Haversine distance, and nearest industrial hub matching. |
| **16** | **Section 63 BSA Court Admissibility** | Validates clock skew, spoof detection flagging, geofence bounds, and SHA-256 digests. |
| **17** | **Pivot 1 EPC Compliance Aggregation** | Verifies Form V readiness, coarse GPS flags, unpaid joint-liability ₹ exposure, and retention holds. |
| **18** | **Pivot 3 Skill & Credit Passports** | Verifies deterministic skill tiering, micro-credit limit math, insurance eligibility, and offer schemas. |

---

## 6. REST API Reference

### System, Auth & Core Attendance Endpoints
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/healthz` | Public | Liveness probe returning uptime, memory usage, and PID |
| `GET` | `/readyz` | Public | Readiness probe reporting storage and PostgreSQL connectivity |
| `GET` | `/api/status` | Public | System status, storage backend, and total muster log count |
| `POST` | `/api/auth/session` | Public | Issues signed session token aligned to requested demo/test role |
| `GET` | `/api/auth/me` | Authenticated | Returns active authenticated user profile & role |
| `GET` | `/api/metrics` | Authenticated | Server observability metrics and heap usage |
| `GET` | `/api/logs` | Authenticated | Lists attendance & muster logs |
| `GET` | `/api/workers` | Authenticated | Retrieves registered labourers with trade, wage & worksite |
| `POST` | `/api/workers/register` | Authenticated | Registers a new labourer and issues `SHR-2026-XXXX` ID |
| `POST` | `/api/attendance` | Authenticated | Records shift sign-in with GNSS telemetry or preset hub |
| `POST` | `/api/attendance/checkout` | Authenticated | Records shift sign-off, sealing duration and calculating wages |
| `POST` | `/api/attendance/action` | Employer, Admin | Acknowledges or disputes a specific attendance log |
| `POST` | `/api/dispatch` | Authenticated | Processes Field Telegraph / DFSA command submissions |

### Enterprise EPC Compliance & Workforce Bench Endpoints (Pivots 1 & 3)
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/compliance/holds` | Authenticated | Retrieves active contractor retention hold records per worksite |
| `POST` | `/api/compliance/holds` | Employer, Admin | Places or releases a contractor retention payout hold |
| `POST` | `/api/compliance/bulk-acknowledge` | Employer, Admin | Bulk-confirms clean geotagged attendance logs at a worksite |
| `GET` | `/api/recruitment/offers` | Authenticated | Lists direct EPC-to-worker site deployment offers |
| `POST` | `/api/recruitment/offers` | Employer, Admin | Dispatches a structured job deployment offer to a verified worker |
| `PATCH` | `/api/recruitment/offers/:id` | Authenticated | Accepts or declines a pending site deployment offer |

### Scalability, Disputes & Administration Endpoints
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ingress/enqueue` | Authenticated | Sub-5ms non-blocking enqueue returning provisional token |
| `GET` | `/api/ingress/status/:jobId` | Authenticated | Polls processing status of an enqueued ingress punch |
| `GET` | `/api/ingress/metrics` | **Administrator** | Queue depth, processed metrics, and dead-letter statistics |
| `GET` | `/api/worker/:phone/summary` | Authenticated | O(1) CQRS materialized passbook summary projection |
| `GET` | `/api/archive/export` | Authenticated | Exports monthly statutory muster archive with Merkle root |
| `POST` | `/api/sync/delta` | Authenticated | Reconciles edge offline Write-Ahead Log (WAL) batch deltas |
| `GET` | `/api/disputes` | Authenticated | Lists registered wage disputes (`SS-XXXX`) |
| `PATCH` | `/api/disputes/:id` | **Administrator** | Updates dispute review/resolution status |
| `POST` | `/api/reset` | **Administrator** | Resets demonstration data with append-only audit logging |

---

## 7. Local Development & Deployment

### Prerequisites
- **Node.js**: v20+ or v22.x
- **npm**: v10+
- **PostgreSQL (Optional)**: Cloud SQL or local PostgreSQL (if omitted, runs seamlessly on POSIX atomic JSON stores)

### Setup & Verification
```bash
npm install
npm test      # Runs 18-point integrity, compliance & credential test suite
npm run lint  # TypeScript strict check (tsc --noEmit)
npm run dev   # Launches Express + Vite dev server on http://localhost:3000
```

### Environment Variables (`.env.example`)
- `PORT`: `3000` in development, `8080` in Cloud Run production.
- `PLATFORM_SIGNING_KEY`: Secret key for HMAC session signing.
- `SQL_HOST`, `SQL_USER`, `SQL_PASSWORD`, `SQL_DB_NAME`: Optional Cloud SQL PostgreSQL connection.
- `TWILIO_AUTH_TOKEN`: Optional webhook signature validation key.
- `FIREBASE_API_KEY`: Optional Firebase client/admin integration configuration.

### Production Build
```bash
npm run build
npm start
```

---

## 8. Statutory Reference & Legal Notice

Shramik Sakshi is designed in reference to Indian labor and electronic evidence frameworks:
1. **Section 63 of Bharatiya Sakshya Adhiniyam, 2023 (BSA)** (formerly Section 65B, Indian Evidence Act): Admissibility, custodian certification, clock parity, and hash integrity of electronic records.
2. **Code on Wages, 2019 & Minimum Wages Rules (Rule 26 Form V)**: Muster roll maintenance, overtime multipliers, and timely wage disbursement accountability.
3. **Building and Other Construction Workers (BOCW) Act, 1996**: Principal Employer accountability, 90-day welfare eligibility tracking, and contractor compliance verification.
4. **The Unorganized Workers' Social Security Act, 2008**: Social security registration readiness and portable credential tracking.

*Legal Notice*: Attendance slips provide contemporaneously recorded digital evidence (timestamps, 6-decimal WGS-84 coordinates, dual-punch durations, peer quorum, and Section 121 estoppel windows). Formal enforcement requires statutory inspection or corroborating muster records.

---

## 9. License

Licensed under the **MIT License**. See [LICENSE](LICENSE) for details.
