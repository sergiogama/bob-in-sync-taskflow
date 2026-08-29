# REST API

All JSON endpoints except login and health require `Authorization: Bearer <token>`.

## Authentication

- `POST /api/auth/login` — body: `{ "email": "...", "password": "..." }`
- `GET /api/auth/me` — current user
- `POST /api/auth/logout` — end the current session

## Application

- `GET /api/health` — service health
- `GET /api/dashboard` — counts keyed by `OPEN`, `IN_PROGRESS`, `RESOLVED`, and `CLOSED`
- `GET /api/users` — active and inactive users available to the interface

## Tickets

- `GET /api/tickets` — list tickets; optional `search` and `status` query parameters
- `POST /api/tickets` — create a ticket
- `GET /api/tickets/:id` — ticket detail with comments
- `PUT /api/tickets/:id` — replace editable ticket fields
- `POST /api/tickets/:id/comments` — add a comment with `{ "content": "..." }`

Create and update bodies use:

```json
{
  "title": "Invoice import failing",
  "description": "The nightly import stops during validation.",
  "status": "OPEN",
  "owner_id": 2
}
```

`owner_id` may be `null`. Valid statuses are `OPEN`, `IN_PROGRESS`, `RESOLVED`, and `CLOSED`. Errors use `{ "error": "message" }` with an appropriate HTTP status.
