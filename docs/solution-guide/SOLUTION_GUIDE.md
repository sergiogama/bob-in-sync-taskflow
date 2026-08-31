# TaskFlow Solution Guide

## 1. Solution at a Glance

**Purpose:** Internal IT maintenance request management system.

**Target users:** Support analysts, developers, and managers responsible for tracking and resolving IT maintenance requests.

**Main business capabilities:**
- Create, assign, and track IT maintenance tickets through a defined lifecycle (OPEN → IN_PROGRESS → RESOLVED → CLOSED)
- Filter and search tickets by status, category, owner, and free text
- Dashboard with ticket counts by status and stale-ticket visibility
- User management and authentication
- IBM Bob AI integration via MCP for change workflow automation (BOB IN SYNC)

**Technology stack:**
- Frontend: React 19, React Router 7, Vite 7
- Backend: Express 5, better-sqlite3 (synchronous), Node ≥ 20
- Module system: ESM (`"type": "module"`) throughout
- Auth: Bearer token with in-memory session store
- MCP: Custom `taskflow-mcp` server exposing IBM Bob tooling via STDIO transport

**Repository orientation:**
- `server/` — Express API (models, services, controllers, routes, middleware, tests)
- `src/` — React frontend (pages, components, context, api client)
- `mcp/taskflow-mcp/` — MCP server for IBM Bob integration
- `data/` — SQLite database file
- `docs/` — Living technical documentation

**BOB IN SYNC:** IBM Bob participates as an automated developer agent. The `taskflow-mcp` server authenticates as the `IBM Bob` user and exposes tools (`list_open_tickets`, `get_ticket`, `get_ticket_comments`, `start_work_on_ticket`) that allow Bob to receive, claim, and progress change requests directly from the TaskFlow system.

---

## 2. Architecture

```
Browser (React 19 + React Router 7)
  └─ /api  ←→  Express 5 API (:3001)
                 ├─ authRoutes   → authController → authService → userModel
                 ├─ ticketRoutes → ticketController → ticketService → ticketModel / commentModel
                 ├─ GET /api/dashboard → ticketService.counts()
                 ├─ GET /api/users → userModel.list()
                 └─ SQLite (better-sqlite3, synchronous)

IBM Bob (Claude)
  └─ MCP (STDIO)  →  taskflow-mcp/index.js
                        └─ REST calls to Express API (authenticated as IBM Bob)
```

**Frontend:** Single-page app served by Vite in dev (port 5173, proxying `/api` to `:3001`). In production, Express serves the built `dist/` directory. Routes are managed by React Router 7.

**Backend:** Pure factory/DI — no singletons. `createApp(db)` wires all layers. `createDatabase(':memory:')` is used for tests.

**Persistence:** SQLite via `better-sqlite3`. Numbered, forward-only SQL migrations run on startup and are recorded in `schema_migrations`. `seedDatabase(db)` is idempotent (no-ops if `users` table is non-empty).

**Authentication:** Login returns a random Bearer token. Sessions live in a `Map` inside `authService` — restarting the server logs all users out (intentional).

**MCP integration:** `mcp/taskflow-mcp/index.js` runs as a STDIO MCP server. It authenticates once via the TaskFlow REST API and caches the token in memory.

---

## 3. Operational Flows

### Authentication
1. User submits credentials at `/login`
2. POST `/api/auth/login` → `authService.login()` verifies password with bcrypt
3. Token generated via `crypto.randomBytes`, stored in session Map
4. Token saved to `localStorage` under key `taskflow_token`
5. All subsequent requests include `Authorization: Bearer <token>`

### Password Reset
1. A user who cannot sign in is directed to contact a TaskFlow Manager through an approved internal channel
2. After verifying the user's identity, the Manager opens Users and generates a reset token
3. POST `/api/users/:id/password-reset` verifies the Manager role and issues a 32-byte token valid for 1 hour
4. Only a SHA-256 hash of the token is stored; issuing a new token invalidates previous active tokens
5. The Manager shares the one-time token through the verified internal channel
6. The user submits the token and a new password at `/reset-password`
7. Password update and token consumption run in one SQLite transaction; all existing sessions for the user are revoked

### Ticket Lifecycle
1. Ticket created with status `OPEN` (default)
2. Analyst triages and assigns the ticket, or a Developer claims an unassigned ticket for themselves → `IN_PROGRESS`
3. The owning Developer completes work → `RESOLVED`
4. Manager validates and closes → `CLOSED`
5. Role and ownership transitions are enforced by `ticketService`; SQLite `CHECK` constraints reject unknown values

### Ticket Listing & Filtering
1. `TicketsPage` reads `search`, `status`, `category` from URL search params
2. Debounced (150ms) fetch to `GET /api/tickets?status=…&category=…&search=…`
3. `ticketService.list()` → `ticketModel.list()` builds dynamic `WHERE` clause
4. Results include `is_stale` flag (OPEN or IN_PROGRESS, `updated_at` > 3 days)

### Dashboard
1. `DashboardPage` fetches `/api/dashboard` and `/api/tickets` in parallel
2. `/api/dashboard` returns counts: `{ OPEN, IN_PROGRESS, RESOLVED, CLOSED, stale }`
3. Dashboard shows 5 most recently updated tickets
4. Each status metric card links to filtered ticket list

### IBM Bob Start-Work (BOB IN SYNC)
1. Developer tells Bob to work on a ticket
2. Bob calls `start_work_on_ticket` via MCP
3. MCP rejects a ticket already assigned to someone else; otherwise it calls `PUT /api/tickets/:id` to assign IBM Bob + set `IN_PROGRESS`
4. MCP server calls `POST /api/tickets/:id/comments` to add traceability comment
5. Ticket is now assigned to IBM Bob and visibly IN_PROGRESS in TaskFlow UI

### Adding a Comment
1. Authenticated user posts `POST /api/tickets/:id/comments` with `{ content }`
2. `commentModel.create()` inserts comment and bumps `tickets.updated_at`
3. Comment returned with author name joined from users table

---

## 4. Core Components

| Component | Responsibility | Primary Files |
|---|---|---|
| `createTicketModel` | All SQL for tickets (list, find, create, update, statusCounts, countStale) | `server/models/ticketModel.js` |
| `createTicketService` | Business validation, list/get/create/update/addComment/counts | `server/services/ticketService.js` |
| `createTicketController` | HTTP request/response mapping for tickets | `server/controllers/ticketController.js` |
| `createAuthService` | Login, session management, Manager-issued password resets, token hashing, and session revocation | `server/services/authService.js` |
| `createAccountRecoveryModel` | Transactional SQL for replacing and consuming hashed reset tokens | `server/models/accountRecoveryModel.js` |
| `createApp` | Factory wiring all layers, route registration, error handler | `server/app.js` |
| `TicketsPage` | Ticket list with search/status/category filters, stale indicator | `src/pages/TicketsPage.jsx` |
| `DashboardPage` | Status metrics dashboard + recently updated tickets | `src/pages/DashboardPage.jsx` |
| `TicketDetailPage` | Full ticket view with comments | `src/pages/TicketDetailPage.jsx` |
| `TicketFormPage` | Create/edit ticket form | `src/pages/TicketFormPage.jsx` |
| `SignInHelpPage` | Secure sign-in assistance guidance directing users to a Manager | `src/pages/SignInHelpPage.jsx` |
| `AccountRecoveryPage` | Form to submit reset token and new password | `src/pages/AccountRecoveryPage.jsx` |
| `StatusBadge` | Reusable status pill — CSS class `status-${status.toLowerCase()}` | `src/components/StatusBadge.jsx` |
| `taskflow-mcp` | MCP server giving IBM Bob REST access to TaskFlow | `mcp/taskflow-mcp/index.js` |

---

## 5. Critical Areas

### Authentication — MEDIUM
- Sessions in a `Map` are ephemeral; server restart logs all users out
- Token never expires; no refresh mechanism
- Password reset tokens are Manager-issued, stored as SHA-256 hashes, expire after 1 hour, and are single-use
- Public sign-in assistance does not reveal whether an account exists
- A successful password reset revokes all existing sessions for that user
- **Change risks:** Modifying session logic breaks all authenticated flows; reset token table requires schema migration on existing DBs
- **Validate:** Login test, authenticated API calls, forgot-password and reset-password endpoint tests

### Ticket Lifecycle — HIGH
- Status values are constrained by SQLite CHECK and `STATUSES`; role and ownership transitions are enforced in `ticketService.js`
- `owner_id` is nullable; unassigned is a valid state
- The React permission helpers mirror the service policy for presentation, but never replace backend checks
- `updated_at` is bumped manually only in `commentModel.create()`; it is NOT auto-updated on status change
- **Change risks:** Adding/removing statuses requires schema change, service constant, UI selects, and CSS
- **Validate:** Full API test suite; UI status filtering

### Data Persistence — HIGH
- `better-sqlite3` is synchronous — never add `async/await` to model files
- Numbered SQL migrations are applied transactionally by `migrationRunner.js`
- `schema_migrations` records the version and name of each applied migration
- Pre-migration databases are adopted safely; legacy tickets receive `category = OTHER`
- All cascade deletes are defined (comments cascade on ticket delete)
- **Change risks:** Editing an applied migration creates environment drift; always add a new numbered migration
- **Validate:** Tests cover migration idempotency and adoption without data loss

### Dashboard Counts — MEDIUM
- `ticketService.counts()` aggregates both status counts and stale count in one call
- Stale condition: `status IN ('OPEN', 'IN_PROGRESS') AND updated_at < datetime('now', '-3 days')`
- Test asserts total of all status counts = 13 (after 1 ticket created in test)
- **Change risks:** Adding a new count metric requires model, service, API, and dashboard UI changes
- **Validate:** Dashboard API test assertion

### MCP Integration — MEDIUM
- `taskflow-mcp` authenticates as `IBM Bob` user; IBM Bob must exist in the DB
- Token is cached in memory; MCP server restart requires re-authentication
- `start_work_on_ticket` is designed to be idempotent
- **Change risks:** API contract changes break MCP tool behavior silently
- **Validate:** Manual MCP tool calls; check ticket state after operation

---

## 6. Data Model

### users
| Field | Type | Notes |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| name | TEXT | Display name |
| email | TEXT UNIQUE | Login credential |
| password_hash | TEXT | bcryptjs hash — never returned by `userModel.list()` or `findById()`; updated by `userModel.updatePassword()` |
| role | TEXT | CHECK: `Analyst`, `Developer`, `Manager` |
| active | INTEGER | 1 = active; `findByEmail` filters on `active = 1` |
| created_at | TEXT | UTC timestamp |

### tickets
| Field | Type | Notes |
|---|---|---|
| id | INTEGER PK | Displayed as `TF-XXXX` (zero-padded to 4 digits) |
| title | TEXT | Required |
| description | TEXT | Required |
| status | TEXT | CHECK: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| category | TEXT | CHECK: `SOFTWARE`, `HARDWARE`, `ACCESS`, `OTHER` |
| owner_id | INTEGER FK | Nullable — NULL means unassigned |
| created_by_id | INTEGER FK | NOT NULL |
| created_at | TEXT | UTC |
| updated_at | TEXT | UTC — bumped on comment creation; NOT auto-bumped on status change |

### comments
| Field | Type | Notes |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| ticket_id | INTEGER FK | CASCADE DELETE |
| author_id | INTEGER FK | NOT NULL |
| content | TEXT | Required, trimmed |
| created_at | TEXT | UTC |

### password_reset_tokens
| Field | Type | Notes |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| user_id | INTEGER FK | CASCADE DELETE on user removal |
| token | TEXT UNIQUE | SHA-256 hash of the 32-byte random token; column name retained for schema compatibility |
| expires_at | TEXT | UTC — 1 hour after creation |
| used | INTEGER | 0 = valid, 1 = consumed |
| created_at | TEXT | UTC |

**Indexes:** `idx_tickets_status`, `idx_tickets_owner`, `idx_comments_ticket`, `idx_reset_tokens_token`

---

## 7. APIs and Integrations

### Authentication
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Returns `{ token, user }` |
| GET | `/api/auth/me` | Returns `{ user }` for current token |
| POST | `/api/auth/logout` | Invalidates token |
| POST | `/api/auth/forgot-password` | Returns generic internal support guidance without account disclosure |
| POST | `/api/auth/reset-password` | Validates token and updates password (no auth required) |

### Tickets
| Method | Path | Description |
|---|---|---|
| GET | `/api/tickets` | List with optional `?status=`, `?category=`, `?search=` |
| POST | `/api/tickets` | Analyst/Manager create ticket — returns `201 { ticket }` |
| GET | `/api/tickets/:id` | Ticket detail with `comments[]` |
| PUT | `/api/tickets/:id` | Full update subject to role and ownership policy — returns `{ ticket }` |
| POST | `/api/tickets/:id/comments` | Add comment — returns `201 { comment }` |

### Dashboard & Users
| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard` | Returns `{ counts: { OPEN, IN_PROGRESS, RESOLVED, CLOSED, stale } }` |
| GET | `/api/users` | Returns `{ users: [...] }` — no `password_hash` |
| POST | `/api/users/:id/password-reset` | Manager-only issuance of a one-time reset token |

Health, login, forgot-password guidance, and reset-password consumption are public. All other routes require `Authorization: Bearer <token>`. Ticket writes apply Analyst/Developer/Manager workflow rules, and reset-token issuance requires the Manager role.

### MCP Tools (taskflow-mcp)
| Tool | Description |
|---|---|
| `list_open_tickets` | Returns all tickets with status OPEN |
| `get_ticket` | Full details of a single ticket by id or reference |
| `get_ticket_comments` | All comments for a ticket |
| `start_work_on_ticket` | Assigns to IBM Bob, sets IN_PROGRESS, adds traceability comment |

---

## 8. Application Statistics

Derived from repository at last validation point:

| Metric | Count | Definition |
|---|---|---|
| Database tables | 5 | Four application tables plus `schema_migrations` |
| REST endpoints | 14 | Route declarations across auth, ticket, user, health, and dashboard routes |
| MCP tools | 4 | Registered in `mcp/taskflow-mcp/index.js` |
| Backend models | 4 | `userModel`, `ticketModel`, `commentModel`, `accountRecoveryModel` |
| Backend services | 2 | `authService`, `ticketService` |
| Frontend pages | 8 | Files in `src/pages/` |
| Frontend components | 3 | Files in `src/components/` |
| Automated test files | 1 | `server/tests/api.test.js` |
| Automated test cases | 15 | `test(...)` blocks in `api.test.js` |
| Seed tickets | 12 | `tickets` array in `seed.js` |
| Seed users | 6 | `users` array in `seed.js` (includes IBM Bob) |

*Statistics reflect the repository at the guide's last validation point.*

---

## 9. Testing and Validation

### Commands
```bash
npm test          # Node built-in test runner — server/tests/api.test.js (--test-concurrency=1)
npm run build     # Vite production build → dist/
npm run setup     # Create + seed SQLite DB at data/taskflow.db (idempotent)
```

**Single test by name:**
```bash
node --test --test-concurrency=1 --test-name-pattern="adds a comment" server/tests/*.test.js
```

### Test areas covered
- Authentication (login, token validation, 401 on missing auth)
- Ticket listing with search and status filters
- Ticket create, update, assign, retrieve
- Comment creation
- Dashboard counts (asserts total = 13 after test creates 1 ticket)
- `is_stale` field presence and correctness
- Invalid status validation (400 response)
- Ticket RBAC: creation, claim, ownership, transition, Manager override, and shared comments
- Password reset: token generation, successful reset + new password login, unknown email rejection, invalid token rejection, used-token rejection

### Known gaps
- No frontend (UI) automated tests
- No integration tests for MCP tools
- No test for unassigned ticket filtering (relevant to TF-0014)

---

## 10. Developer Onboarding

### Prerequisites
- Node.js ≥ 20
- Clone the repository

### Setup
```bash
npm install
npm run setup    # creates data/taskflow.db with seed data
npm run dev      # API on :3001, Vite on :5173
```

Default credentials (all users): password `taskflow123`

### Recommended reading order
1. `AGENTS.md` — project rules and conventions
2. This Solution Guide
3. `server/database/migrations/` and `migrationRunner.js` — data model and evolution
4. `server/app.js` — application wiring
5. `server/services/ticketService.js` — core business logic
6. `src/pages/DashboardPage.jsx` and `src/pages/TicketsPage.jsx` — main UI flows

### How BOB IN SYNC works
1. Open tickets are listed via `list_open_tickets` MCP tool
2. Developer asks Bob to take a ticket
3. Bob calls `start_work_on_ticket` → ticket assigned to IBM Bob, status IN_PROGRESS
4. Bob investigates codebase, presents a Change Brief, and waits for human approval before modifying code
5. After implementation + validation, Bob updates this Solution Guide and creates a change log

---

## 11. Change Impact Guidance

| Change Type | Likely Affected Areas | Typical Validation |
|---|---|---|
| New ticket status | New numbered migration, `ticketService.js` (STATUSES), UI selects, CSS, tests | Migration tests + full API suite + UI status filter |
| New ticket filter (e.g. unassigned) | `ticketModel.list()`, `ticketService.list()`, `TicketsPage` UI, tests | API filter test + UI behavior |
| Dashboard metric | `ticketModel`, `ticketService.counts()`, `/api/dashboard`, `DashboardPage` | Dashboard API test |
| New comment behavior | `commentModel.js`, `ticketService.addComment()`, `TicketDetailPage` | Comment test |
| Auth changes | `authService.js`, `middleware/auth.js`, login flow, MCP re-auth | Auth test + MCP tool calls |
| Account recovery changes | `authService.js`, `accountRecoveryModel.js`, auth/user routes and controllers, `SignInHelpPage`, `AccountRecoveryPage` | Role, token hashing, session revocation, and reset tests |
| MCP capability | `mcp/taskflow-mcp/index.js`, REST endpoint contract, this guide | MCP call + TaskFlow state |
| Schema change | New `NNN_description.sql`, affected model/service, migration tests | Legacy upgrade test + full suite + backup/restore check |

---

## 12. Known Risks and Technical Considerations

- **Session volatility:** In-memory sessions mean all users are logged out on server restart. This is documented as intentional but can cause surprise in development.
- **Forward-only migrations:** Rollback is performed by restoring a verified backup or adding a corrective forward migration; destructive changes require explicit data-copy migrations.
- **`updated_at` not auto-bumped on status change:** Only `commentModel.create()` updates `updated_at`. A ticket that moves from OPEN to IN_PROGRESS without a comment will not reflect the change time. This affects the "Stale" calculation accuracy.
- **Seed counts test-coupled:** `api.test.js` asserts exact counts. Adding seed data requires updating test assertions.
- **No pagination:** `ticketModel.list()` returns all matching tickets. Large datasets will degrade performance.
- **No TypeScript:** Type safety is entirely runtime; refactoring has higher regression risk.
- **IBM Bob user:** The MCP server depends on the IBM Bob seed user existing in the database. If the database is reset without re-seeding, MCP authentication will fail.

---

## 13. Recent Solution Evolution

| Date | Reference | Change |
|---|---|---|
| 2026-08-30 | commit `73b3838` | Final BOB IN SYNC integration — MCP server, IBM Bob seed user, `start_work_on_ticket` tool, change workflow skill |
| 2026-08-30 | commit `c8b7240` | Living solution knowledge workflow documented |
| 2026-08-30 | TF-0002 | Password reset feature, subsequently hardened as a Manager-mediated account recovery workflow |

---

## 14. Knowledge Metadata

| Field | Value |
|---|---|
| Last validated | 2026-08-30 |
| Repository commit | 73b3838 (+ TF-0002 changes) |
| Validation scope | Full repository inspection — schema, models, services, controllers, routes, frontend pages, components, tests, MCP server, package.json, vite.config.js |
| Maintained by | IBM Bob / BOB IN SYNC |
| Statistics recalculated | Yes |
