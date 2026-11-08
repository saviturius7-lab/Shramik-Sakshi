# Shramik Sakshi: Civic Field Ledger & Resilient Offline Sync

A comprehensive architectural and aesthetic evolution transforming Shramik Sakshi from a whimsical dollhouse aesthetic into an authentic, dignified **Tactile Civic Field Ledger** (analog risograph paper, embossed telegraph hardware, official rubber stamps, and archival muster rolls) combined with an **Automated Background IndexedDB Synchronization Engine** and live visual connectivity status ribbon.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The user confirmed the following two core directions during Phase 1 clarification:
> - **Primary Aesthetic Transformation**: Transform visual aesthetic from a fairytale dollhouse into a **Tactile Civic Field Ledger** rooted in the dignity of informal labor documentation, physical carbon slips, and official muster registers.
> - **Offline Resilience Strategy**: Implement **Automatic Background Sync** via IndexedDB and browser connectivity event listeners, accompanied by an explicit, accessible visual status banner.

- **Confirmed Decision 1**: Replace the pink storybook cottage, scalloped roof trims, and dollhouse room cards with archival government ledger styling, physical telegraph brass plates, and crisp rubber stamp impressions.
- **Confirmed Decision 2**: Upgrade client storage with a reactive offline sync worker that intercepts disconnections, buffers punches in IndexedDB, and automatically flushes and confirms them upon network recovery.
- **Open Decision / Recommended Default**: Audio and haptic feedback on punch and sync completion. (Recommended: gentle mechanical telegraph relay click for punches and soft bell chime on sync completion, with an instant mute toggle for noise-sensitive environments).

---

## 1. Overview & Core Concept

### What It Does
Shramik Sakshi provides informal workers and worksite supervisors with a dignified, tamper-resistant digital muster roll. This evolution establishes:
1. **Institutional & Civic Dignity**: Replaces playful dollhouse imagery with an authentic civic record-keeping visual language inspired by historical labor registries, government gazettes, and rugged field instruments.
2. **True Offline-First Reliability**: Construction sites, transit hubs, and rural brick kilns frequently suffer from zero or intermittent cellular coverage. Workers can record attendance slips and wage records offline; the system buffers entries locally in IndexedDB with cryptographic UUIDs and syncs them automatically to Cloud SQL the instant signal returns.

### Target Audience & Persona
- **Daily Wage Laborers & Masons**: Need zero-friction, high-contrast, visually unmistakable feedback indicating whether their day's wage has been recorded locally or confirmed by the central registry.
- **Site Supervisors & Contractors**: Need rapid batch muster confirmation on rugged tablets at site gates without waiting on slow 2G/3G roundtrips.
- **Labor Welfare Conciliation Officers & Legal Aid Advocates**: Require an audit dossier that looks like an authentic, verifiable administrative ledger rather than a toy.

---

## 2. User Experience & Visual Design

### Visual Identity & Theme: The Civic Field Ledger
- **Aesthetic Direction**: Analog Civic Record / Field Telegraph Station. Evokes mid-century public infrastructure, risograph printing, linen ledger paper, and brass teletype instruments.
- **Color Palette & Tone Budget**:
  - `60% Canvas`: Archival Field Paper (`#f8f6f0`), limestone ledger ground (`#f2ede4`), and warm grid ruling lines (`rgba(44, 53, 48, 0.06)`).
  - `30% Structural Elements`: Deep iron gall ink borders (`#1e2522`), vintage teletype patinated slate (`#264e58`), and aged Manila passbook cards (`#ede5d4`).
  - `10% Accent High-Intent Budget`: Official Rubber Stamp Crimson (`#b32638`), Supervisory Verification Emerald (`#1e724c`), and Warning Amber (`#c97a1a`).
- **Typography & Tabular Discipline**:
  - *Display / Section Headings*: Structural architectural sans (`Plus Jakarta Sans`, font-extrabold with tight letter-spacing).
  - *Body Prose & Instruction*: High-legibility book sans (`Plus Jakarta Sans`, 15px, 1.55 line height).
  - *Financial & Slip Data*: Strict tabular monospace (`font-mono tabular-nums`) with zero character jitter across balance recalculations.
- **Tactile Material Components**:
  - *Physical Muster Register Table*: Styled as an open hardbound ledger ledger with sewn spine ruling, serial number stamps, and hand-inked line dividers.
  - *Official Rubber Stamps*: Hand-pressed verification seals (`LOCATION SUBMITTED`, `SUPERVISOR ACKNOWLEDGED`, `UNDER FORMAL REVIEW`) angled with realistic -1.5deg ink bleed and dashed borders.
  - *Teletype Brass Station*: Dark forest green and brushed brass finish with tactile mechanical toggles for worker telephone and location inputs.

### Live Connectivity & Offline Sync UX Flow
1. **Normal Connected State**:
   - A quiet top utility ribbon displays: `● Central Register Online · Cloud SQL Connected`.
2. **Network Disconnection Event**:
   - The ribbon transitions dynamically to warm amber: `⚡ Offline Mode · Submissions Buffered Locally (IndexedDB)`.
   - Worker punches attendance: button immediately emits a crisp punch receipt stamped `SAVED OFFLINE (PENDING SERVER SYNC)`.
3. **Automatic Network Reconnection**:
   - When the browser fires `online`, the background sync engine drains the IndexedDB queue in chronological sequence.
   - Ribbon pulses blue: `↻ Syncing 3 offline slips with central ledger...`.
   - On completion, transforms to a celebration banner: `✓ 3 Attendance slips synchronized and verified by server`.
   - The receipt badge updates live from `Pending Sync` to `Location Submitted`.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Visual Theme Migration from Dollhouse to Civic Ledger
- **Chosen Approach**: Replace the pink cottage sky, scalloped roof shingles, and bedroom/bathroom cards with an archival field ledger with risograph grid paper, brass telegraph station panels, and rubber stamps.
- **Why**: Eliminates tonal dissonance with the solemn reality of informal labor rights while preserving pre-internet tactile warmth and accessibility.
- **Alternatives Considered**: 
  - *Standard Flat SaaS (Tailwind/Shadcn)*: Rejected because clinical corporate dashboards feel sterile and alien to daily wage laborers.
  - *Retaining Dollhouse Pink*: Rejected due to user feedback and risk of trivializing serious wage theft issues.

### Decision 2: IndexedDB Queue + Reactive Online/Offline Event Listener
- **Chosen Approach**: Combine an IndexedDB queue with reactive `window.addEventListener('online')` and a fallback periodic background heartbeat (every 15s).
- **Why**: Works reliably inside browser environments without requiring complex background-sync service worker registration that may fail in strict iframe sandboxes.
- **Alternatives Considered**: 
  - *Manual Sync Button Only*: Rejected because low-literacy workers will forget to click manual sync buttons, resulting in lost records when browser storage clears.

### Decision 3: Idempotent UUID Submission Keys
- **Chosen Approach**: Every offline punch generates a permanent UUID and verification token *before* writing to IndexedDB.
- **Why**: Prevents duplicate entries if a network glitch causes the client to replay requests upon reconnecting. The backend uses `ON CONFLICT (id) DO NOTHING`.

---

## 4. Technical Architecture & Data Strategy

### System Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER (React 18 SPA)                       │
│                                                                             │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌───────────────┐  │
│  │ Field Telegraph Station│  │  Daily Muster Register │  │ Sync Ribbon   │  │
│  │ (Teletype Brass Panel) │  │  (Risograph Ledger)    │  │ (Live Status) │  │
│  └───────────┬────────────┘  └───────────┬────────────┘  └───────┬───────┘  │
│              │                           │                       │          │
│              ▼                           ▼                       ▼          │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Reactive Network Monitor & Offline Queue Manager                      │  │
│  │  - window.addEventListener('online' / 'offline')                      │  │
│  │  - Persistent IndexedDB Object Store: 'pending_sync_queue'            │  │
│  │  - Automatic Sequential Queue Flusher with Exponential Backoff        │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │ HTTPS (Bearer Auth + Idempotent UUID)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                        BACKEND LAYER (Express 5 Server)                     │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Authentication & RBAC Middleware (/src/middleware/auth.ts)            │  │
│  │  - Roles: worker, employer, administrator                             │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│  ┌───────────────────────────────────▼───────────────────────────────────┐  │
│  │ REST Dispatch API & Idempotency Check (/api/dispatch)                 │  │
│  │  - Rejects duplicates via UUID primary key collision check            │  │
│  │  - Evaluates deterministic DFSA rules (/src/services/preAiBot.ts)     │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │ Drizzle ORM (pg Pool)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                     DATABASE LAYER (Cloud SQL PostgreSQL)                   │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  - attendance_records (id: UUID, status: location_submitted, etc.)   │  │
│  │  - wage_records       (earned, paid, outstanding)                     │  │
│  │  - audit_logs         (append-only: who, when, previous/new state)    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### State Lifecycle of an Attendance Submission

```
[ Worker Taps Submit ]
        │
        ├── Network Online? ──► YES ──► POST /api/dispatch ──► [ Server Confirmed ]
        │                                                              │
        └── NO (Offline)                                               ▼
                │                                             [ Cloud SQL Stored ]
                ▼                                                      │
     [ Store in IndexedDB ]                                            ▼
     (status: pending_sync)                                   [ Append Audit Log ]
                │
     [ Network Reconnected ]
                │
     [ Auto-Flush Worker ] ──► POST /api/dispatch ──► [ Update UI Receipt ]
```

---

## 5. Verification Plan

1. **Automated Test Suite**:
   - Run `npm test` to verify all 6 existing integrity and accounting tests pass.
   - Add unit tests for the offline queue manager verifying FIFO drainage and idempotency handling.
2. **Offline Mode Functional Simulation**:
   - Disconnect network in browser dev tools / simulate offline state.
   - Punch 2 attendance slips: verify storage in IndexedDB and amber offline ribbon.
   - Restore network: verify auto-sync triggers without user intervention, flushes the queue, and turns ribbon green.
3. **Visual & Design Inspection**:
   - Verify complete elimination of dollhouse pink clouds, cottage drawings, and bedroom tags.
   - Confirm risograph field paper, brass telegraph panels, and crisp rubber stamps render with WCAG AA contrast.
4. **Build & Lint Co-Execution**:
   - Execute `compile_applet` and `lint_applet` concurrently.
   - Restart dev server and verify `/api/status`.
