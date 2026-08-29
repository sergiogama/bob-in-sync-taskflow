# Project Architecture Rules (Non-Obvious Only)

- **`createApp(db)` is the composition root** — all dependencies flow down from it. The test suite creates its own `app` instance with an in-memory DB, so the architecture is fully testable without mocking.
- **No auth middleware on `POST /api/auth/login`** — the login route is explicitly outside the `authMiddleware` scope in [`server/app.js`](server/app.js).
- **`ticket.updated_at` is bumped on comment creation** — this coupling lives in [`server/models/commentModel.js`](server/models/commentModel.js) via a manual `UPDATE tickets SET updated_at = ...` after each comment insert.
- **Status is validated in two places**: the SQLite `CHECK` constraint in schema AND `ticketService.validateFields`. Any new status must be added to both `schema.js` and the `STATUSES` array in `ticketService.js`.
- **Frontend has no global state library** — auth state is React context only (`AuthContext`). All other data is fetched locally per page with `useEffect` + `useState`.
- **`formatDate` is exported from `DashboardPage.jsx`** — if date formatting is needed elsewhere, import from there rather than duplicating the SQLite UTC normalisation logic.
- **Production deployment is single-process** — no reverse proxy assumption; `createApp(db, { serveClient: true })` makes Express serve the Vite build directly.
