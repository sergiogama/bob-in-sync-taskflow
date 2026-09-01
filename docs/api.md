# REST API

All JSON endpoints except health, login, sign-in assistance, and reset-password require `Authorization: Bearer <token>`.

## Authentication

- `POST /api/auth/login` — body: `{ "email": "...", "password": "..." }`
- `GET /api/auth/me` — current user
- `POST /api/auth/logout` — end the current session
- `POST /api/auth/forgot-password` — returns generic internal support guidance; never returns a token or confirms an account
- `POST /api/auth/reset-password` — consume a Manager-issued token and set a new password

## Application

- `GET /api/health` — service health
- `GET /api/dashboard` — lifecycle, stale, and readiness counts
- `GET /api/users` — active and inactive users available to the interface
- `POST /api/users/:id/password-reset` — generate a one-time reset token; Manager role required

## Tickets

- `GET /api/tickets` — list tickets; optional `search` and `status` query parameters
- `POST /api/tickets` — create a ticket; Analyst or Manager required
- `GET /api/tickets/:id` — ticket detail with comments
- `PUT /api/tickets/:id` — replace editable ticket fields; role and ownership rules apply
- `POST /api/tickets/:id/comments` — add a comment with `{ "content": "..." }`
- `POST /api/tickets/:id/readiness-review` — run the configured readiness check; Analyst, Manager, or IBM Bob

## Workflow administration

- `GET /api/workflow/settings` — retrieve readiness and notification policy; Manager required
- `PUT /api/workflow/settings` — update policy and increment its criteria version; Manager required

Create and update bodies use:

```json
{
  "title": "Invoice import failing",
  "description": "The nightly import stops during validation.",
  "status": "OPEN",
  "owner_id": 2,
  "expected_behavior": "Describe the correct outcome.",
  "steps_to_reproduce": "List repeatable steps when applicable.",
  "environment": "Test environment and relevant supplied device details.",
  "business_rules": "Relevant rules when applicable.",
  "acceptance_criteria": "Describe how completion will be verified."
}
```

`owner_id` may be `null`. Valid statuses are `OPEN`, `IN_PROGRESS`, `RESOLVED`, and `CLOSED`. Errors use `{ "error": "message" }` with an appropriate HTTP status.

## Ticket authorization

- Analysts create, classify, assign, and triage tickets as `OPEN` or `IN_PROGRESS`.
- Developers cannot create tickets. They can claim an unassigned ticket for themselves, update an owned ticket to `IN_PROGRESS` or `RESOLVED`, and cannot change its title, description, category, or owner.
- Managers can create and update any ticket, including setting `RESOLVED` or `CLOSED`.
- Every authenticated role can read tickets and add comments.

An authenticated but unauthorized operation returns `403`.

Every response includes `X-Correlation-Id`. MCP requests authenticated as IBM Bob may send `X-TaskFlow-Source: IBM_BOB`; other users cannot use that header to impersonate an MCP actor.
