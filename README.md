# Shramik Sakshi (श्रमिक साक्षी)
### Tactile Civic Field Ledger & Evidentiary Wage Accounting Engine for Informal Labor

[![System Status](https://img.shields.io/badge/System-Production%20Hardened-emerald.svg)]()
[![PWA / WebAPK](https://img.shields.io/badge/PWA-Standalone%20WebAPK%20Ready-success)](https://ais-pre-uoqvwycrm5u3fbnfejrbix-231442645315.asia-northeast1.run.app)
[![Legal Framework](https://img.shields.io/badge/Evidentiary%20Standard-Sec%2063%20BSA%202023-amber.svg)]()
[![Statutory Rule](https://img.shields.io/badge/Muster%20Roll-Central%20MW%20Rule%2026%20(Form%20V)-blue.svg)]()
[![Database](https://img.shields.io/badge/Database-Cloud%20SQL%20PostgreSQL%20%2B%20Atomic%20POSIX-336791.svg)]()
[![Auth & RBAC](https://img.shields.io/badge/Auth-Firebase%20%2B%20Multi--Role%20RBAC-FFA611.svg)]()
[![Pre-AI Engine](https://img.shields.io/badge/Engine-Deterministic%20DFSA%20(Pre--AI)-9b2226.svg)]()
[![Scale Architecture](https://img.shields.io/badge/Scalability-Ingress%20Buffer%20%7C%20CQRS%20%7C%20Offline%20WAL-purple.svg)]()
[![Languages](https://img.shields.io/badge/Indic%20Speech-EN%20%7C%20HI%20%7C%20KN%20%7C%20TE%20%7C%20TA%20%7C%20ML-indigo.svg)]()
[![Test Suite](https://img.shields.io/badge/Tests-12%2F12%20Integrity%20Audits%20Passing-brightgreen.svg)]()

---

## 📲 Live Application & Progressive Web App (PWA)

| Environment | Access Link | Protocol / Port |
| :--- | :--- | :--- |
| **Production PWA / WebAPK** | [**👉 Open Shramik Sakshi Production App**](https://ais-pre-uoqvwycrm5u3fbnfejrbix-231442645315.asia-northeast1.run.app) | Cloud Run Container (`PORT=8080`) |
| **Development Preview** | [**👉 Open Dev Server**](https://ais-dev-uoqvwycrm5u3fbnfejrbix-231442645315.asia-northeast1.run.app) | Vite Dev Proxy (`PORT=3000`) |
| **Web App Manifest** | [`/manifest.webmanifest`](https://ais-pre-uoqvwycrm5u3fbnfejrbix-231442645315.asia-northeast1.run.app/manifest.webmanifest) | W3C Validated Standalone PWA |
| **Health Probe** | [`/healthz`](https://ais-pre-uoqvwycrm5u3fbnfejrbix-231442645315.asia-northeast1.run.app/healthz) | Production Liveness Probe |
| **Readiness Probe** | [`/readyz`](https://ais-pre-uoqvwycrm5u3fbnfejrbix-231442645315.asia-northeast1.run.app/readyz) | Storage & Schema Readiness |

### How to Install on Android Phone:
1. Open the [**Production App Link**](https://ais-pre-uoqvwycrm5u3fbnfejrbix-231442645315.asia-northeast1.run.app) on any Android mobile browser (Chrome, Brave, Samsung Internet).
2. Tap the **"📲 Download App (ऐप डाउनलोड)"** button in the top navigation or mobile banner, or select **"Install app / Add to Home screen"** from the browser menu (**⋮**).
3. The official **Shramik Sakshi 🛠️** WebAPK icon will install directly onto the device home screen.
4. **Zero-Connectivity Field Operation**: Precached by Workbox service workers; records punch events offline into local Write-Ahead Logs (WAL) and automatically synchronizes upon network restoration.

---

## 1. Problem Statement

Across the informal economy, over **450 million unorganized and daily-wage laborers**—including construction workers, masons, domestic staff, agricultural hands, and loading dock labor—work without written employment contracts. Their livelihood hinges on oral wage agreements and opaque paper muster rolls kept exclusively by labor contractors (*thekedars* or *mukadams*).

### Systemic Vulnerabilities in Informal Labor:
1. **Rampant Wage Theft & Arbitrary Deductions**: At weekend settlement, workers face unilateral pay cuts: *"You missed Tuesday,"* or *"You left early."* Lacking contemporaneous records, laborers cannot contest arbitrary wage withholding.
2. **Ghost Worker Inflation vs. Real Worker Exclusion**: Corrupt intermediaries inflate physical muster rolls with ghost entries while underpaying real laborers present on site.
3. **Severe Literacy & Tech Barriers**: Enterprise HR portals and biometric hardware fail in the field—they require high-speed internet, English literacy, complex passwords, and app store accounts.
4. **Fragile Digital Records & Tampering**: Ad-hoc prototypes use unprotected REST endpoints, in-memory state that vanishes on server restart, and unversioned JSON files that offer zero tamper-evident auditability.
5. **Legally Dubious Evidentiary Claims**: Simple GPS pins are frequently misrepresented as "foolproof legal evidence," ignoring that raw coordinates can be spoofed and that momentary presence near a worksite does not legally prove an 8-hour workday without employer corroboration or dispute estoppel.

---

## 2. The Solution: Shramik Sakshi

**Shramik Sakshi (श्रमिक साक्षी — "Worker's Witness")** is a **Tactile Civic Field Ledger** engineered to bridge the trust and evidence divide in informal labor. It combines forensic Section 63 BSA legal standards, multi-role authorization, dual-punch shift tracking, asynchronous ingress buffers, and accessible Indic interfaces.

```
═══════════════════════════════════════════════════════════════════════════════
                      SHRAMIK SAKSHI CORE ARCHITECTURE
═══════════════════════════════════════════════════════════════════════════════

   [Field Laborer]            [Site Mukadam / Employer]      [Labor Inspector / NGO]
          │                               │                            │
   Offline Mobile PWA            Field Telegraph / SMS         Civic Admin Console
          │                               │                            │
          ▼                               ▼                            ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                       HIGH-THROUGHPUT INGRESS LAYER                         │
 │  • Sub-5ms Ingress Buffer with Immediate Provisional Token (PROV-SHP-XXXX)  │
 │  • Edge Offline Write-Ahead Log (WAL) with Vector Clocks & Cryptographic Hash│
 │  • Stripe/Razorpay-Style Idempotency Middleware (Key Caching & Deduplication)│
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
 ┌──────────────────────────────────────▼──────────────────────────────────────┐
 │                    DETERMINISTIC DFSA BUSINESS LOGIC                        │
 │  • Dual-Punch Shift Engine (Check-In & Check-Out Duration Calculations)     │
 │  • Statutory Overtime (>8h @ 2x rate) & Half-Day (<4h @ 50% rate) Rules     │
 │  • 2-Hour Employer Estoppel Window & Peer Quorum Site Verification          │
 │  • Multi-Turn Wage Theft Dispute System generating Case IDs (SS-XXXX)       │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
 ┌──────────────────────────────────────▼──────────────────────────────────────┐
 │                      STORAGE & SCALABILITY TIER                             │
 │  • Cloud SQL PostgreSQL (Drizzle ORM) with Automatic POSIX Atomic Fallback  │
 │  • CQRS Materialized Passbook Projections in O(1) Fetch Time                │
 │  • Append-Only Audit Trail (Sec 63 BSA & Rule 26 Form V Muster Compliance)  │
 │  • Cold Storage Evidentiary Archive Manifests with Merkle Root Integrity    │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Comprehensive Feature Matrix & Capabilities

### 3.1. Forensic Statutory Shift & Wage Engine
- **Dual-Punch Shift Protocol**: Separate check-in (morning ingress) and check-out (evening egress) tracking that captures precise shift durations, GPS accuracy radiuses, and photo verification.
- **Central Minimum Wages Rules (Rule 26 Form V)**:
  - **Half-Day Rule**: Shifts under 4.0 hours are recorded as `half_day` with 50% base daily wage.
  - **Standard Day**: Shifts between 4.0 and 8.5 hours are recorded as `completed` at 100% agreed wage.
  - **Statutory Overtime**: Shifts exceeding 8.5 hours automatically calculate overtime at 2x the base hourly rate:
    $$\text{Earned Wage} = \text{Base Wage} + \left((\text{Hours} - 8) \times \frac{\text{Base Wage}}{8} \times 2\right)$$
- **Forensic Section 63 BSA Evidentiary Slips**: Every attendance punch generates a cryptographically signed verification slip with a high-entropy token (`SHP-XXXX-XXXX`), SHA-256 token hash, custodian certificate ID (`BSA63-DL-XXXXXX`), and timestamp.
- **2-Hour Estoppel Window**: When a worker clocks in, a statutory 2-hour employer dispute window begins (`dispute_window_expires_at`). If unflagged by the employer within the window, estoppel principles corroborate presence.
- **Peer Quorum Verification**: Tracks peer attendance density on the same worksite (`peer_quorum_count`), corroborating individual claims with collective muster quorum.

### 3.2. Extreme Scalability Architecture (3-Pillar Optimization)
1. **Pillar 1: Asynchronous Ingress Buffer (`src/services/ingressBuffer.ts`)**:
   - Engineered for 10M+ morning punch spikes across labor markets.
   - Non-blocking enqueue endpoint (`POST /api/ingress/enqueue`) returns HTTP 202 in **< 5ms** with an immediate provisional token (`PROV-SHP-XXXX`).
   - Background consumer drains batches every 50ms, processing validations, committing to storage, updating CQRS projections, and routing unresolvable records to a Dead-Letter Queue (DLQ).
2. **Pillar 2: CQRS Materialized Passbook Projection (`src/services/cqrsMaterializer.ts`)**:
   - Implements Command Query Responsibility Segregation (CQRS).
   - Ingestion updates pre-aggregated read projections (`WorkerSummary`), enabling O(1) constant-time passbook retrieval (`GET /api/worker/:phone/summary`) without scanning historical transaction tables.
   - Evidentiary archive manifests (`GET /api/archive/export`) bundle complete monthly muster rolls with SHA-256 Merkle root verification.
3. **Pillar 3: Edge Write-Ahead Log (WAL) & Vector Clocks (`src/services/offlineWal.ts`)**:
   - Client-side tamper-resistant transaction log persisted in IndexedDB.
   - Implements monotonically increasing vector clocks and SHA-256 client signatures for every offline event.
   - Delta batch synchronization (`POST /api/sync/delta`) merges offline punch queues with conflict-free server reconciliation.

### 3.3. Tactile Civic Field Ledger & Accessible Indic UI
- **Civic Risograph Aesthetic**: Authentic administrative field register design featuring official Section 63 BSA rubber stamp impressions (`VERIFIED`, `DISPUTED`, `PENDING`), vellum textures, and brass telegraph gauges.
- **Multilingual Web Speech Narration**: Integrated Web Speech API (`src/utils/speech.ts`) supporting natural voice read-aloud across **6 Indic languages**:
  - English (`en-IN`)
  - Hindi (`hi-IN` — हिंदी)
  - Kannada (`kn-IN` — ಕನ್ನಡ)
  - Telugu (`te-IN` — తెలుగు)
  - Tamil (`ta-IN` — தமிழ்)
  - Malayalam (`ml-IN` — മലയാളം)
- **Field Telegraph Station**: Emulates telegram and SMS punch dispatches with immediate receipt rendering, live counter telemetry, and shift action controls.
- **WhatsApp Simulator Modal**: Demonstrates zero-app conversational punch capture via simulated WhatsApp and Twilio messaging webhook integrations (`POST /api/webhook`).
- **Interactive Live GIS Map**: Leaflet-powered geolocation view plotting active laborer worksites with accuracy rings and status color codes.
- **Dual Guided Onboarding Walkthroughs**: Role-tailored interactive tutorials covering worker self-registration, punch creation, receipt generation, and supervisor muster confirmation.
- **Craig Reynolds 2D Flocking Simulation**: A dynamic twilight sky canvas with flocking boids behind the ledger, toggleable with a single-click "Zen Field Mode".

### 3.4. Dual-Tier Resilient Storage Architecture
- **Primary Tier: Cloud SQL PostgreSQL (`src/db/`)**:
  - Full relational ACID persistence using Drizzle ORM.
  - Relational tables: `users`, `engagements`, `attendance_records`, `wage_records`, `disputes`, `audit_logs`.
- **Zero-Downtime POSIX Atomic File Fallback (`src/services/atomicStorage.ts`)**:
  - Automatically activates when `SQL_HOST` is unconfigured.
  - POSIX-compliant atomic file writes using tempfile creation and atomic renames to eliminate lost-update race conditions during concurrent requests.
- **Append-Only Tamper-Evident Audit Trail**:
  - Administrative resets and status modifications never erase historical state.
  - Records previous state, new state, operating user UID, role, timestamp, and audit rationale.

---

## 4. System Architecture & Component Mapping

```
├── server.ts                    # Production Express 5 entry point, Cloud Run port detection & Vite dev middleware
├── index.html                   # HTML entry point, SEO metadata, Indic fonts & Leaflet stylesheet
├── package.json                 # Dependency manifest, build scripts, gcp-build hooks & Node 22 runtime
├── work_logs_db.json            # Persistent atomic local JSON ledger store (POSIX file fallback)
│
├── src/
│   ├── App.tsx                  # Main client orchestration, view switcher, PWA prompts & toast engine
│   ├── types.ts                 # Full TypeScript definitions (WorkLog, WorkerSummary, UserRole, etc.)
│   │
│   ├── components/
│   │   ├── Header.tsx           # Civic masthead, language dropdown, role switcher & Android PWA install trigger
│   │   ├── FieldTelegraphStation.tsx # Punch dispatch console with dual-punch (IN/OUT) shift controls
│   │   ├── LedgerTable.tsx      # Form V muster roll register with official Section 63 BSA rubber stamps
│   │   ├── MetricsOverview.tsx  # KPI cards: Active Workers, Total Workdays, Secured Capital, Outstanding Wages
│   │   ├── WorkerProfile.tsx    # Digital Passbook summary, wage reconciliation & evidentiary receipt drawer
│   │   ├── LiveMap.tsx          # Leaflet GIS interactive worksite pin clustering & GPS radius visualizer
│   │   ├── DigitalReceiptModal.tsx   # Formal Section 63 BSA Certificate Slip with QR code & WhatsApp share
│   │   ├── NetworkSyncRibbon.tsx     # Real-time connectivity monitor & background IndexedDB sync progress bar
│   │   ├── AndroidInstallModal.tsx   # Native Android installation guide with QR code desktop-to-mobile bridge
│   │   ├── TutorialModal.tsx         # Multilingual step-by-step onboarding walkthrough (Worker vs Admin)
│   │   ├── WhatsAppSimulatorModal.tsx# Field WhatsApp conversational punch simulator
│   │   ├── BoidsCanvas.tsx      # 2D flocking simulation background with Zen Mode controls
│   │   └── Sidebar.tsx          # Quick actions drawer and role-based operational controls
│   │
│   ├── services/
│   │   ├── ingressBuffer.ts     # Asynchronous high-throughput queue with provisional token issuance (Tip 1)
│   │   ├── cqrsMaterializer.ts  # Pre-computed passbook read projections & cold archive manifest exporter (Tip 2)
│   │   ├── offlineWal.ts        # IndexedDB Write-Ahead Log, vector clocks & delta batch sync (Tip 3)
│   │   ├── atomicStorage.ts     # Thread-safe POSIX atomic file persistence with read-through cache
│   │   ├── preAiBot.ts          # Deterministic DFSA multilingual conversational rule engine & case generator
│   │   ├── storage.ts           # Client-side state synchronization, calculation helpers & IndexedDB queues
│   │   └── validators.ts        # Zod validation schemas for phone numbers, disputes & attendance payloads
│   │
│   ├── middleware/
│   │   ├── auth.ts              # Firebase ID Token verification & multi-role RBAC authorization gates
│   │   ├── observability.ts     # Request metrics, correlation IDs (x-request-id) & latency tracking
│   │   ├── idempotency.ts       # Financial transaction idempotency cache with TTL expiration
│   │   └── rateLimiter.ts       # Sliding window in-memory rate limiter protecting punch endpoints
│   │
│   ├── db/
│   │   ├── schema.ts            # Drizzle PostgreSQL relational schema with foreign key constraints
│   │   ├── index.ts             # pg Pool connection factory with graceful offline fallback
│   │   ├── users.ts             # User creation, lookup & role mapping utilities
│   │   └── drizzle.config.ts    # Drizzle Kit CLI migration configuration
│   │
│   ├── context/
│   │   └── LanguageContext.tsx  # React context managing selected Indic language & translation dictionaries
│   │
│   ├── i18n/
│   │   ├── translations.ts      # UI string dictionaries across 6 Indic languages
│   │   └── tutorialData.ts      # Dual-role onboarding tutorial script content
│   │
│   ├── hooks/
│   │   └── usePWAInstall.ts     # PWA BeforeInstallPromptEvent hook with standalone detection
│   │
│   └── utils/
│       └── speech.ts            # Web Speech API speech synthesis wrapper with voice fallback
│
└── tests/
    └── app.test.ts              # 12-point automated integrity, audit & concurrency test suite
```

---

## 5. Automated Verification & Audit Test Suite

The repository includes a comprehensive 12-point automated audit suite that validates critical accounting, security, and scalability guarantees.

Run the test suite:
```bash
npm test
```

### Verified Test Cases:
| # | Test Suite Case | Verification Guarantee |
| :-: | :--- | :--- |
| **1** | **E.164 Phone & Coordinate Validation** | Validates proper E.164 phone formats (`+919876543210`) and rejects malformed numbers via Zod. |
| **2** | **Role-Based Authorization Gates** | Asserts that non-admin and unauthenticated roles cannot execute administrative resets or elevated actions. |
| **3** | **Unique Workdays Accounting** | Proves multiple punches on the same calendar day are deduplicated into 1 unique workday. |
| **4** | **Wage Balance Accounting** | Verifies accuracy of $\text{Outstanding} = \text{Earned} - \text{Paid}$ across multi-day disbursements. |
| **5** | **Dispute Amount Validation** | Rejects zero, negative, or non-numeric monetary claims during dispute registration. |
| **6** | **Dispute Workflow & Case IDs** | Asserts generation of persistent `SS-XXXX` dispute IDs and preservation of `null` coordinates when GPS is absent. |
| **7** | **Atomic Storage Mutex Concurrency** | Simulates 5 simultaneous punches arriving at the identical millisecond; proves zero lost updates. |
| **8** | **Sliding Window Rate Limiter** | Verifies that request bursts beyond threshold trigger HTTP 429 Too Many Requests. |
| **9** | **Dual-Punch Statutory Rules** | Enforces half-day (<4h) 50% pay and statutory overtime (>8h) double-rate calculations. |
| **10** | **Asynchronous Ingress Buffer** | Verifies sub-5ms non-blocking enqueue, immediate provisional token issuance, and queue depth telemetry. |
| **11** | **CQRS Materialized Summary** | Asserts O(1) passbook summary lookups without full-table historical muster roll scans. |
| **12** | **Offline Write-Ahead Log (WAL)** | Validates client cryptographic signatures, vector clocks, and delta batch synchronization. |

---

## 6. Complete REST API Reference

### Core Attendance & Ledger Endpoints
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/healthz` | Public | Liveness probe returning process uptime, memory usage, and PID |
| `GET` | `/readyz` | Public | Readiness probe reporting storage and database connectivity |
| `GET` | `/api/status` | Public | System status, database engine, log count, and webhook URL |
| `GET` | `/api/metrics` | Authenticated | Server metrics, active connections, and latency percentiles |
| `GET` | `/api/logs` | Authenticated | Retrieves attendance muster roll entries |
| `POST` | `/api/attendance` | Authenticated | Records an attendance punch with GPS coordinates or preset |
| `POST` | `/api/attendance/checkout` | Authenticated | Records shift check-out, sealing duration and calculating wages |
| `POST` | `/api/attendance/action` | Employer, Admin | Acknowledges (`attendance_acknowledged`) or disputes a punch |
| `POST` | `/api/dispatch` | Authenticated | Field Telegraph submission processed via deterministic DFSA engine |
| `POST` | `/api/webhook` | Public | Twilio WhatsApp incoming message webhook handler |

### Scalability Engine Endpoints (Tips 1, 2, 3)
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ingress/enqueue` | Public | Sub-5ms non-blocking enqueue returning provisional token |
| `GET` | `/api/ingress/status/:jobId` | Public | Polls processing status of an enqueued ingress punch |
| `GET` | `/api/ingress/metrics` | Public | Queue depth, processed count, and dead-letter statistics |
| `GET` | `/api/worker/:phone/summary`| Public | O(1) CQRS materialized passbook summary projection |
| `GET` | `/api/archive/export` | Authenticated | Exports complete monthly statutory muster archive with Merkle root |
| `POST` | `/api/sync/delta` | Public | Reconciles edge offline Write-Ahead Log (WAL) batch deltas |

### Dispute & Administration Endpoints
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/disputes` | Authenticated | Lists registered wage disputes with assigned inspector info |
| `PATCH` | `/api/disputes/:id` | Administrator | Updates dispute status (`under_review`, `resolved`, `escalated`) |
| `POST` | `/api/reset` | **Administrator** | Resets demonstration data to default state with audit log trail |

---

## 7. Local Development & Deployment Guide

### Prerequisites
- **Node.js**: v20.0 or v22.x
- **npm**: v10.0 or higher
- **PostgreSQL (Optional)**: Cloud SQL or local instance (if omitted, falls back to atomic POSIX file storage)

### Local Setup
```bash
# 1. Clone the repository
git clone https://github.com/saviturius7-lab/Shramik-Sakshi.git
cd Shramik-Sakshi

# 2. Install dependencies (utilizing clean package-lock.json)
npm install

# 3. Execute automated integrity test suite
npm test

# 4. Run TypeScript lint validation
npm run lint

# 5. Launch development server (Node Express + Vite dev middleware)
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Environment Configuration (`.env`)
Copy `.env.example` to `.env` to configure optional external services:
```bash
cp .env.example .env
```
Key configuration parameters:
- `PORT`: Development server port (defaults to `3000` in dev, `8080` in Cloud Run container).
- `SQL_HOST`, `SQL_USER`, `SQL_PASSWORD`, `SQL_DB_NAME`: Cloud SQL PostgreSQL credentials.
- `PLATFORM_SIGNING_KEY`: Secret key for HMAC token signing.
- `TWILIO_AUTH_TOKEN`: Optional webhook signature verification token.

### Production Build & Publishing to Cloud Run
```bash
# Compile static bundle and service worker into dist/
npm run build

# Start production server (serves dist/ assets and handles API routes)
npm start
```
The application includes a `"gcp-build"` hook in `package.json` and on-the-fly bundle compilation safety fallback in `server.ts` to ensure zero-delay container initialization on Cloud Run.

---

## 8. Statutory Reference & Legal Notice

Shramik Sakshi is architected in reference to Indian labor welfare statutes:
1. **Section 63 of Bharatiya Sakshya Adhiniyam, 2023 (BSA)**: Formerly Section 65B of the Indian Evidence Act, 1872. Governs the admissibility of electronic records produced by computer systems, requiring identification of the electronic record, condition of device operation, and certification by authorized personnel.
2. **The Unorganized Workers' Social Security Act, 2008 (Act No. 33 of 2008)**: Directs welfare schemes and social security administration for informal workers.
3. **The Minimum Wages Act, 1948 & Central Minimum Wages Rules (Rule 26 Form V)**: Mandates the maintenance of muster rolls recording dates worked, gross earnings, overtime hours, deductions, and actual disbursements.
4. **Building and Other Construction Workers (BOCW) Act, 1996**: Prescribes statutory protections and welfare board registration conditions for construction labor.

*Legal Notice*: Shramik Sakshi attendance records provide contemporaneously generated digital evidence of submitted timestamps, coordinates, dual-punch shift durations, supervisor acknowledgements, and estoppel timestamps. They do not constitute unilateral judicial proof of employment without supervisor confirmation or corroborating worksite muster records.

---

## 9. License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
