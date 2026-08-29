# TaskFlow

TaskFlow v1.0 is a small internal application for registering and managing IT maintenance requests. It uses React, Express, REST APIs, and a persistent SQLite database.

## Requirements

- Node.js 20 or newer
- npm

## Run locally

```bash
npm install
npm run setup
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API runs on port 3001 and is proxied by the frontend development server.

Sign in with:

- Email: `maria.santos@taskflow.local`
- Password: `taskflow123`

All five sample users use the same local password. The SQLite database is stored at `data/taskflow.db` and persists between restarts. Running `npm run setup` again is safe and does not replace existing data.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run setup` | Create and seed the database if it is empty |
| `npm run dev` | Start the React client and Express API together |
| `npm test` | Run backend API tests |
| `npm run build` | Build the production frontend |
| `NODE_ENV=production npm start` | Serve the API and an existing frontend build on port 3001 |

Configuration is intentionally limited. Set `API_PORT` to change the API and development proxy port, `PORT` to change the production API port, or `DATABASE_PATH` to use another SQLite file.

See [docs/overview.md](docs/overview.md) for the application structure and [docs/api.md](docs/api.md) for the REST interface.
