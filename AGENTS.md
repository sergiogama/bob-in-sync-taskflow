# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Stack

React 19 + React Router 7 (frontend), Express 5 + better-sqlite3 (backend), all ESM (`"type": "module"`), Node ≥ 20 required.

## Commands

```bash
npm run setup          # create + seed the SQLite DB at data/taskflow.db (idempotent)
npm run dev            # concurrently: Express API on :3001, Vite dev server on :5173
npm test               # Node built-in test runner — all server/tests/*.test.js
npm run build          # Vite → dist/
NODE_ENV=production npm start  # serve API + built dist on :3001
```

**Run a single test by name** (Node test runner has no file-level isolation; filter by test name):
```bash
node --test --test-concurrency=1 --test-name-pattern="adds a comment" server/tests/*.test.js
```

**Env vars:** `API_PORT` (dev + prod), `PORT` (prod only), `DATABASE_PATH`.

## Architecture

All server layers use a factory/dependency-injection pattern — nothing is a singleton or uses global state:

```
createDatabase(db) → createUserModel / createTicketModel / createCommentModel
  → createAuthService / createTicketService
    → createAuthController / createTicketController
      → authRoutes / ticketRoutes
        → createApp(db)   ← test uses createApp(':memory:')
```

- **Sessions live in a `Map` inside `authService`** — restarting the server logs everyone out; this is intentional.
- `createApp(db, { serveClient: true })` enables static file serving; in dev the client is served separately by Vite.
- `seedDatabase(db)` is idempotent — no-ops if the users table is non-empty.

## Error handling (server)

Errors are thrown with `Object.assign(new Error('message'), { status: 400 })`. The global Express error handler in [`server/app.js`](server/app.js) reads `error.status`; only errors without a status (≥ 500) are logged. Never use `res.status().json()` directly in service/model layers.

## API response shape

All successful responses wrap their payload:
- `{ tickets: [...] }`, `{ ticket: {...} }`, `{ users: [...] }`, `{ user: {...} }`, `{ comment: {...} }`, `{ counts: {...} }`

## Ticket status values

Canonical values (enforced by SQLite CHECK and service validation): `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` — exported from [`server/services/ticketService.js`](server/services/ticketService.js) as `STATUSES`.

## Database

- SQLite via `better-sqlite3` (synchronous API — no `async/await` in models).
- Forward-only SQL migrations live in `server/database/migrations/` and are applied on startup by `migrationRunner.js`.
- Applied versions are recorded in `schema_migrations`; never edit an applied migration. Add the next numbered file.
- Ticket `updated_at` is bumped manually when a comment is added (see [`server/models/commentModel.js`](server/models/commentModel.js)).
- SQLite dates are stored as `TEXT` in UTC; the frontend normalises them with `value.includes('T') ? value : \`${value.replace(' ', 'T')}Z\`` before passing to `Intl.DateTimeFormat`.

## Frontend API client

All fetch calls go through [`src/api.js`](src/api.js) `api(path, options)`. Token is stored in `localStorage` under key `taskflow_token`. Vite proxies `/api` → `http://127.0.0.1:3001` in dev.

## Code style (observed, no linter config present)

- **No TypeScript, no JSX file extension for pure-JS files** — `.jsx` only for files that contain JSX.
- Explicit `.js` / `.jsx` extensions on all imports (required for ESM).
- Server modules use named factory exports (`createX`); React pages use default exports.
- `PageState.jsx` exports `LoadingState` and `ErrorState` — use these instead of inline loading/error markup.
- `StatusBadge` CSS classes follow the pattern `status-${status.toLowerCase()}` (e.g. `status-in_progress`).
- Ticket IDs are displayed as `TF-${String(id).padStart(4, '0')}`.
- No linter or formatter config files exist — match the style of existing files (2-space indent, single quotes, no semicolons not present in surrounding code).
