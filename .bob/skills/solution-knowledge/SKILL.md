---
name: solution-knowledge
description: >-
  Creates, validates, and continuously maintains the living technical knowledge
  of the current application. Produces a structured Solution Guide for developer
  onboarding and change analysis, including architecture, operational flows,
  core components, critical areas, data model, integrations, repository-derived
  statistics, testing guidance, risks, and recent solution evolution.
---

# Solution Knowledge

Act as the living knowledge maintainer for the current application.

Your primary artifact is:

`docs/solution-guide/SOLUTION_GUIDE.md`

The Solution Guide is the first technical orientation document for developers,
new squad members, and change workflows.

Keep it accurate, structured, concise enough to be useful, and grounded in the
current repository.

## Core Principles

- Current source code, schema, tests, configuration, and executable behavior are
  the technical source of truth.
- The Solution Guide is the preferred starting context, but never overrides the
  current implementation.
- Never invent architecture, statistics, dependencies, risks, or flows.
- Derive repository statistics from the current repository whenever possible.
- Prefer updating affected sections instead of rewriting the entire document.
- Keep onboarding usefulness as a primary goal.
- Document the application, not the reasoning process used to inspect it.
- Mark uncertainty explicitly when something cannot be confirmed.

## 1. Determine the Requested Operation

This Skill may be invoked to:

1. create the Solution Guide when it does not exist
2. validate the existing Solution Guide against the current repository
3. update the guide after an application change
4. provide onboarding context to a developer
5. refresh repository-derived statistics
6. explain architecture, critical areas, or operational flows using the guide
   and current code

If no explicit operation is provided:

- create the guide if it does not exist
- otherwise validate and refresh only what is stale or affected

## 2. Inspect the Current Application

Inspect enough of the repository to understand the solution accurately.

As appropriate, review:

- repository structure
- package manifests
- application entry points
- frontend routes and main components
- backend routes, controllers, services, and models
- database schema and migrations or seed logic
- authentication and authorization behavior
- REST APIs
- integrations
- MCP configuration and MCP server implementation
- Bob Skills
- automated tests
- build and validation commands
- current technical documentation
- recent change artifacts when they materially affect current architecture

Do not inspect unrelated generated files, dependencies, build output, or large
historical artifacts unless necessary.

## 3. Create or Maintain the Solution Guide

The Solution Guide must use this structure unless the application clearly
requires a small adaptation:

# <Application Name> Solution Guide

## 1. Solution at a Glance

Include:

- application purpose
- target users
- main business capabilities
- technology stack
- repository orientation
- how BOB IN SYNC participates in the solution, when applicable

## 2. Architecture

Describe the current architecture.

Include:

- high-level architecture
- frontend
- backend
- persistence
- integrations
- IBM Bob integration
- MCP integration
- Bob Skills
- important runtime boundaries

Prefer a compact text diagram when useful.

## 3. Operational Flows

Document the most important runtime and business flows.

Examples:

- authentication
- ticket creation
- assignment
- status lifecycle
- comments
- dashboard
- IBM Bob start-work synchronization
- BOB IN SYNC change workflow

For each important flow, explain:

- trigger
- main steps
- important components
- resulting state

## 4. Core Components

Identify the components that define the application's main behavior.

For each core component include:

- responsibility
- primary files or directories
- main dependencies
- why the component matters

Do not list every file in the repository.

## 5. Critical Areas

Identify areas where changes have elevated implementation or operational risk.

Use:

- LOW
- MEDIUM
- HIGH

For each critical area include:

- criticality
- reason
- main dependencies
- common change risks
- validation that should be performed after changes

Examples may include:

- authentication
- data persistence
- ticket lifecycle
- ownership
- API contracts
- database integrity
- MCP integration

Only include areas actually supported by the application.

## 6. Data Model

Describe:

- main entities or tables
- important fields
- relationships
- constraints
- lifecycle-sensitive fields

Do not duplicate the entire schema.

## 7. APIs and Integrations

Document:

- important REST API groups
- relevant endpoints
- authentication model
- MCP tools
- integration boundaries
- important request or response contracts

Prefer grouped summaries over exhaustive API duplication when another API
reference already exists.

## 8. Application Statistics

Calculate statistics directly from the current repository.

Use only metrics that can be reproduced reliably.

Examples:

- frontend components
- backend route definitions
- REST endpoints
- database tables
- automated tests
- MCP tools
- Bob Skills
- documented operational flows

For every statistic:

- state what was counted
- avoid misleading estimates
- use "not reliably derivable" when the metric cannot be calculated safely

Include a short note that statistics reflect the repository at the guide's last
validation point.

## 9. Testing and Validation

Document:

- available test commands
- build commands
- lint or static validation when available
- important testing areas
- known validation gaps

Never claim coverage that is not demonstrated by the repository.

## 10. Developer Onboarding

Create a practical onboarding path.

Include:

- prerequisites
- how to run the application
- recommended reading order
- recommended code exploration order
- where business requests enter the process
- how BOB IN SYNC should be used for changes
- where to find tests and documentation

The goal is to help a new squad member become productive quickly.

## 11. Change Impact Guidance

Provide compact guidance connecting common change types to likely affected
areas.

Example format:

| Change Type | Likely Areas | Typical Validation |
| --- | --- | --- |
| Ticket lifecycle | service, model, UI, tests | API + UI behavior |
| Data model | schema, model, service, tests, docs | migration/data + API tests |
| Dashboard metric | query/model, service, API, UI | API + dashboard |
| MCP capability | MCP server, API contract, guide | MCP call + TaskFlow state |

Only include patterns supported by the current architecture.

## 12. Known Risks and Technical Considerations

Document confirmed:

- limitations
- fragile areas
- architectural constraints
- technical debt that affects maintenance
- assumptions developers should not make

Avoid generic software-development advice.

## 13. Recent Solution Evolution

Maintain a short, curated record of meaningful solution changes.

Each entry should include:

- date
- change reference when available
- short architectural or behavioral impact

Do not turn this section into a full ticket history.

Keep only changes that help future developers understand the current solution.

## 14. Knowledge Metadata

Include:

- last validated date
- repository commit when available
- validation scope
- maintained by IBM Bob / BOB IN SYNC
- whether statistics were recalculated

## 4. Initial Creation Behavior

If `docs/solution-guide/SOLUTION_GUIDE.md` does not exist:

1. inspect the current repository
2. derive the current solution architecture and flows
3. calculate reproducible statistics
4. identify core and critical areas
5. create the complete Solution Guide
6. validate the document against the inspected implementation
7. report the created path and a short summary

Do not require a ticket before creating the guide.

The guide must be created before a change workflow performs detailed technical
analysis when the guide was previously missing.

## 5. Update Behavior After a Change

When invoked after an implemented and validated change:

1. identify which parts of the solution changed
2. compare those changes with the current Solution Guide
3. update only affected sections
4. recalculate statistics when the change can affect them
5. update Recent Solution Evolution when the change is meaningful for future
   developers
6. update Knowledge Metadata
7. validate the changed documentation against the current source code

Do not rewrite unaffected sections solely to change wording.

## 6. Onboarding Behavior

When the user asks for onboarding:

1. read the current Solution Guide
2. validate any sections that are necessary for the requested onboarding
3. present a concise onboarding path
4. point the developer to the most important files and flows
5. identify the most critical areas to understand before making changes

Do not overwhelm a new developer with the entire repository.

## 7. Statistics Rules

Statistics must be deterministic and explainable.

Prefer direct repository counts.

Examples:

- route declarations
- test cases
- database CREATE TABLE declarations
- registered MCP server tools
- Bob Skill directories
- frontend component files based on the project's actual conventions

Never create a metric because it sounds impressive.

If a statistic depends on an ambiguous definition, state the definition used.

## 8. Relationship with change-workflow

The `change-workflow` Skill should use the Solution Guide as its initial
technical orientation.

The expected relationship is:

`TaskFlow request`
→ `start-work synchronization`
→ `Solution Guide`
→ `focused code validation`
→ `Change Brief`
→ `human approval`
→ `implementation`
→ `validation`
→ `Solution Guide synchronization`

The Solution Guide accelerates understanding, but the change workflow must
still validate relevant information against the current code before making
implementation decisions.

## Completion

When creation or synchronization is complete, report:

### Solution Knowledge Updated

**Guide**
`docs/solution-guide/SOLUTION_GUIDE.md`

**Action**
Created, validated, or updated.

**Sections Changed**
Only the affected sections.

**Statistics**
Whether repository statistics were recalculated.

**Validation**
What current implementation areas were checked.

Keep the completion response concise.
