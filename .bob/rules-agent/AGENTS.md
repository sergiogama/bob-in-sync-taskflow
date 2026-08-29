# Project Coding Rules (Non-Obvious Only)

- **Factory DI everywhere** — when adding a new model/service/controller, follow the `createX(dep)` factory pattern and wire it in [`server/app.js`](server/app.js). Never import `db` directly in service or controller files.
- **better-sqlite3 is synchronous** — no `async/await` in model files; all queries return values directly.
- **Throw errors with a `status` property** for HTTP error responses: `throw Object.assign(new Error('msg'), { status: 400 })`. The global error handler in `app.js` reads `.status` to decide response code and whether to log.
- **Explicit `.js`/`.jsx` extensions required** on every import — ESM (`"type": "module"`) does not resolve bare extensions.
- **Tests use an in-memory DB** created fresh per test run via `createDatabase(':memory:')` + `seedDatabase(db)`. Tests must run with `--test-concurrency=1` (already in the npm script).
- **`seedDatabase` seed counts are test-coupled** — tests assert exact record counts (12 tickets, 5 users, 13 total dashboard). If you add seed data, update the test assertions in [`server/tests/api.test.js`](server/tests/api.test.js).
- **`userModel.list()` never returns `password_hash`** — the public fields are hardcoded in [`server/models/userModel.js`](server/models/userModel.js). Do not add `SELECT *` queries that return users.
- **Run a single test by name** (no per-file isolation): `node --test --test-concurrency=1 --test-name-pattern="<name>" server/tests/*.test.js`
