# Project Documentation Rules (Non-Obvious Only)

- **`docs/api.md` documents the current v1.0 REST API and must be kept synchronized whenever API endpoints or response structures change.**
- **All three user roles (Analyst, Developer, Manager) have identical permissions** in v1.0 — there is no role-based access control despite roles existing in the data model.
- **Session store is a plain in-memory `Map`** — not JWT, not Redis, not cookies. Sessions are lost on server restart. This is intentional per [`docs/overview.md`](docs/overview.md).
- **The `npm run setup` script is safe to re-run** — `seedDatabase` is a no-op if users already exist.
- **Vite proxies `/api` in dev only** — in production, `NODE_ENV=production npm start` serves both the API and the built `dist/` from the same Express process on port 3001.
- **SQLite database is created automatically on first server start** — `npm run setup` is optional shorthand; `npm run dev` also creates and seeds the DB.
