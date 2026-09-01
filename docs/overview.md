# TaskFlow overview

TaskFlow manages internal application maintenance tickets for Analysts, Developers, and Managers. Authentication identifies the current user and the service layer enforces role-based ticket workflows.

## Roles

| Capability | Analyst | Developer | Manager |
|---|---:|---:|---:|
| Read tickets, dashboard, and add comments | Yes | Yes | Yes |
| Create and classify tickets | Yes | No | Yes |
| Assign ticket owners | Yes, while triaging | Self only when claiming an unassigned ticket | Yes |
| Set `OPEN` or `IN_PROGRESS` | Yes | `IN_PROGRESS` on owned/claimed tickets | Yes |
| Set `RESOLVED` | No | On owned tickets | Yes |
| Set `CLOSED` and issue password resets | No | No | Yes |

The React interface hides unavailable actions for clarity, but the Express service is the authorization boundary. IBM Bob authenticates as a Developer and can start work only on an unassigned ticket or one already assigned to IBM Bob.

## Structure

- `src/` contains the React interface, routes, shared components, and API client.
- `server/routes/` maps REST endpoints.
- `server/controllers/` handles HTTP input and output.
- `server/services/` contains validation and ticket workflows.
- `server/models/` contains SQLite queries.
- `server/database/` contains numbered SQL migrations, the migration runner, and sample data.
- `server/tests/` contains API-level automated tests.

The Express process applies pending forward-only migrations on startup and seeds sample records only when the users table is empty. Applied versions are stored in `schema_migrations`. SQLite uses WAL mode and stores data at `data/taskflow.db` by default.

Login sessions are deliberately simple and kept in server memory. Restarting the API signs users out, but does not affect ticket data. Passwords are stored as bcrypt hashes.

## v1.0 scope

Tickets have a title, description, status, optional owner, creator, and timestamps. Users can search and filter tickets, update their details, and add comments. Priority, SLA, due dates, AI features, impact analysis, and automatic documentation are outside this version.

## Ticket readiness workflow

Readiness is independent from lifecycle status:

- `NEEDS_REVIEW` — request information changed or has not been checked.
- `READY` — configured information is present and a Developer may start work.
- `NOT_READY` — required information is missing; TaskFlow adds one concise `NOT READY` comment with the missing items.

The readiness check uses structured request fields and Manager-configured deterministic criteria. IBM Bob can invoke the same check through MCP. `start_work_on_ticket` reviews a ticket first when necessary, assigns a ready ticket to IBM Bob, and refuses to start a request that is not ready.

Ticket mutations, comments, reviews, and workflow-setting changes are recorded as audit events with actor, source, correlation id, and timestamp. Notification records are written to `notification_outbox` in the same SQLite transaction as the ticket event. The worker uses preview logging by default and the Resend API when `NOTIFICATION_MODE=resend` is configured. Resend deliveries use the outbox id as an idempotency key and retain the provider message id.
