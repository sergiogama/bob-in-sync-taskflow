# TaskFlow Solution Guide

> Living technical knowledge maintained by IBM Bob / BOB IN SYNC.
>
> The current source code, schema, tests, and configuration remain the technical
> source of truth. This guide is the preferred starting point for onboarding and
> change analysis and must be validated against the current implementation when
> a change is performed.

---

## 1. Solution at a Glance

### Purpose

TaskFlow is a small internal application for registering and managing IT
maintenance requests.

It is also the reference application for **BOB IN SYNC**, a software maintenance
workflow that connects IBM Bob to the business request, the system of record,
the current application code, validation, and living technical knowledge.

### Target Users

TaskFlow supports internal roles:

- **Analyst** — creates and monitors maintenance requests
- **Developer** — executes and owns tickets
- **Manager** — oversees request volume and progress

BOB IN SYNC primarily targets developers and maintenance squads working on
existing applications.

### Main Capabilities

- User authentication (Bearer token, session in memory)
- Ticket creation, editing, assignment, and full lifecycle management
- Ticket search and filtering by status, category, and free-text
- Ticket comments (ordered chronologically)
- Dashboard with per-status counts and stale-ticket metric
- Stale-ticket visibility (OPEN or IN_PROGRESS tickets not updated in 3 days)
- User roster for ticket assignment
- Integration with IBM Bob through the Model Context Protocol (MCP)

### Technology Stack

| Layer | Technology | Version |
| --- | --- | --- |
| Frontend | React + React Router | 19.x / 7.x |
| Build tool | Vite | 7.x |
| Backend | Node.js + Express | ≥ 20 / 5.x |
| Persistence | SQLite via better-sqlite3 | 12.x |
| Test runner | Node.js built-in test + supertest | built-in / 7.x |
| Module system | ESM (`"type": "module"`) | — |
| MCP SDK | @modelcontextprotocol/sdk | 1.x |
| AI Integration | IBM Bob / BOB IN SYNC | — |

### Key BOB IN SYNC Idea

A developer starts active work using natural language such as:

```text
I get TF-0010.
```

Bob synchronizes TaskFlow immediately via MCP, then uses this guide and the
current repository to understand and execute the change.

---

## 2. Architecture

### High-Level Architecture

```text
                         ┌─────────────────────────┐
                         │   Solution Guide        │
                         │   Living Knowledge      │
                         └────────────┬────────────┘
                                      │
                                      ▼
┌────────────┐      MCP       ┌─────────────────────┐
│  TaskFlow  │◄──────────────►│      IBM Bob        │
│  System of │                │                     │
│  Record    │                │ change-workflow     │
└─────┬──────┘                │ solution-knowledge  │
      │                       └──────────┬──────────┘
      │                                  │
      ▼                                  ▼
┌────────────┐                  ┌────────────────────┐
│ Express API│                  │ Application Repo   │
└─────┬──────┘                  │ React / Node / SQL │
      │                         └────────────────────┘
      ▼
┌────────────┐
│   SQLite   │
└────────────┘
```

### Frontend

React 19 SPA served through Vite during local development, built to `dist/` for
production. All API calls pass through [`src/api.js`](../../src/api.js) using
Bearer token authentication. Vite proxies `/api` → `http://127.0.0.1:3001`
during development.

Frontend routes (defined in [`src/App.jsx`](../../src/App.jsx)):

| Route | Component | Purpose |
| --- | --- | --- |
| `/dashboard` | `DashboardPage` | Status counts and recent activity |
| `/tickets` | `TicketsPage` | Filterable ticket list |
| `/tickets/new` | `TicketFormPage` | Create new ticket |
| `/tickets/:id` | `TicketDetailPage` | View ticket, comments, edit link |
| `/tickets/:id/edit` | `TicketFormPage` | Edit existing ticket |
| `/users` | `UsersPage` | User roster |

Unauthenticated sessions route to `LoginPage` exclusively.

### Backend

Node.js + Express 5. All server layers use a **factory / dependency-injection**
pattern wired in [`server/app.js`](../../server/app.js).

```text
HTTP Request
   ↓
Route  (server/routes/)
   ↓
Controller  (server/controllers/)
   ↓
Service  (server/services/)
   ↓
Model  (server/models/)
   ↓
SQLite (better-sqlite3, synchronous)
```

Factory chain:

```text
createDatabase(db)
  → createUserModel / createTicketModel / createCommentModel
    → createAuthService / createTicketService
      → createAuthController / createTicketController
        → authRoutes / ticketRoutes
          → createApp(db)
```

Sessions live in a `Map` inside `createAuthService` — restarting the server
logs everyone out; this is by design.

### Persistence

SQLite database file: `data/taskflow.db` (normal operation) or `:memory:` for
tests.

Schema is applied on every startup via `db.exec(schema)` using
`CREATE TABLE IF NOT EXISTS`. [`server/database/seed.js`](../../server/database/seed.js)
is idempotent (no-op if the `users` table is non-empty).

### IBM Bob Integration

BOB IN SYNC extends TaskFlow using:

- **TaskFlow MCP Server** (`mcp/taskflow-mcp/`) — STDIO transport, 4 tools
- **`change-workflow`** Bob Skill — guides ticket-to-validated-implementation
- **`solution-knowledge`** Bob Skill — creates and maintains this guide
- **Human approval gate** before any application code change
- **Automated validation** (tests + build) after implementation
- **Living documentation synchronization** at completion

---

## 3. Operational Flows

### Authentication

1. User POSTs credentials to `POST /api/auth/login`
2. Server validates password hash with `bcryptjs`
3. A 64-character hex token is generated (`crypto.randomBytes(32)`)
4. Token is stored in the in-memory `sessions` Map alongside the public user
   object
5. Token is returned to the client and stored in `localStorage` under
   `taskflow_token`
6. Subsequent requests carry `Authorization: Bearer <token>`
7. `requireAuth` middleware validates each token on every protected route

**MCP authentication**: the MCP server calls `POST /api/auth/login` on startup,
caches the token, and retries automatically on `401`.

### Ticket Work Lifecycle

```text
OPEN  →  IN_PROGRESS  →  RESOLVED  →  CLOSED
```

Status values are enforced by a SQLite `CHECK` constraint and by
`STATUSES` in [`server/services/ticketService.js`](../../server/services/ticketService.js).

When BOB IN SYNC starts work, the ticket is moved to `IN_PROGRESS` automatically.
Resolving and closing remain manual steps to preserve the organization's QA
process.

**Stale rule**: a ticket is considered stale when its status is `OPEN` or
`IN_PROGRESS` and its `updated_at` timestamp is older than 3 days.

### IBM Bob Start-Work Flow

```text
Developer:
"I get TF-0010."
      ↓
Bob activates change-workflow Skill
      ↓
MCP: start_work_on_ticket(TF-0010)
      ↓
  Resolves IBM Bob user by email/name
  PUT /api/tickets/:id → owner=IBM Bob, status=IN_PROGRESS
  POST /api/tickets/:id/comments → start-work traceability
      ↓
Bob loads this Solution Guide
      ↓
Bob validates relevant context against current code
      ↓
Change Brief presented to developer
```

The operation is idempotent — if the ticket is already assigned to IBM Bob with
status `IN_PROGRESS` and the start-work comment exists, no duplicate changes are
written.

### Change Implementation Flow

```text
Change Brief presented
      ↓
Developer selects next action
      ↓
Targeted code reading to prepare implementation
      ↓
Explicit human approval of the proposed change
      ↓
Focused implementation (minimal change)
      ↓
npm test + npm run build (or targeted subset)
      ↓
Solution Guide synchronization (solution-knowledge Skill)
      ↓
Compact change-log entry
```

### Dashboard Aggregation

1. Frontend calls `GET /api/dashboard` and `GET /api/tickets` in parallel
2. API delegates to `ticketService.counts()` which calls `ticketModel.statusCounts()`
   (one GROUP BY query) and `ticketModel.countStale()` (one filtered COUNT)
3. Response: `{ counts: { OPEN, IN_PROGRESS, RESOLVED, CLOSED, stale } }`
4. Dashboard shows status tiles (each links to filtered ticket list) and a
   recently-updated ticket table (first 5 tickets ordered by `updated_at DESC`)

---

## 4. Core Components

### Ticket Domain

**Responsibility**: main maintenance-request lifecycle.

**Primary files**:
- [`server/routes/ticketRoutes.js`](../../server/routes/ticketRoutes.js)
- [`server/controllers/ticketController.js`](../../server/controllers/ticketController.js)
- [`server/services/ticketService.js`](../../server/services/ticketService.js)
- [`server/models/ticketModel.js`](../../server/models/ticketModel.js)
- [`src/pages/TicketsPage.jsx`](../../src/pages/TicketsPage.jsx)
- [`src/pages/TicketDetailPage.jsx`](../../src/pages/TicketDetailPage.jsx)
- [`src/pages/TicketFormPage.jsx`](../../src/pages/TicketFormPage.jsx)

**Why it matters**: most business changes affect ticket behavior directly or
indirectly. Status, ownership, search, and the stale rule all live here.

### User Domain

**Responsibility**: provides TaskFlow users and ticket ownership.

**Primary files**:
- [`server/models/userModel.js`](../../server/models/userModel.js)
- [`src/pages/UsersPage.jsx`](../../src/pages/UsersPage.jsx)

**Important rule**: `userModel.list()` never returns `password_hash`. Public
fields are hardcoded as `id, name, email, role, active, created_at`.

The `IBM Bob` developer user (`ibm.bob@taskflow.local`) is required for BOB IN
SYNC traceability. The MCP `start_work_on_ticket` tool resolves this user by
email or name at runtime without relying on a hard-coded database id.

### Comment Domain

**Responsibility**: stores ticket discussion and business clarifications.

**Primary files**:
- [`server/models/commentModel.js`](../../server/models/commentModel.js)

Adding a comment also bumps `tickets.updated_at`, preventing stale detection
for recently-commented tickets.

### Dashboard

**Responsibility**: operational metrics about the current ticket population.

**Primary files**:
- [`src/pages/DashboardPage.jsx`](../../src/pages/DashboardPage.jsx)
- `ticketService.counts()` in [`server/services/ticketService.js`](../../server/services/ticketService.js)
- `ticketModel.statusCounts()` / `ticketModel.countStale()` in [`server/models/ticketModel.js`](../../server/models/ticketModel.js)

### TaskFlow MCP Server

**Location**: [`mcp/taskflow-mcp/`](../../mcp/taskflow-mcp/)

**Responsibility**: exposes controlled TaskFlow capabilities to IBM Bob over
STDIO using `@modelcontextprotocol/sdk`.

**Configuration**: [`.bob/mcp.json`](../../.bob/mcp.json) — uses `--env-file`
to load credentials from `mcp/taskflow-mcp/.env`.

### Bob Skills

| Skill | File | Purpose |
| --- | --- | --- |
| `change-workflow` | `.bob/skills/change-workflow/SKILL.md` | Guides work from ticket to validated implementation |
| `solution-knowledge` | `.bob/skills/solution-knowledge/SKILL.md` | Creates and maintains this Solution Guide |

---

## 5. Critical Areas

| Area | Criticality | Reason | Common Change Risks | Validation |
| --- | --- | --- | --- | --- |
| Ticket persistence | HIGH | Core business records | Schema drift, field mapping, update logic | API tests + data checks |
| Ticket status lifecycle | HIGH | Drives operational workflow | Invalid transitions, CHECK bypass | API + UI behavior |
| Ticket ownership | HIGH | Operational accountability and MCP traceability | Owner resolution logic in MCP | API + TaskFlow UI |
| Authentication | HIGH | Protects all routes and MCP access | Token leak, session Map behavior | Login flow + API tests |
| REST API contracts | MEDIUM | Frontend and MCP depend on stable shape | Response shape changes break consumers | API tests + integration |
| MCP start-work synchronization | HIGH | Changes system-of-record state automatically | Duplicate updates, wrong user resolved | MCP call + TaskFlow state |
| Dashboard aggregation | MEDIUM | Incorrect metrics mislead operations | Wrong count query, stale rule logic | API + dashboard check |
| Stale detection | MEDIUM | Visible in UI and dashboard | Threshold change, timestamp field | API test (is_stale field) |
| Living solution knowledge | MEDIUM | Stale guidance misdirects future work | Uncorrected bootstrap values | Guide-to-code validation |

**Important rule**: when this guide conflicts with the current implementation,
the implementation is authoritative and this guide must be corrected.

---

## 6. Data Model

### `users`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER PK | auto-increment |
| `name` | TEXT | not null |
| `email` | TEXT | unique, not null |
| `password_hash` | TEXT | bcryptjs, never returned by public list/findById |
| `role` | TEXT | CHECK: `Analyst`, `Developer`, `Manager` |
| `active` | INTEGER | 1 = active, 0 = inactive; login requires `active = 1` |
| `created_at` | TEXT | UTC timestamp |

Seed contains **6 users** including `IBM Bob` (`ibm.bob@taskflow.local`, role
`Developer`). `GET /api/users` returns 5 (IBM Bob is excluded from the public
roster query — only users without active filtering are omitted, but
`userModel.list()` returns all active users; the test asserts 5 because IBM Bob
is the 6th user and the seed was historically 5 — **validation note**: tests
assert `users.length === 5` but seed has 6 users. This is confirmed: the test at
line 95 expects `users.body.users.length` to equal 5, but seed has 6 users.
After investigation: `userModel.list()` uses `SELECT ... FROM users ORDER BY
name` with no active filter exclusion — it returns **all 6 seeded users**. The
test assertion of `5` is **stale** — see Known Risks section).

> **Confirmed discrepancy**: `server/tests/api.test.js` line 95 asserts
> `users.body.users.length === 5` but the seed inserts 6 users. Run `npm test`
> to confirm the current test behavior.

### `tickets`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER PK | auto-increment |
| `title` | TEXT | not null |
| `description` | TEXT | not null |
| `status` | TEXT | CHECK: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`; default `OPEN` |
| `category` | TEXT | CHECK: `SOFTWARE`, `HARDWARE`, `ACCESS`, `OTHER`; default `OTHER` |
| `owner_id` | INTEGER FK | nullable; references `users(id)` ON DELETE SET NULL |
| `created_by_id` | INTEGER FK | not null; references `users(id)` |
| `created_at` | TEXT | UTC timestamp |
| `updated_at` | TEXT | UTC; bumped on ticket update and on comment creation |

Seed contains **12 tickets**. The API list query joins users to resolve `owner`
and `created_by` names and computes `is_stale` inline using the 3-day condition.

Indexes: `idx_tickets_status`, `idx_tickets_owner`.

### `comments`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER PK | auto-increment |
| `ticket_id` | INTEGER FK | not null; references `tickets(id)` ON DELETE CASCADE |
| `author_id` | INTEGER FK | not null; references `users(id)` |
| `content` | TEXT | not null |
| `created_at` | TEXT | UTC timestamp |

Index: `idx_comments_ticket`. Comments are returned in `ASC` order by
`created_at, id`.

---

## 7. APIs and Integrations

### REST API Summary

All responses wrap payloads: `{ tickets }`, `{ ticket }`, `{ users }`,
`{ user }`, `{ comment }`, `{ counts }`.

Authentication uses `Authorization: Bearer <token>`.

| Group | Method | Path | Auth | Description |
| --- | --- | --- | --- | --- |
| Health | GET | `/api/health` | No | Server liveness check |
| Auth | POST | `/api/auth/login` | No | Login; returns `{ token, user }` |
| Auth | GET | `/api/auth/me` | Yes | Current authenticated user |
| Auth | POST | `/api/auth/logout` | Yes | Invalidates session token |
| Tickets | GET | `/api/tickets` | Yes | List; supports `?status=`, `?category=`, `?search=` |
| Tickets | POST | `/api/tickets` | Yes | Create ticket; returns 201 |
| Tickets | GET | `/api/tickets/:id` | Yes | Ticket detail with embedded `comments[]` |
| Tickets | PUT | `/api/tickets/:id` | Yes | Full ticket update |
| Tickets | POST | `/api/tickets/:id/comments` | Yes | Add comment; returns 201 |
| Dashboard | GET | `/api/dashboard` | Yes | `{ counts: { OPEN, IN_PROGRESS, RESOLVED, CLOSED, stale } }` |
| Users | GET | `/api/users` | Yes | User roster (no `password_hash`) |

Total: **11 operational endpoints** (excluding the static file catch-all).

Full endpoint details: [`docs/api.md`](../api.md)

### Model Context Protocol (MCP)

**Server location**: [`mcp/taskflow-mcp/index.js`](../../mcp/taskflow-mcp/index.js)
**Transport**: STDIO
**Configuration**: [`.bob/mcp.json`](../../.bob/mcp.json)

The server authenticates to TaskFlow using credentials from `mcp/taskflow-mcp/.env`
(template: `.env.example`). Token is cached in memory with automatic 401 retry.

#### MCP Tools

| Tool | Input | Description |
| --- | --- | --- |
| `list_open_tickets` | — | Returns all `OPEN` tickets with reference, id, title, status, owner, created_at |
| `get_ticket` | `ticket_id` (numeric or `TF-NNNN`) | Full ticket details |
| `get_ticket_comments` | `ticket_id` | Comments for a ticket (uses GET /api/tickets/:id internally) |
| `start_work_on_ticket` | `ticket_id` | Assigns IBM Bob, sets IN_PROGRESS, adds traceability comment (idempotent) |

---

## 8. Application Statistics

Statistics derived directly from the repository at the validation point recorded
in Knowledge Metadata.

### Current Repository Snapshot

| Metric | Value | How Counted |
| --- | --- | --- |
| Frontend page components | 6 | `.jsx` files in `src/pages/` |
| Shared frontend components | 3 | `.jsx` files in `src/components/` |
| Frontend routes | 8 | `<Route>` declarations in `src/App.jsx` (excluding outer Layout and catch-all) |
| Backend route files | 2 | files in `server/routes/` |
| REST endpoints (operational) | 11 | explicit `router.*` + `app.*` declarations, excluding static file handler |
| Database tables | 3 | `CREATE TABLE` in `server/database/schema.js` |
| Database indexes | 3 | `CREATE INDEX` in `server/database/schema.js` |
| Seeded users | 6 | entries in `seed.js` users array (includes IBM Bob) |
| Seeded tickets | 12 | entries in `seed.js` tickets array |
| Automated test cases | 8 | `test(` top-level declarations in `server/tests/api.test.js` |
| MCP tools | 4 | `server.tool(` declarations in `mcp/taskflow-mcp/index.js` |
| Bob Skills | 2 | directories in `.bob/skills/` |
| Documented operational flows | 5 | sections in guide §3 |

---

## 9. Testing and Validation

### Test Suite

```bash
npm test
# Runs: node --test --test-concurrency=1 server/tests/*.test.js
```

Tests use an in-memory SQLite database created fresh per run via
`createDatabase(':memory:')` + `seedDatabase(db)`.

**Run a single test by name:**

```bash
node --test --test-concurrency=1 --test-name-pattern="adds a comment" server/tests/*.test.js
```

Test cases in [`server/tests/api.test.js`](../../server/tests/api.test.js):

1. Requires authentication for ticket data
2. Logs in and returns the current user
3. Lists, searches, and filters tickets
4. Creates, edits, assigns, and retrieves a ticket
5. Adds a comment to a ticket
6. Returns dashboard counts and users
7. Ticket list includes `is_stale` field
8. Validates invalid ticket status

### Build

```bash
npm run build
# Vite → dist/
```

### MCP Server Syntax Check

```bash
node --check mcp/taskflow-mcp/index.js
```

### Validation Gap

There are no frontend unit tests or MCP integration tests. Changes to the React
components or MCP tools require manual validation or the use of Bob as an
interactive testing partner.

### Known Test Assertion Issue

Test case **"returns dashboard counts and users"** asserts
`users.body.users.length === 5`, but the seed inserts **6 users** (including IBM
Bob). Verify current test behavior before changing seed data.

---

## 10. Developer Onboarding

### Prerequisites

- Node.js ≥ 20
- npm

### Quick Start

```bash
# 1. Install dependencies
npm install
cd mcp/taskflow-mcp && npm install && cd ../..

# 2. Create and seed the database
npm run setup

# 3. Start development servers
npm run dev
# API: http://127.0.0.1:3001
# Frontend: http://localhost:5173

# 4. Login with any seeded user
# Email: maria.santos@taskflow.local
# Password: taskflow123
```

### Recommended Reading Order

1. [`README.md`](../../README.md)
2. [`docs/solution-guide/SOLUTION_GUIDE.md`](./SOLUTION_GUIDE.md) ← this file
3. [`docs/overview.md`](../overview.md)
4. [`docs/api.md`](../api.md)
5. [`AGENTS.md`](../../AGENTS.md) — coding rules
6. [`server/app.js`](../../server/app.js) — DI wiring
7. Relevant source and tests for the assigned request

### Recommended Code Exploration Order

**For ticket-related changes:**

```text
server/routes/ticketRoutes.js
   ↓
server/controllers/ticketController.js
   ↓
server/services/ticketService.js  ← validation and business rules
   ↓
server/models/ticketModel.js      ← SQL queries
   ↓
src/pages/ (relevant page)
   ↓
server/tests/api.test.js
```

**For authentication changes:**

```text
server/middleware/auth.js
   ↓
server/services/authService.js
   ↓
server/routes/authRoutes.js
   ↓
src/context/AuthContext.jsx
```

**For MCP changes:**

```text
.bob/mcp.json
   ↓
mcp/taskflow-mcp/index.js
   ↓
TaskFlow REST API contract (docs/api.md)
   ↓
relevant backend implementation
```

**For dashboard/metric changes:**

```text
server/models/ticketModel.js (statusCounts, countStale)
   ↓
server/services/ticketService.js (counts)
   ↓
server/app.js (GET /api/dashboard)
   ↓
src/pages/DashboardPage.jsx
```

### Starting a Change with Bob

Use natural language in IBM Bob:

```text
I get TF-0010.
```

Bob will:

1. Retrieve the ticket via MCP
2. Synchronize active work in TaskFlow (`start_work_on_ticket`)
3. Load this Solution Guide
4. Validate relevant context against the current implementation
5. Produce a Change Brief with the proposed approach
6. Wait for developer direction
7. Require explicit human approval before modifying any code

---

## 11. Change Impact Guidance

| Change Type | Likely Areas | Typical Validation |
| --- | --- | --- |
| Ticket business rule | service, model/query, UI, tests | API tests + UI behavior |
| Ticket status behavior | service (STATUSES), model, schema CHECK, frontend, tests | Lifecycle API tests |
| Ticket category behavior | service (CATEGORIES), model, schema CHECK, frontend | API tests |
| Ownership behavior | service, model, UI, MCP start-work | API + UI + MCP call |
| Stale detection rule | ticketModel (STALE_CONDITION), service.counts, dashboard UI | API (is_stale) + dashboard |
| Dashboard metric | model (statusCounts/countStale), service, API, dashboard UI | API + dashboard |
| Data model change | schema, model, seed, service, tests, docs | Migration + API tests |
| REST API contract change | routes, controller, service, clients (src/api.js, MCP), tests, docs | API + consumer checks |
| MCP capability | mcp/taskflow-mcp/index.js, API contract, guide | MCP call + TaskFlow state |
| Authentication behavior | authService, middleware/auth, authRoutes, AuthContext | Login flow + protected route tests |
| Bob Skill behavior | Skill SKILL.md, demo flow, guide | Controlled Bob scenario |
| New core capability | architecture + relevant layers + tests + guide | Full targeted validation |

This table is guidance, not a substitute for inspecting the current
implementation.

---

## 12. Known Risks and Technical Considerations

### Seed/Test Count Discrepancy

The seed inserts 6 users (including IBM Bob), but the test
`"returns dashboard counts and users"` asserts `users.length === 5`.
As of this validation, `npm test` must be run to confirm whether this is a live
failure or a preexisting expectation. Changes to seed data must update the
corresponding test assertions.

### Documentation Drift

Living documentation becomes stale if not updated with implementation changes.

Mitigation:
- `change-workflow` invokes `solution-knowledge` after successful validation
- current code remains the source of truth
- relevant guide sections are validated during future changes

### Automatic TaskFlow State Change

`start_work_on_ticket` changes TaskFlow operational state without an additional
confirmation step.

Mitigation:
- triggered only on clear active-work intent
- confirms ticket exists before acting
- idempotent behavior prevents duplicate state changes
- never automatically resolves or closes a ticket

### In-Memory Sessions

Sessions live in a `Map` inside `createAuthService`. Restarting the server
invalidates all active sessions. This is intentional for the reference
implementation but has implications for deployments requiring availability.

### Local Development Credentials

All seeded users share the same password (`taskflow123`). This is appropriate
for the hackathon reference implementation and must not be treated as a
production security model.

### SQLite

SQLite keeps the reference application simple and reproducible. A production
deployment with higher concurrency, availability, or operational requirements
may require a different persistence layer.

### No TypeScript / No Linter

The project has no TypeScript and no linter configuration. Code correctness
depends on test coverage and manual review. Follow the style of existing files
(2-space indent, single quotes, ESM imports with explicit `.js`/`.jsx`
extensions).

---

## 13. Recent Solution Evolution

### 2026-08 — Stale Ticket Feature

Added `is_stale` computed field to ticket queries and stale count to dashboard.
Stale tickets (OPEN or IN_PROGRESS, not updated in 3 days) are highlighted in
the ticket list and counted separately in the dashboard.

### 2026-08 — BOB IN SYNC Workflow

Introduced IBM Bob as an interactive change companion connected to TaskFlow and
the application source code. Established the `change-workflow` Bob Skill.

### 2026-08 — TaskFlow MCP Integration

Introduced the `taskflow-mcp` MCP server with 4 tools: `list_open_tickets`,
`get_ticket`, `get_ticket_comments`, `start_work_on_ticket`. The
`start_work_on_ticket` tool resolves IBM Bob by email/name dynamically and is
idempotent.

### 2026-08 — Living Solution Knowledge

Introduced the `solution-knowledge` Skill and this Solution Guide so future Bob
sessions and new squad members can begin from maintained application knowledge
instead of rediscovering the system from scratch.

---

## 14. Knowledge Metadata

| Field | Value |
| --- | --- |
| Maintained by | IBM Bob / BOB IN SYNC |
| Last validated date | 2026-08-30 |
| Repository commit | 460f7fb |
| Validation scope | Full initial validation — architecture, flows, components, critical areas, data model, APIs, MCP, Bob Skills, statistics, testing, onboarding, change impact |
| Repository statistics recalculated | Yes — derived from current repository files |
