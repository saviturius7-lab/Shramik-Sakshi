# Shramik Sakshi

**An offline-aware attendance, wage-record and workplace-dispute ledger for informal and daily-wage work.**

Shramik Sakshi is a web application prototype for recording when and where a worker reports for work, keeping a worker-centric record of attendance and wage calculations, and giving workers and supervisors a shared workflow for acknowledging or disputing records.

The project is designed around a practical constraint: work sites may have unreliable connectivity, workers may prefer a local language or voice guidance, and a useful record should be understandable without navigating a conventional enterprise HR system.

> **Project status:** Prototype / active development. The repository contains a working React application, an Express API, persistence adapters, offline queues, a rule-based message workflow and automated logic tests. It is not yet a production labour-compliance, payroll, legal-evidence or government-service platform. See [Known limitations](#known-limitations-and-engineering-caveats) before treating any record as authoritative.

---

## Contents

- [What it does](#what-it-does)
- [The problem it is trying to address](#the-problem-it-is-trying-to-address)
- [What makes it different](#what-makes-it-different)
- [Feature walkthrough](#feature-walkthrough)
- [Attendance and verification model](#attendance-and-verification-model)
- [Wage ledger and calculations](#wage-ledger-and-calculations)
- [Dispute workflow](#dispute-workflow)
- [Offline behaviour and synchronization](#offline-behaviour-and-synchronization)
- [Architecture](#architecture)
- [Data model](#data-model)
- [API reference](#api-reference)
- [Technology stack](#technology-stack)
- [Run locally](#run-locally)
- [Tests](#tests)
- [Security, privacy and legal boundaries](#security-privacy-and-legal-boundaries)
- [Known limitations and engineering caveats](#known-limitations-and-engineering-caveats)
- [Roadmap](#roadmap)
- [License](#license)

---

## What it does

At a high level, the application connects four related activities:

1. **Record work:** A worker or operator submits an attendance event with a phone number and either device coordinates or a selected worksite.
2. **Keep a readable record:** The application displays attendance entries in a register and in a worker-specific passbook, with wage figures and a printable receipt.
3. **Make verification explicit:** A submitted location is not automatically represented as employer-confirmed attendance. The record has a verification state that can be acknowledged or disputed by an authorized role.
4. **Preserve access during connectivity loss:** The browser can retain pending submissions locally and attempt to synchronize them when connectivity returns.

The project also includes a guided, WhatsApp-style interaction simulator, multilingual interface text and browser text-to-speech. These are intended to reduce the amount of reading and navigation required for common tasks.

## The problem it is trying to address

Informal and daily-wage work can leave workers with fragmented records of:

- Which days they worked.
- Which site they reported to.
- What wage was agreed or calculated.
- What amount has been paid and what remains outstanding.
- Whether a supervisor acknowledged the attendance.
- Whether a disagreement or wage complaint was raised.

A conventional attendance punch alone does not resolve these problems. A location pin is not proof that a person performed a full shift; a wage estimate is not proof of payment; and a record created by one party should not silently become a mutually accepted record.

Shramik Sakshi attempts to make these distinctions visible in one interface. It is a record-keeping and workflow prototype, not a substitute for an employer's statutory registers, a labour department process, legal advice or an independent investigation.

## What makes it different

The most interesting part of this project is the combination of product decisions and engineering experiments, rather than any one isolated technology.

### 1. Attendance is represented as a sequence of verification states

The system distinguishes a worker-submitted location from a location match and from an employer/supervisor acknowledgement. A disputed record has its own state. This is a better model than displaying every GPS punch as simply “verified”.

### 2. The worker passbook is the centre of the experience

The UI brings together workdays, wage totals, outstanding amounts, individual slips and a downloadable text record. The intent is to make the worker's history legible, not just to give an administrator a dashboard.

### 3. Offline capture is treated as a first-class workflow

There are two browser-side pending-record mechanisms in the codebase: an IndexedDB attendance queue and a separate IndexedDB write-ahead-log (WAL) implementation. The UI exposes network/synchronization status and offers a manual synchronization action.

### 4. A deterministic message parser supports guided, multi-turn actions

The `preAiBot` service uses a finite-state conversation flow for commands such as attendance, wage queries and dispute registration. It is rule-based rather than an LLM chatbot. That makes the supported flows inspectable and predictable, although it also means natural-language coverage is limited.

### 5. The interface is designed for low-friction, multilingual use

The application includes English, Hindi, Kannada, Telugu, Tamil and Malayalam translations, browser speech synthesis, voice read-aloud controls, large touch-oriented actions and separate worker/admin walkthroughs.

### 6. The repository explores scale-oriented backend patterns

An asynchronous in-memory ingress buffer, a materialized worker-summary service, a delta-sync endpoint and idempotency middleware are present. These are useful architectural experiments, but their current in-memory and fallback characteristics mean they should not be described as a durable distributed event platform.

---

## Feature walkthrough

### Attendance desk / Field Telegraph Station

The main attendance interface supports:

- Entering a worker phone number.
- Selecting a predefined worksite.
- Requesting the browser/device's current location when geolocation is available and permission is granted.
- Submitting a work/attendance message.
- Showing the locally generated response and latest slip.
- Sending the submission to the Express `/api/dispatch` endpoint when online.
- Storing a locally created record in the browser queue and WAL when the request fails or the device is offline.

The selected-site path is a manual location declaration. It should not be confused with a GPS measurement or an independently verified geofence.

### Worker passbook

The worker view groups records by phone number and presents a summary of:

- Unique calendar workdays.
- Wage earnings.
- Amounts paid.
- Outstanding wage balance.
- Attendance slips and their current status.

It also provides a downloadable text audit/record export and a print-friendly passbook view.

### Attendance register

The register displays the available attendance records and allows the employer/administrator workflow to acknowledge or dispute an attendance entry. The action is sent to `POST /api/attendance/action`.

### Worksite map

The map uses Leaflet to plot records that contain usable latitude and longitude values. Selecting a worker filters the records shown.

The map is a visualization of submitted coordinates. It does not independently establish that work took place at that location.

### Digital receipt

The receipt modal includes:

- A slip/verification token.
- Worker phone number.
- Date and time.
- Worksite label.
- Wage figure.
- QR code containing the receipt's canonical payload.
- Copy and print actions.
- Optional technical details.

The QR code is a convenient representation of the local receipt payload. The repository does not currently provide a public, independently operated verification service that proves the receipt is genuine.

### WhatsApp-style simulator

The `WhatsAppSimulatorModal` is an in-app simulation of a chat-based worker interaction. It includes quick-reply actions for attendance, location, disputes and wage information, plus browser speech synthesis.

**It is not a live WhatsApp integration.** There is no configured WhatsApp Business API/Twilio webhook or real message delivery pipeline in this repository. The server's dispatch route accepts message-like payloads, but the UI simulator itself runs inside the application.

### Guided onboarding and voice support

- Separate worker and administrator walkthroughs.
- Interface translations for EN, HI, KN, TE, TA and ML.
- Browser-native speech synthesis for supported languages/voices.
- Read-aloud controls on selected summaries and records.
- Android-oriented PWA installation prompt and install guidance.

Speech quality and language availability depend on the browser, operating system and installed speech voices.

### PWA support

The Vite PWA plugin configures a standalone web-app manifest, application icons, automatic service-worker registration/update, asset precaching and a NetworkFirst runtime cache rule for `/api/` requests.

PWA installation and offline behaviour depend on HTTPS/secure-context requirements, browser support, service-worker state and available device storage.

---

## Attendance and verification model

The data model uses the following verification statuses:

| Status | Meaning in this application |
| --- | --- |
| `location_submitted` | A worker-side submission was recorded. It may contain device coordinates or a manually selected site. |
| `location_matched` | A location-match state is represented in the model. The current UI/API should not be interpreted as providing a fully implemented, independently validated geofencing service. |
| `attendance_acknowledged` | An employer/supervisor action acknowledged the attendance record. |
| `attendance_disputed` | The attendance record has been flagged as disputed. |

The important product decision is that these states are not interchangeable. A GPS coordinate is an observation supplied by a device; it does not prove identity, presence for the entire shift, the work performed or the wage owed.

The interface and sample data contain some stronger wording than the underlying evidence model supports. Treat the state names and records as application workflow data, not legal conclusions.

---

## Wage ledger and calculations

The project tracks separate concepts in its data model:

- Agreed daily wage.
- Actual wage earned.
- Amount paid.
- Outstanding amount.
- Payment status.

The intended accounting relationship is:

```text
Outstanding amount = Total earned - Total paid
```

Worker summaries count unique calendar dates rather than blindly treating every punch as a separate workday. The test suite includes a case for multiple submissions on one date.

The deterministic message workflow also contains a check-in/check-out calculation:

- A shift shorter than four hours is treated as a half-day in that rule path.
- A standard shift uses the configured/default daily amount in that path.
- A shift beyond the overtime threshold enters an overtime calculation path.

**Important:** The repository contains multiple wage calculation and persistence paths. The UI, local storage logic, message parser and PostgreSQL-backed routes are not yet a single canonical payroll engine. The default ₹600 figure is a prototype default, not a verified current statutory minimum wage for every occupation, state, worker category or date. Overtime and half-day rules must be reviewed against the applicable employment terms and law before real use.

There is no integrated bank/UPI payout, employer payment confirmation or reconciliation with a payment provider.

---

## Dispute workflow

The deterministic `preAiBot` conversation flow supports a multi-turn wage-dispute registration path:

1. The worker selects the complaint/dispute action.
2. The parser asks for the contractor/employer name.
3. It asks for the claimed amount.
4. It validates that the amount is positive.
5. It creates a case identifier in the `SS-XXXX` format and returns a registration response.
6. The dispatch path attempts to persist the dispute in PostgreSQL when configured and also writes to the file-backed dispute ledger.

The dispute model includes worker phone, contractor name, claimed amount, worksite, optional coordinates and a status field. The administrator route can update dispute status and assignment information.

A generated case ID means that the application registered a record. It does not mean that a labour authority, NGO, court or contractor has received, accepted, investigated or resolved the complaint. No external case-management or NGO referral integration is implemented.

---

## Offline behaviour and synchronization

Offline support is one of the project's central design goals. There are currently two related mechanisms.

### IndexedDB pending attendance queue

Implemented in `src/services/storage.ts`:

- Stores pending attendance records in an IndexedDB object store.
- Tracks pending item count and online/offline/syncing/synced UI states.
- Attempts to drain the queue when the browser comes online.
- Sends queued records to the server dispatch endpoint.
- Removes an item from the queue after a successful server response.

### Offline write-ahead log (WAL)

Implemented in `src/services/offlineWal.ts`:

- Stores check-in, check-out or dispute events in a separate IndexedDB database.
- Adds a local timestamp, WAL ID and monotonically incremented in-memory vector counter.
- Generates a SHA-256 digest using Web Crypto when available.
- Falls back to localStorage if IndexedDB is unavailable.
- Sends pending entries in a delta batch to `POST /api/sync/delta`.
- Marks records as synced when the server returns a token mapping.

### What offline mode does not guarantee

- Browser storage can be cleared, evicted or unavailable.
- The fallback digest is not a digital signature from a trusted identity and is not proof that a record was created by a particular worker.
- The vector counter is local to the running page context; it is not a complete distributed conflict-resolution protocol.
- The server-side ingress buffer and idempotency cache are in-memory structures.
- The delta endpoint currently writes to the file-backed work-log path; it is not a fully durable, authenticated, conflict-free replicated data type implementation.
- A locally queued record is pending data, not a server-confirmed or employer-acknowledged record.

The code contains an offline WAL and delta-sync experiment; it should not be described as a production CRDT implementation or guaranteed zero-loss synchronization system.

---

## Architecture

### High-level structure

```text
Browser / PWA
  React 18 + TypeScript
  ├── Attendance desk / Field Telegraph Station
  ├── Worker passbook and attendance register
  ├── Leaflet worksite map
  ├── Digital receipt and QR display
  ├── WhatsApp-style interaction simulator
  ├── Tutorials, translations and speech synthesis
  ├── IndexedDB pending attendance queue
  └── IndexedDB offline WAL
             |
             | HTTP / JSON
             v
Node.js + Express 5 API
  ├── Authentication and role middleware
  ├── Zod request validation
  ├── Deterministic pre-AI message state machine
  ├── Attendance and dispute routes
  ├── In-memory asynchronous ingress buffer
  ├── In-memory idempotency middleware
  ├── Delta synchronization endpoint
  └── Worker-summary materializer
             |
             +-----------------------+
             |                       |
             v                       v
  PostgreSQL (optional)       File-backed ledger
  Drizzle ORM + pg            work_logs_db.json /
  users, engagements,         disputes_db.json /
  attendance, wages,          session state
  disputes, audit logs
             |
             v
  Firebase Admin / Firestore integrations
  (authentication and summary-related code paths)
```

### Frontend

The frontend is a React 18 single-page application built with TypeScript and Vite. The main composition is in `src/App.tsx`. Feature-specific components live in `src/components/`, shared language state in `src/context/`, translations in `src/i18n/`, and browser-side persistence/synchronization logic in `src/services/`.

### Backend

The Express application is defined in `server.ts`. It exposes health/readiness checks, attendance and dispute workflows, a dispatch parser endpoint, ingress queue endpoints, summary retrieval and delta synchronization.

### Persistence is hybrid, not PostgreSQL-only

PostgreSQL is configured only when `SQL_HOST` is present. The schema and Drizzle integration define relational tables for users, engagements, attendance, wages, disputes and audit logs.

The application also retains JSON/file-backed storage and in-memory fallbacks. Several routes explicitly fall back to the file ledger when PostgreSQL is not configured or an operation fails. Some additional summary code uses Firebase Admin/Firestore-related paths.

This hybrid arrangement makes local demonstration easier, but it introduces multiple sources of truth and different durability/consistency properties. A production deployment should choose and enforce one authoritative persistence strategy.

### Backend engineering experiments

- **Ingress buffer:** `src/services/ingressBuffer.ts` queues jobs in process memory, issues a provisional token, drains batches and keeps a bounded dead-letter list.
- **Materialized summaries:** `src/services/cqrsMaterializer.ts` maintains worker summary projections with a cache/Firestore path and a cold calculation fallback.
- **Idempotency middleware:** `src/middleware/idempotency.ts` caches responses for keyed write requests in a process-local Map with a time-to-live.
- **Atomic file operations:** `src/services/atomicStorage.ts` provides serialized/atomic mutation helpers for the file-backed ledger.
- **Validation:** `src/services/validators.ts` defines Zod schemas for phone numbers, attendance submissions, checkout and disputes.

These components demonstrate useful design patterns, but their current in-memory/process-local elements are not sufficient for multi-instance production deployment.

---

## Data model

The Drizzle PostgreSQL schema in `src/db/schema.ts` defines:

| Table | Purpose |
| --- | --- |
| `users` | Worker, employer and administrator identity/profile records, including phone and role. |
| `engagements` | Worker-employer relationship, worksite, agreed daily wage, payment terms and status. |
| `attendance_records` | Attendance date, coordinates, location method, verification status, hours, wage and token fields. |
| `wage_records` | Earned, paid and outstanding amounts associated with a worker and attendance record. |
| `disputes` | Case ID, worker, contractor, claimed amount, location and case status. |
| `audit_logs` | Actor, role, action, reason, previous state, new state and timestamp. |

The presence of a table in the schema does not mean every user-facing workflow is fully implemented against that table. In particular, the current application still has file-backed routes and incomplete payment/reconciliation workflows.

---

## API reference

The following routes are defined in `server.ts`. “Authenticated” describes the middleware attached to the route in the current code; it is not a claim that the current authentication configuration is production-secure.

| Method | Route | Current purpose / access |
| --- | --- | --- |
| `GET` | `/healthz` | Basic process health check. |
| `GET` | `/readyz` | Readiness and storage-mode information. |
| `GET` | `/api/metrics` | Authenticated operational metrics. |
| `GET` | `/api/auth/me` | Authenticated current-user profile/role. |
| `GET` | `/api/logs` | Authenticated attendance log retrieval. |
| `POST` | `/api/attendance` | Authenticated validated attendance submission. |
| `POST` | `/api/attendance/checkout` | Authenticated checkout workflow. |
| `POST` | `/api/logs` | Authenticated legacy attendance-log write path. |
| `POST` | `/api/ingress/enqueue` | Enqueues an event and returns a provisional token; no auth middleware is attached in the current route. |
| `GET` | `/api/ingress/status/:jobId` | Reads in-memory ingress job status. |
| `GET` | `/api/ingress/metrics` | Reads in-memory ingress metrics. |
| `GET` | `/api/worker/:phone/summary` | Retrieves a materialized/fallback worker summary; no auth middleware is attached in the current route. |
| `GET` | `/api/archive/export` | Authenticated JSON archive export from the file-backed log path. |
| `POST` | `/api/sync/delta` | Accepts offline delta batches; no auth middleware is attached in the current route. |
| `POST` | `/api/attendance/action` | Authenticated employer/administrator acknowledgement or dispute action. |
| `POST` | `/api/dispatch` | Authenticated message/attendance/dispute parser and dispatch workflow. |
| `GET` | `/api/disputes` | Authenticated dispute listing. |
| `PATCH` | `/api/disputes/:id` | Administrator-only dispute status/assignment update. |
| `POST` | `/api/reset` | Administrator-only demonstration data reset. |

Request and response details should be treated as evolving. There is not yet a generated OpenAPI specification or a complete API contract test suite.

---

## Technology stack

| Area | Technologies |
| --- | --- |
| Frontend | React 18, TypeScript, Vite |
| Styling / UI | Tailwind CSS, Lucide React |
| Mapping | Leaflet |
| QR receipts | qrcode.react |
| Backend | Node.js, Express 5, TypeScript via tsx |
| Validation | Zod |
| Relational database | PostgreSQL, node-postgres (`pg`), Drizzle ORM / Drizzle Kit |
| Identity integration | Firebase client SDK and Firebase Admin SDK |
| Offline browser storage | IndexedDB, localStorage fallback |
| PWA | vite-plugin-pwa, Workbox service worker |
| Voice | Browser Web Speech API / SpeechSynthesis |
| Tests | Custom TypeScript test runner using `tsx` |

---

## Run locally

### Prerequisites

- Node.js (the project uses modern Node APIs; Node 20+ is a sensible baseline).
- npm.
- Optional PostgreSQL instance for the relational persistence path.
- Optional Firebase project/service-account configuration for Firebase-backed paths.

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

The Vite configuration sets port `3000`. Open:

```text
http://localhost:3000
```

### Run the test suite

```bash
npm test
```

### Type-check

```bash
npm run lint
```

Despite the script name, `lint` currently runs TypeScript's `tsc --noEmit`; it is not an ESLint rule suite.

### Build the frontend

```bash
npm run build
```

This runs the Vite production build. It does not by itself provision PostgreSQL, Firebase, production secrets, migrations or a deployment environment.

### PostgreSQL configuration

The database adapter checks for `SQL_HOST`. When it is present, it creates a PostgreSQL pool using:

```text
SQL_HOST
SQL_USER
SQL_PASSWORD
SQL_DB_NAME
```

When `SQL_HOST` is absent, the application uses its fallback persistence paths. Configure database schema/migrations before relying on a fresh PostgreSQL environment. Do not commit credentials or service-account files.

There is no committed `.env.example` in the current repository; deployment-specific Firebase configuration and secret handling should be documented and externalized before production deployment.

---

## Tests

The custom test suite is in `tests/app.test.ts`. It currently defines 12 logic-focused checks:

1. Attendance submission validation and E.164 phone format.
2. Role decision helper for administrator reset permissions.
3. Unique workday counting when multiple submissions share a date.
4. Wage totals, partial payments and outstanding balance calculations.
5. Rejection of invalid/non-positive dispute amounts.
6. Dispute conversation case ID generation and preservation of missing coordinates as null.
7. Atomic file mutation under concurrent operations.
8. Sliding-window rate limiter behaviour.
9. Check-in/check-out duration and wage calculation paths.
10. Ingress buffer enqueue behaviour and provisional token creation.
11. Worker summary materialization and retrieval.
12. Offline WAL record creation, digest generation and sync-state update.

These tests are useful coverage of selected service logic. They are not a substitute for end-to-end tests of the deployed application. In particular, the suite does not establish that Firebase authentication, production authorization, PostgreSQL transactions, all HTTP routes, browser offline recovery, or real device geolocation work correctly in a live deployment.

Run `npm test` to execute them in the current environment; this README does not claim a test pass result for every commit or deployment.

---

## Security, privacy and legal boundaries

This project handles data that can be sensitive in practice: phone numbers, work patterns, location coordinates, wage information and complaints. A real deployment would need a much stronger privacy and security review.

### Authentication and authorization

The repository contains Firebase ID-token verification and role middleware, plus a development/demo role-header path. The middleware also contains guest-worker fallback behaviour when a bearer token is absent or token verification fails. Consequently, the current code should not be assumed to enforce a strict production authentication boundary merely because a route uses `requireAuth`.

The development role header must never be relied on as an identity mechanism. Before production use, remove demo/guest fallbacks, derive roles from trusted server-side assignments, fail closed on invalid credentials and enforce authorization consistently on every data-bearing endpoint.

### Integrity and auditability

The schema includes audit-log records for selected PostgreSQL-backed actions. However:

- The file-backed fallback does not provide the same audit semantics.
- Not every write path is guaranteed to append an audit record.
- The current client-side SHA-256 WAL digest is not a trusted digital signature.
- A token hash is not proof of who created the record or whether the underlying facts are true.
- The in-memory ingress queue and idempotency cache are lost on process restart.

Do not describe the current implementation as tamper-proof, cryptographically signed evidence, immutable storage or a legally certified record system.

### Location and attendance

Coordinates may come from device geolocation or a manually selected preset. Device coordinates can be inaccurate or spoofed, and a point-in-time location does not prove hours worked. The application needs explicit consent, clear location indicators, retention rules and a secure verification process before real worker deployment.

### Legal status

The code and interface reference Indian labour and evidence legislation, including the Bharatiya Sakshya Adhiniyam, 2023, the BOCW framework and wage-related legislation. Those references are context for the product concept, not a legal certification or guarantee of admissibility.

A QR code, hash, generated case number, GPS point or employer acknowledgement inside this prototype does not by itself establish statutory compliance or court admissibility. Legal requirements vary by jurisdiction, worker category, date and facts. Obtain qualified legal review before making compliance claims or using this system for real disputes.

---

## Known limitations and engineering caveats

This section is intentionally direct. It distinguishes what the repository contains from what would still be required for a dependable production system.

### 1. Multiple persistence paths create consistency risk

The code can use PostgreSQL, JSON files, local browser storage, in-memory caches and Firebase/Firestore-related summary paths. Some routes fall back to files after database errors. A write may therefore be visible in one path but absent or stale in another.

**Why it matters:** wage totals, attendance status, disputes and audit history can diverge depending on which path handled a request.

**Next step:** choose one authoritative transactional database, migrate all writes/reads to repositories over that database, and make fallback behaviour explicit rather than silently switching stores.

### 2. Authentication currently has demo-oriented fallback behaviour

The auth middleware accepts role headers in non-production mode and can fall back to a guest worker when credentials are missing or Firebase verification fails. The frontend also sends role headers for its role-switching/demo experience.

**Why it matters:** this is convenient for a prototype but not a production identity model. A route-level role check is only as trustworthy as the identity/role assigned upstream.

**Next step:** separate demo mode from production builds, fail closed on missing/invalid tokens, remove arbitrary client-selected roles, and test every route with worker/employer/admin/unauthenticated identities.

### 3. Some routes are not protected by authentication middleware

In the current server code, the ingress enqueue, ingress status/metrics, worker summary and delta-sync routes are registered without `requireAuth`. The exact risk depends on deployment and data exposed, but these endpoints need deliberate access control, validation and abuse protection before public exposure.

**Next step:** define a route access matrix, authenticate or otherwise explicitly authorize each route, validate payloads, apply rate limits and prevent phone-number enumeration.

### 4. Offline queue is not a durable distributed messaging system

The ingress buffer, dead-letter queue, idempotency response cache and vector counter are process-local. The offline WAL digest may fall back to a timestamp/random identifier when Web Crypto is unavailable. The delta endpoint does not implement a full CRDT merge protocol.

**Why it matters:** process restarts, multiple server instances, replay, conflicting updates and partial sync can produce lost, duplicated or inconsistent records.

**Next step:** use durable server-side queue storage, database uniqueness constraints and transactional idempotency; define event IDs and conflict rules; make sync acknowledgements replay-safe; and test crash/retry scenarios.

### 5. Wage rules are prototype logic, not a statutory payroll engine

The code contains a default ₹600 amount and a half-day/overtime calculation in the parser path. That amount and those rules are not universally applicable. The code has multiple calculation paths and the UI includes fixed wage language.

**Next step:** make wage terms engagement-specific, version policy/rule configuration by jurisdiction and effective date, store calculation inputs, and obtain labour-law review. Add tests for boundaries, rounding, holidays, partial shifts and corrections.

### 6. Attendance verification is not equivalent to proof of work

The model has a `location_matched` state, but the presence of that state in the type/schema does not establish a complete geofence service. Manual presets and browser GPS are different sources of location data. A check-in alone cannot prove a complete shift.

**Next step:** label source and accuracy, implement and test a real worksite-boundary check if required, support supervisor evidence/reason codes, and keep worker-submitted, device-derived and supervisor-confirmed facts separate.

### 7. Audit coverage is incomplete

The PostgreSQL schema has an audit log table and selected handlers insert audit rows. However, the file fallback and every mutation path are not uniformly covered. The schema alone does not make records append-only; application and database permissions must enforce that property.

**Next step:** route all critical state changes through a transactional service that writes both the change and audit event atomically. Restrict update/delete privileges and add integrity verification.

### 8. No real WhatsApp, payroll or external dispute integration

The chat-like experience is a local simulator. There is no actual WhatsApp Business messaging provider, UPI/bank payout flow, labour-department API or NGO case referral integration in the repository.

**Next step:** add integrations only with provider credentials, consent, delivery/error handling, webhook signature validation and a documented data-sharing model.

### 9. Automated tests are not full integration tests

The 12 current tests exercise selected functions and service behaviours. They do not validate all routes against a real PostgreSQL/Firebase deployment, nor do they provide browser automation across mobile devices.

**Next step:** add route-level tests, database migration tests, authorization matrix tests, browser E2E tests, offline/reconnect tests and concurrency/crash recovery tests.

### 10. Product copy overstates legal certainty in places

Some UI text uses phrases such as “100% legal proof”, “guaranteed wage” or implies that a contractor cannot deny a claim. Those statements exceed what the underlying system can establish.

**Next step:** replace absolute legal claims with factual descriptions: what was submitted, when, from which source, what verification state it has, and who acknowledged or disputed it. This README uses that more conservative framing.

### 11. Demo data and fixed assumptions remain in the application

The code contains seeded demonstration identities/records, sample worksites and default wage assumptions. These are useful for a walkthrough but should be clearly isolated from real user data.

**Next step:** provide a dedicated demo seed command and environment, never mix demo records with production data, and make defaults configurable.

### 12. Deployment documentation is incomplete

The repository has a development command, a frontend build command and a start script, but it does not yet provide a complete production deployment guide covering database provisioning, migrations, Firebase secrets, TLS, backups, monitoring, worker retention and rollback.

**Next step:** add an environment template, migration workflow, deployment instructions, health-check strategy, backup/restore procedure and documented supported runtime versions.

---

## Roadmap

A sensible order of work is:

### Priority 0 — Make the prototype safe to evaluate

- Remove misleading legal-proof and guaranteed-wage wording.
- Clearly separate demo mode from real authentication.
- Protect every data-bearing API route.
- Document the source of truth for every record.
- Ensure no credentials or private worker data are committed.

### Priority 1 — Make records consistent

- Consolidate persistence around PostgreSQL.
- Add migrations and transactional write services.
- Make wage calculations use engagement-specific terms.
- Make audit events transactional and complete.
- Add tests for all attendance/dispute state transitions.

### Priority 2 — Make offline sync dependable

- Persist ingress jobs and idempotency keys.
- Define replay, duplicate and conflict-resolution semantics.
- Verify WAL payload integrity on the server.
- Add crash/restart and multi-instance sync tests.
- Expose provisional vs server-accepted vs supervisor-acknowledged status clearly.

### Priority 3 — Validate with real users and institutions

- Test with workers and supervisors in actual low-connectivity environments.
- Conduct accessibility and language review with native speakers.
- Review location consent, data minimization and retention.
- Obtain legal review of wage rules, record formats and statutory references.
- Integrate external messaging or referral services only when there is a real operational partner.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
