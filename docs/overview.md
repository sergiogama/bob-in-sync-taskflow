# TaskFlow overview

TaskFlow manages internal application maintenance tickets for Analysts, Developers, and Managers. Authentication identifies the current user; v1.0 intentionally applies the same application permissions to all three roles.

## Structure

- `src/` contains the React interface, routes, shared components, and API client.
- `server/routes/` maps REST endpoints.
- `server/controllers/` handles HTTP input and output.
- `server/services/` contains validation and ticket workflows.
- `server/models/` contains SQLite queries.
- `server/database/` contains schema creation and sample data.
- `server/tests/` contains API-level automated tests.

The Express process initializes the schema on startup and seeds sample records only when the users table is empty. SQLite uses WAL mode and stores data at `data/taskflow.db` by default.

Login sessions are deliberately simple and kept in server memory. Restarting the API signs users out, but does not affect ticket data. Passwords are stored as bcrypt hashes.

## v1.0 scope

Tickets have a title, description, status, optional owner, creator, and timestamps. Users can search and filter tickets, update their details, and add comments. Priority, SLA, due dates, AI features, impact analysis, and automatic documentation are outside this version.
