# BOB IN SYNC — How IBM Bob Was Used

## IBM Bob at the Center

IBM Bob was used both to **build the project** and as a **runtime component of the final solution**.

## 1. Build and Application Understanding

Our team used Bob to inspect and evolve the TaskFlow application:

- React frontend
- Node.js / Express backend
- SQLite data model
- REST APIs
- automated tests
- technical documentation

Bob helped identify affected components, modify code, run tests and builds, and validate changes.

## 2. Bob Skills

We created two custom Skills:

### `change-workflow`

Guides a ticket from business request to implementation.

It:

- detects when active work starts
- retrieves ticket context
- uses the Solution Guide as technical orientation
- generates a concise Change Brief
- assesses impact and risk
- requires explicit human approval before code changes
- implements and validates approved changes

### `solution-knowledge`

Maintains the application’s living technical knowledge.

It creates and updates:

`docs/solution-guide/SOLUTION_GUIDE.md`

The guide contains architecture, operational flows, core components, critical areas, APIs, data model, risks, onboarding guidance, and repository-derived statistics.

## 3. MCP Integration

We built a custom **Model Context Protocol (MCP)** server connecting IBM Bob to TaskFlow.

Bob can:

- list open tickets
- retrieve ticket details
- retrieve comments
- start work on a ticket

When work starts, TaskFlow is automatically updated:

**Owner → IBM Bob**  
**Status → IN_PROGRESS**  
**Comment → IBM Bob started working...**

## Governance

Bob does not modify application code without explicit developer approval and does not automatically close tickets. QA and production promotion remain part of the normal delivery process.

## watsonx

**IBM watsonx.ai and watsonx Orchestrate are not used in the current implementation.**
