# BOB IN SYNC — TaskFlow

TaskFlow is a small internal IT maintenance request management application used as the reference application for **BOB IN SYNC**, our IBM TechXchange 2026 Hackathon project.

The application represents a realistic software maintenance environment where analysts register change requests and developers investigate, implement, validate, and document them.

**BOB IN SYNC** extends this workflow by connecting **IBM Bob** directly to TaskFlow, the application source code, and a continuously maintained **Solution Guide**.

> **From ticket to working code, with the developer in control.**

BOB IN SYNC turns IBM Bob into an interactive change companion that helps developers understand unfamiliar applications, synchronize work with the system of record, assess requested changes, implement them safely, validate results, and continuously maintain the technical knowledge that future developers and future Bob sessions use.

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
- new squad members repeatedly rediscovering the same architecture and operational knowledge

BOB IN SYNC addresses this gap by placing IBM Bob directly inside the maintenance workflow and by maintaining a reusable **living knowledge layer** for the application.

Instead of operating only as a coding assistant, Bob becomes a bridge between:

```text
Business Request
      +
System of Record
      +
Living Solution Knowledge
      +
Source Code
      +
Developer
```

The goal is to make software changes easier to understand, safer to implement, more traceable, and easier for future squad members to continue.

---

## Solution Overview

BOB IN SYNC combines:

- **TaskFlow** — the system of record for maintenance requests
- **IBM Bob** — the AI-powered software development environment
- **Change Workflow Skill** — guides a requested software change from ticket context to validated implementation
- **Solution Knowledge Skill** — creates and continuously maintains the application Solution Guide
- **Solution Guide** — living technical knowledge used for onboarding and as the first technical orientation for future changes
- **Model Context Protocol (MCP)** — integration between IBM Bob and TaskFlow
- **Application source code** — React, Node.js, Express, REST APIs, and SQLite
- **Human-in-the-loop approval** — the developer remains in control before application code is changed
- **Automated validation** — existing tests and build commands are used to validate implementations
- **Knowledge synchronization** — architecture, flows, risks, statistics, onboarding guidance, and other affected solution knowledge evolve together with the application

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
Solution Guide
      ↓
Current Code Validation
      ↓
Change Workflow Skill
      ↓
Change Brief
      ↓
Human Approval
      ↓
Implementation
      ↓
Tests / Build
      ↓
Solution Knowledge Skill
      ↓
Solution Guide Updated
```

This allows every new change to start with maintained application knowledge instead of rediscovering the system from scratch.

---

## Living Solution Knowledge

The living technical reference for TaskFlow is:

```text
docs/solution-guide/SOLUTION_GUIDE.md
```

The Solution Guide is designed to support both:

- onboarding of new developers and squad members
- technical orientation for every software change handled through BOB IN SYNC

It contains structured information about:

- solution purpose and target users
- technology stack
- application architecture
- operational flows
- core components
- critical areas and change risks
- data model
- APIs and integrations
- MCP capabilities
- Bob Skills
- repository-derived statistics
- testing and validation
- developer onboarding
- change impact guidance
- known risks and technical considerations
- recent solution evolution
- knowledge validation metadata

### Source of Truth

The Solution Guide is the preferred starting point for technical understanding, but it is **not** allowed to override the current implementation.

The current:

```text
source code
tests
database schema
configuration
runtime behavior
```

remain the technical source of truth.

When Bob works on a ticket, it uses the Solution Guide for orientation and then validates the relevant information against the current repository.

If a discrepancy is found, the current implementation is treated as authoritative and the guide must be corrected.

---

## How IBM Bob Is Used

A developer can start working on a TaskFlow request directly from IBM Bob using natural language such as:

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
7. retrieves ticket comments and relevant business context
8. checks whether the Solution Guide exists
9. creates the Solution Guide through `solution-knowledge` if it does not yet exist
10. reads the relevant Solution Guide sections
11. validates those sections against the current source code, tests, schema, and configuration
12. inspects only the application areas relevant to the requested change
13. produces a concise **Change Brief**
14. presents confirmed business rules, impact, risk, and a suggested approach
15. asks the developer what to do next
16. requires explicit human approval before modifying application code
17. implements the change when approved
18. runs the project's validation commands
19. invokes `solution-knowledge` after successful validation
20. updates only the Solution Guide sections affected by the change
21. maintains a compact change record when appropriate

When active work starts, TaskFlow records:

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

When the developer asks Bob to actively work on a ticket, TaskFlow is synchronized immediately.

However, IBM Bob does **not** modify application code until the developer explicitly approves implementation.

```text
Developer starts work
        ↓
TaskFlow is synchronized
        ↓
Solution Guide is loaded
        ↓
Current implementation is validated
        ↓
Bob produces the Change Brief
        ↓
Developer reviews the approach
        ↓
Explicit approval
        ↓
Code implementation
```

BOB IN SYNC also does **not** automatically mark tickets as `RESOLVED` or `CLOSED`.

The ticket remains `IN_PROGRESS` after Bob finishes development because implementation is only one part of the enterprise delivery lifecycle.

QA validation, homologation, and production promotion remain part of the organization's normal delivery process.

---

## Bob Skills

BOB IN SYNC intentionally uses two focused Skills.

```text
change-workflow
      +
solution-knowledge
```

Each Skill has one clear responsibility.

---

## Change Workflow Skill

Location:

```text
.bob/skills/change-workflow/SKILL.md
```

The `change-workflow` Skill acts as an interactive software change companion.

Its responsibilities include:

- detect active work intent
- retrieve the originating TaskFlow request
- synchronize the start of work through MCP
- ensure the Solution Guide exists
- use the Solution Guide as initial technical orientation
- validate relevant knowledge against the current implementation
- understand the business request
- identify material business ambiguities
- inspect only relevant application components
- review source code, tests, schema, APIs, configuration, and documentation when required
- use focused subagents when parallel investigation provides real value
- create a concise Change Brief
- identify implementation impact
- classify implementation risk
- suggest a short implementation approach
- keep the developer in control
- require explicit approval before code changes
- implement focused changes
- run tests and build validation
- invoke `solution-knowledge` after successful implementation
- maintain a compact change record when appropriate

The Skill is intentionally lightweight.

It avoids the unnecessary creation of separate readiness, impact-analysis, acceptance-criteria, and implementation-plan documents by default.

---

## Solution Knowledge Skill

Location:

```text
.bob/skills/solution-knowledge/SKILL.md
```

The `solution-knowledge` Skill maintains the living technical knowledge of the application.

Its primary artifact is:

```text
docs/solution-guide/SOLUTION_GUIDE.md
```

The Skill can:

- create the Solution Guide when it does not exist
- validate the guide against the current repository
- update the guide after a validated application change
- provide onboarding context to a new developer
- recalculate repository-derived statistics
- explain architecture, critical areas, and operational flows
- maintain recent solution evolution
- update knowledge validation metadata

When the guide does not exist, `solution-knowledge` becomes the first technical activity before detailed ticket analysis.

After a change is implemented and validated, the Skill updates only the sections that were actually affected.

This prevents documentation drift without rewriting the complete document after every ticket.

---

## Change Brief

Before implementation, Bob generates a compact Change Brief:

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

Bob then asks:

```text
1. Clarify or discuss the change
2. Show a more detailed implementation plan
3. Prepare to implement
4. Stop
```

This keeps the workflow interactive instead of forcing a rigid development process.

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

It provides IBM Bob with controlled access to TaskFlow without requiring Bob to interact directly with the SQLite implementation.

### Available MCP Tools

#### `list_open_tickets`

Retrieves TaskFlow tickets currently in `OPEN` status.

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

#### `get_ticket_comments`

Retrieves discussion and business clarifications associated with a ticket.

#### `start_work_on_ticket`

Synchronizes the beginning of active development work with TaskFlow.

```text
Owner   → IBM Bob
Status  → IN_PROGRESS
Comment → IBM Bob started working on this request through BOB IN SYNC.
```

The operation is designed to be idempotent.

If the ticket is already assigned to IBM Bob and already marked `IN_PROGRESS`, the MCP server avoids duplicate work-start updates and comments.

As IBM Bob has the Developer role, it can claim unassigned tickets and continue tickets already assigned to IBM Bob. It refuses to take work currently assigned to another user.

---

## MCP Authentication

The MCP server authenticates against the TaskFlow REST API using the dedicated local IBM Bob user:

```text
Email: ibm.bob@taskflow.local
Password: taskflow123
```

This makes MCP actions visible and traceable as IBM Bob activity inside TaskFlow.

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

The `.env` file should not be committed.

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
- living solution knowledge
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

Pending forward-only migrations from `server/database/migrations/` are applied automatically by both setup and server startup. Applied versions are recorded in `schema_migrations`; add a new numbered SQL file for every future schema change.

The application currently stores:

```text
users
tickets
comments
password_reset_tokens
schema_migrations
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

Install MCP dependencies:

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

Return to the repository root:

```bash
cd ../..
```

IBM Bob loads the project MCP configuration from:

```text
.bob/mcp.json
```

---

## Initialize the Solution Guide

The repository includes the `solution-knowledge` Skill and a bootstrap Solution Guide.

After installing or cloning the project, ask IBM Bob to validate it against the current repository:

```text
Validate and initialize the TaskFlow Solution Guide using the current repository.

Calculate all repository-derived statistics, validate the architecture,
operational flows, critical areas, data model, APIs, MCP integration,
Bob Skills, testing guidance, onboarding guidance, and change impact guidance.

Correct any bootstrap information in docs/solution-guide/SOLUTION_GUIDE.md
that does not match the current implementation.

Update Knowledge Metadata with the current validation date and repository commit
when available.

Do not modify application code.
```

The expected result is:

- architecture validated against the repository
- repository statistics calculated
- critical areas confirmed
- onboarding guidance refreshed
- knowledge metadata updated
- bootstrap placeholders removed
- future ticket workflows able to use the guide as their starting context

---

## Commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install TaskFlow dependencies |
| `npm run setup` | Apply database migrations and seed the database if it is empty |
| `npm run dev` | Start the React client and Express API together |
| `npm test` | Run backend API tests |
| `npm run build` | Build the production frontend |
| `NODE_ENV=production npm start` | Serve the API and an existing frontend build on port 3001 |
| `node --check mcp/taskflow-mcp/index.js` | Validate MCP server JavaScript syntax |

---

## Application Configuration

TaskFlow intentionally keeps configuration simple.

Application environment variables include:

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

```text
taskflow/
├── .bob/
│   ├── skills/
│   │   ├── change-workflow/
│   │   │   └── SKILL.md
│   │   └── solution-knowledge/
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
│   ├── solution-guide/
│   │   └── SOLUTION_GUIDE.md
│   ├── change-log/
│   ├── overview.md
│   ├── api.md
│   └── developer-onboarding.md
│
├── bob_sessions/
├── server/
├── src/
├── data/
├── AGENTS.md
├── package.json
└── README.md
```

---

## Documentation

### Primary Living Knowledge

[`docs/solution-guide/SOLUTION_GUIDE.md`](docs/solution-guide/SOLUTION_GUIDE.md)

The preferred first technical reference for onboarding and ticket analysis.

It includes architecture, operational flows, core components, critical areas, repository statistics, testing guidance, onboarding, risks, and change impact guidance.

### Additional Documentation

- [`docs/overview.md`](docs/overview.md) — application structure and supporting architecture information
- [`docs/api.md`](docs/api.md) — TaskFlow REST API reference
- [`docs/developer-onboarding.md`](docs/developer-onboarding.md) — supporting developer onboarding information
- [`docs/change-log/`](docs/change-log/) — compact records of implemented changes

---

## Onboarding a New Squad Member

A recommended reading order is:

```text
README.md
   ↓
docs/solution-guide/SOLUTION_GUIDE.md
   ↓
docs/overview.md
   ↓
docs/api.md
   ↓
change-workflow Skill
   ↓
relevant source code and tests
```

The Solution Guide should help a new developer quickly understand:

- what TaskFlow does
- how the architecture is organized
- what is core
- what is critical
- which areas have higher change risk
- how data flows through the system
- how TaskFlow integrates with IBM Bob
- how changes should be approached
- which validation is expected

A developer can also ask IBM Bob to use the `solution-knowledge` Skill for a focused onboarding explanation.

---

## Continuous Knowledge Synchronization

After successful implementation and validation, `change-workflow` invokes `solution-knowledge`.

The Skill evaluates whether the change affects:

```text
architecture
operational flows
core components
critical areas
data model
APIs
MCP integration
repository statistics
testing guidance
onboarding guidance
change impact guidance
known risks
recent solution evolution
```

Only affected sections are updated.

Example:

```text
Application Change
      ↓
Tests / Build PASS
      ↓
solution-knowledge
      ↓
Affected Solution Guide sections updated
      ↓
Statistics recalculated when necessary
      ↓
Knowledge Metadata refreshed
```

This creates the central BOB IN SYNC idea:

> **Every change makes the application and its knowledge evolve together.**

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
- Solution Guide creation or synchronization evidence
- human approval checkpoints
- implementation and validation evidence
- final demo screenshots

A final demo evidence set can be organized as:

```text
bob_sessions/final-demo/
├── 01_taskflow_request.png
├── 02_bob_starts_work.png
├── 03_taskflow_in_progress.png
├── 04_solution_guide_context.png
├── 05_change_brief.png
├── 06_human_approval.png
├── 07_implementation_validation.png
├── 08_solution_guide_updated.png
└── 09_application_result.png
```

---

## Example BOB IN SYNC Flow

A typical interaction begins with:

```text
I get TF-0010.
```

IBM Bob then follows:

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
Load Solution Guide
      ↓
Validate relevant knowledge against current code
      ↓
Inspect affected application areas
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
Update Solution Guide
      ↓
Maintain compact change record
```

This connects business intent, system-of-record visibility, living application knowledge, code understanding, implementation, validation, and governance.

---

## Design Principles

### Developer in Control

Bob can understand, investigate, and propose changes, but implementation requires human approval.

### System of Record Stays Synchronized

The moment active work begins, TaskFlow reflects that activity.

### Living Knowledge Before Rediscovery

Future developers and future Bob sessions begin with a maintained Solution Guide instead of repeatedly rediscovering the application.

### Business Intent Comes from the Request

Bob uses the ticket and its clarifications as the source for expected business behavior.

### Technical Truth Comes from the Application

The current code, tests, schema, configuration, and runtime behavior remain authoritative.

### Knowledge Evolves with Code

After validated changes, affected Solution Guide sections are automatically synchronized.

### Minimal Process

The workflow favors concise summaries and useful living knowledge instead of large volumes of process documentation.

### Validation Before Claims

Bob does not claim an implementation succeeded unless the required validation actually succeeds.

### Delivery Governance Remains Intact

Development completion does not automatically mean business completion.

QA, homologation, and production promotion remain outside the automatic Bob workflow.

---

## What BOB IN SYNC Demonstrates

BOB IN SYNC demonstrates how IBM Bob can move beyond isolated code generation and participate in a realistic enterprise software maintenance lifecycle.

```text
Request Understanding
        +
TaskFlow Integration
        +
MCP
        +
Change Workflow Skill
        +
Solution Knowledge Skill
        +
Living Solution Guide
        +
Code Understanding
        +
Human Approval
        +
Implementation
        +
Testing
        +
Knowledge Synchronization
```

The result is a workflow where the business request, system of record, code, technical knowledge, and developers remain synchronized.

A new squad member no longer needs to start from zero, and a new change no longer depends only on undocumented knowledge from previous developers.

---

## BOB IN SYNC

> **Understand. Change. Document. In Sync.**

**Code, knowledge and developers in sync.**
