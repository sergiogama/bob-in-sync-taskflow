# BOB IN SYNC — TaskFlow

TaskFlow is a small internal IT maintenance request management application used as the reference application for **BOB IN SYNC**, our IBM TechXchange 2026 Hackathon project.

The application represents a realistic software maintenance environment where analysts register change requests and developers investigate, implement, validate, and document them.

**BOB IN SYNC** extends this workflow by connecting **IBM Bob** directly to TaskFlow and to the application source code.

> **From ticket to working code, with the developer in control.**

BOB IN SYNC turns IBM Bob into an interactive change companion that helps developers understand unfamiliar applications, synchronize work with the system of record, assess requested changes, implement them safely, validate results, and keep application knowledge synchronized with the code.

---

## Why BOB IN SYNC

Software maintenance teams frequently need to work on applications they did not originally build.

In these environments, developers often face:

- incomplete or outdated documentation
- knowledge loss caused by team changes
- business requests written outside the development context
- uncertainty about which components will be affected
- time spent understanding impact before implementation begins
- risk of changes being made without proper traceability
- documentation becoming outdated after code changes

BOB IN SYNC addresses this gap by placing IBM Bob directly inside the maintenance workflow.

Instead of operating only as a coding assistant, Bob becomes a bridge between:

```text
Business Request
      +
System of Record
      +
Application Knowledge
      +
Source Code
      +
Developer
```

The goal is to make software changes easier to understand, safer to implement, and more traceable.

---

## Solution Overview

BOB IN SYNC combines:

- **TaskFlow** — the system of record for maintenance requests
- **IBM Bob** — the AI-powered software development environment
- **Bob Skill** — a reusable workflow that guides software changes
- **Model Context Protocol (MCP)** — the integration layer between IBM Bob and TaskFlow
- **Application source code** — React, Node.js, Express, REST APIs, and SQLite
- **Human-in-the-loop approval** — the developer remains in control before application code is changed
- **Automated validation** — existing tests and build commands are used to validate the implementation
- **Documentation synchronization** — affected technical knowledge is updated together with the implementation

The main workflow is:

```text
TaskFlow Ticket
      ↓
IBM Bob
      ↓
TaskFlow MCP
      ↓
Work Synchronization
      ↓
Change Workflow Skill
      ↓
Application Understanding
      ↓
Change Brief
      ↓
Human Approval
      ↓
Implementation
      ↓
Tests / Build
      ↓
Documentation Synchronization
```

---

## How IBM Bob Is Used

A developer can start working on a TaskFlow request directly from IBM Bob using a natural instruction such as:

```text
I get TF-0010.
```

or:

```text
Work on TF-0010.
```

BOB IN SYNC recognizes that the user intends to actively work on the ticket.

IBM Bob then:

1. retrieves the requested TaskFlow ticket through MCP
2. confirms that the ticket exists
3. immediately synchronizes the start of work with TaskFlow
4. assigns the ticket to **IBM Bob**
5. changes the ticket status to **IN_PROGRESS**
6. adds a traceability comment to the ticket
7. retrieves comments and relevant business context
8. inspects the parts of the application that are relevant to the requested change
9. produces a concise **Change Brief**
10. presents the expected impact, implementation risk, and suggested approach
11. asks the developer what to do next
12. requires explicit human approval before modifying application code
13. implements the change when approved
14. runs the project's validation commands
15. updates affected documentation

When work starts, TaskFlow records:

```text
Owner: IBM Bob
Status: IN_PROGRESS

Comment:
IBM Bob started working on this request through BOB IN SYNC.
```

This creates immediate visibility for the rest of the organization.

The moment someone starts working with Bob, the system of record reflects that activity.

---

## Human-in-the-Loop Governance

BOB IN SYNC intentionally separates **starting development work** from **approving code changes**.

When the developer asks Bob to work on a ticket, TaskFlow is synchronized immediately.

However, IBM Bob does **not** modify application code until the developer explicitly approves implementation.

This creates a simple governance model:

```text
Developer starts work
        ↓
TaskFlow is synchronized
        ↓
Bob understands the request
        ↓
Bob presents the Change Brief
        ↓
Developer reviews the proposed work
        ↓
Explicit approval
        ↓
Code implementation
```

BOB IN SYNC also does **not** automatically mark tickets as `RESOLVED` or `CLOSED`.

The ticket remains `IN_PROGRESS` after Bob finishes development because implementation is only one part of the delivery lifecycle.

QA validation, homologation, and production promotion remain part of the organization's normal delivery process.

---

## Bob Change Workflow Skill

The main reusable Bob Skill is located at:

```text
.bob/skills/change-workflow/SKILL.md
```

The `change-workflow` Skill acts as an interactive software change companion.

Its main responsibilities are:

- detect active work intent
- retrieve the originating TaskFlow request
- synchronize the start of work through MCP
- understand the business request
- identify material business ambiguities
- inspect only relevant application components
- review source code, tests, schema, APIs, and documentation when needed
- use focused subagents when parallel investigation provides value
- create a concise Change Brief
- identify implementation impact
- classify implementation risk
- suggest a short implementation approach
- keep the developer in control
- require explicit approval before code changes
- implement focused changes
- run tests and build validation
- synchronize affected documentation
- maintain a compact change record when appropriate

The Skill is intentionally lightweight.

It avoids generating unnecessary readiness reports, large implementation documents, or excessive process artifacts.

The objective is to provide enough structure to make the change safe and understandable without slowing down development.

---

## Change Brief

Before implementation, Bob generates a compact Change Brief using the following structure:

```text
Change Brief

Request
What the business is asking for.

Business Rules
Only confirmed rules that affect implementation.

Impact
The main areas of the application that are affected.

Risk
LOW, MEDIUM, or HIGH with a short explanation.

Suggested Approach
A small number of implementation steps.
```

After presenting the brief, Bob asks the developer what to do next.

Typical options include:

```text
1. Clarify or discuss the change
2. Show a more detailed implementation plan
3. Prepare to implement
4. Stop
```

This keeps the workflow interactive instead of forcing a fixed software process on the developer.

---

## TaskFlow MCP Server

The TaskFlow MCP server is located at:

```text
mcp/taskflow-mcp/
```

The IBM Bob project-level MCP configuration is located at:

```text
.bob/mcp.json
```

The MCP server uses **STDIO transport** and communicates with the local TaskFlow REST API.

It provides IBM Bob with controlled access to TaskFlow without requiring Bob to understand the internal database implementation.

### Available MCP Tools

#### `list_open_tickets`

Retrieves all TaskFlow tickets currently in `OPEN` status.

Example information returned:

```text
Reference
Title
Status
Owner
Created date
```

#### `get_ticket`

Retrieves the complete details of a specific TaskFlow ticket.

The tool accepts either:

```text
10
```

or:

```text
TF-0010
```

It returns ticket details such as reference, title, description, status, category, owner, creator, and timestamps.

#### `get_ticket_comments`

Retrieves the discussion and business clarifications associated with a TaskFlow ticket.

Comments are important because later business clarifications can change how a request should be interpreted.

#### `start_work_on_ticket`

Synchronizes the start of active development work with TaskFlow.

The operation:

```text
Owner   → IBM Bob
Status  → IN_PROGRESS
Comment → IBM Bob started working on this request through BOB IN SYNC.
```

The tool is designed to be idempotent.

If the ticket is already assigned to IBM Bob and already marked `IN_PROGRESS`, the MCP server avoids unnecessary duplicate updates and duplicate start-work comments.

---

## MCP Authentication

The MCP server authenticates against the TaskFlow REST API.

For the BOB IN SYNC workflow, the dedicated local IBM Bob user is used:

```text
Email: ibm.bob@taskflow.local
Password: taskflow123
```

This makes actions performed through MCP visible and traceable as IBM Bob activity inside TaskFlow.

Local MCP configuration is stored in:

```text
mcp/taskflow-mcp/.env
```

Example:

```env
TASKFLOW_API_URL=http://127.0.0.1:3001
TASKFLOW_EMAIL=ibm.bob@taskflow.local
TASKFLOW_PASSWORD=taskflow123
```

The `.env` file should not be committed to the repository.

Use `.env.example` as the template.

---

## Technology Stack

### Frontend

- React
- Vite
- JavaScript

### Backend

- Node.js
- Express
- REST APIs

### Data

- SQLite

### AI Development Workflow

- IBM Bob
- Bob Skills
- Model Context Protocol (MCP)
- code understanding
- focused agent/subagent investigation
- human-in-the-loop approval
- automated validation
- documentation synchronization

---

## Requirements

- Node.js 20 or newer
- npm
- IBM Bob for the integrated BOB IN SYNC workflow

---

## Run TaskFlow Locally

Install dependencies:

```bash
npm install
```

Create and seed the local database:

```bash
npm run setup
```

Start the frontend and API:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

The API runs on:

```text
http://127.0.0.1:3001
```

The Vite frontend development server proxies API requests to the Express backend.

---

## Sample Login

A standard TaskFlow user can sign in with:

```text
Email: maria.santos@taskflow.local
Password: taskflow123
```

The seeded environment contains six sample users:

| Name | Email | Role |
| --- | --- | --- |
| Maria Santos | `maria.santos@taskflow.local` | Analyst |
| Daniel Costa | `daniel.costa@taskflow.local` | Developer |
| Priya Nair | `priya.nair@taskflow.local` | Developer |
| Robert Chen | `robert.chen@taskflow.local` | Manager |
| Elena Rossi | `elena.rossi@taskflow.local` | Analyst |
| IBM Bob | `ibm.bob@taskflow.local` | Developer |

All seeded users use the same local development password:

```text
taskflow123
```

---

## Database

The SQLite database is stored at:

```text
data/taskflow.db
```

It persists between application restarts.

Running:

```bash
npm run setup
```

again is safe and does not replace an existing populated database.

The application currently stores:

```text
users
tickets
comments
```

Ticket status values are:

```text
OPEN
IN_PROGRESS
RESOLVED
CLOSED
```

Ticket categories are:

```text
SOFTWARE
HARDWARE
ACCESS
OTHER
```

---

## Configure the TaskFlow MCP Server

The MCP implementation is located at:

```text
mcp/taskflow-mcp/
```

Install its dependencies:

```bash
cd mcp/taskflow-mcp
npm install
```

Create the local environment configuration:

```bash
cp .env.example .env
```

Configure:

```env
TASKFLOW_API_URL=http://127.0.0.1:3001
TASKFLOW_EMAIL=ibm.bob@taskflow.local
TASKFLOW_PASSWORD=taskflow123
```

Return to the repository root after installation:

```bash
cd ../..
```

IBM Bob loads the project MCP configuration from:

```text
.bob/mcp.json
```

---

## Commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install TaskFlow application dependencies |
| `npm run setup` | Create and seed the SQLite database if it is empty |
| `npm run dev` | Start the React client and Express API together |
| `npm test` | Run backend API tests |
| `npm run build` | Build the production frontend |
| `NODE_ENV=production npm start` | Serve the API and an existing frontend build on port 3001 |
| `node --check mcp/taskflow-mcp/index.js` | Validate the MCP server JavaScript syntax |

---

## Application Configuration

TaskFlow intentionally keeps configuration simple.

Available application environment variables include:

```text
API_PORT
PORT
DATABASE_PATH
```

The MCP server uses:

```text
TASKFLOW_API_URL
TASKFLOW_EMAIL
TASKFLOW_PASSWORD
```

---

## Project Structure

The final BOB IN SYNC project is organized around one primary workflow and one TaskFlow integration.

```text
taskflow/
├── .bob/
│   ├── skills/
│   │   └── change-workflow/
│   │       └── SKILL.md
│   └── mcp.json
│
├── mcp/
│   └── taskflow-mcp/
│       ├── index.js
│       ├── package.json
│       ├── .env.example
│       └── README.md
│
├── docs/
│   ├── overview.md
│   ├── api.md
│   ├── developer-onboarding.md
│   └── change-log/
│
├── bob_sessions/
│
├── server/
├── src/
├── data/
├── AGENTS.md
├── package.json
└── README.md
```

---

## Documentation

Additional documentation is available in:

- [`docs/overview.md`](docs/overview.md) — application architecture and structure
- [`docs/api.md`](docs/api.md) — TaskFlow REST API reference
- [`docs/developer-onboarding.md`](docs/developer-onboarding.md) — developer onboarding information
- [`docs/change-log/`](docs/change-log/) — compact change records created during maintenance work

---

## Evidence and Bob Sessions

Hackathon evidence and IBM Bob execution artifacts can be stored under:

```text
bob_sessions/
```

This area can contain:

- IBM Bob Task Summary screenshots
- MCP execution evidence
- Change Brief evidence
- human approval checkpoints
- implementation and validation evidence
- final demo screenshots

A final demo evidence set can be organized as:

```text
bob_sessions/final-demo/
├── 01_taskflow_request.png
├── 02_bob_starts_work.png
├── 03_taskflow_in_progress.png
├── 04_change_brief.png
├── 05_human_approval.png
├── 06_implementation_validation.png
└── 07_application_result.png
```

---

## Example BOB IN SYNC Flow

A typical interaction can begin with:

```text
I get TF-0010.
```

IBM Bob then follows a flow similar to:

```text
Retrieve TF-0010
      ↓
Start work in TaskFlow
      ↓
Owner = IBM Bob
Status = IN_PROGRESS
Comment added
      ↓
Retrieve business context
      ↓
Inspect relevant application areas
      ↓
Generate Change Brief
      ↓
Developer reviews approach
      ↓
Explicit implementation approval
      ↓
Implement change
      ↓
Run tests / build
      ↓
Synchronize affected documentation
```

This demonstrates that the workflow connects business intent, system-of-record visibility, code understanding, implementation, and governance.

---

## Design Principles

### Developer in Control

Bob can understand, investigate, and propose changes, but implementation requires human approval.

### System of Record Stays Synchronized

The moment active work begins, TaskFlow reflects that activity.

### Business Intent Comes from the Request

Bob uses the ticket and its clarifications as the source for expected business behavior.

### Technical Truth Comes from the Application

Bob inspects the current code, tests, schema, APIs, and documentation instead of relying on assumptions.

### Minimal Process

The workflow favors concise summaries and direct interaction instead of generating large amounts of process documentation.

### Validation Before Claims

Bob should not claim that an implementation succeeded unless the project's validation commands actually succeed.

### Delivery Governance Remains Intact

Development completion does not automatically mean business completion.

QA, homologation, and production promotion remain outside the automatic Bob workflow.

---

## What BOB IN SYNC Demonstrates

The project demonstrates how IBM Bob can move beyond isolated code generation and participate in a realistic enterprise software maintenance process.

BOB IN SYNC shows IBM Bob working across:

```text
Request understanding
        +
TaskFlow integration
        +
MCP
        +
Bob Skills
        +
Code understanding
        +
Human approval
        +
Implementation
        +
Testing
        +
Documentation
```

The result is a workflow where code, application knowledge, business requests, and developers stay synchronized.

---

## BOB IN SYNC

> **Understand. Change. Document. In Sync.**

**Code, knowledge and developers in sync.**
