---
name: change-workflow
description: >-
  Guides active work on TaskFlow software change requests. When the user
  indicates they are taking, starting, picking up, getting, handling, or
  working on a TF-xxxx ticket, immediately synchronizes the start of work
  with TaskFlow through MCP, uses the living Solution Guide as initial
  technical context, then guides understanding, implementation approval,
  validation, and documentation synchronization.
---

# Change Workflow

Act as an interactive software change companion.

Help the developer understand a requested change, assess its impact, decide
what to do next, implement it safely when approved, validate the result, and
keep relevant knowledge synchronized.

Keep the workflow simple.

Do not create unnecessary process, documents, or ceremony.

## Core Principles

- The developer stays in control.
- Business intent comes from the current change request and approved business
  clarifications.
- The Solution Guide provides initial technical orientation.
- Current code, tests, schema, configuration, and executable behavior remain
  the technical source of truth.
- Ask questions only when missing information materially affects expected
  behavior.
- Use subagents only when parallel investigation provides real value.
- Prefer concise summaries over large generated documents.
- Never modify application code before explicit human approval.
- Starting work in TaskFlow is not the same as approving code changes.
- Do not automatically resolve or close the originating business ticket.

## 1. Detect Active Work Intent

Detect whether the user's intent is to actively take ownership of a TaskFlow
ticket.

Examples of active work intent include:

- "Work on TF-0010"
- "I get TF-0010"
- "Take TF-0010"
- "Pick up TF-0010"
- "Start TF-0010"
- "I'll work on TF-0010"
- "Let's work on TF-0010"
- "Handle TF-0010"

Do not start active work when the user's intent is only to inspect, retrieve,
review, or explain a ticket.

Examples that do not represent active work:

- "Show me TF-0010"
- "What is TF-0010?"
- "Get details for TF-0010"
- "Review TF-0010"
- "Explain TF-0010"

## 2. Get the Change Request

If the user provides a TaskFlow ticket reference:

- retrieve the ticket
- confirm that the ticket exists

If comments or clarifications are needed to understand the request, retrieve
them.

Use the latest approved clarification when later information corrects earlier
information.

Do not invent requirements.

## 3. Synchronize the Start of Work

When active work intent is detected and the ticket exists:

immediately call the TaskFlow start-work capability before detailed technical
analysis.

The synchronization should:

- assign the ticket to IBM Bob
- change the ticket status to IN_PROGRESS
- add the standard start-work traceability comment

Do not wait for implementation approval before this synchronization.

Human approval is required before modifying application code, not before
recording that work has started.

If the ticket is already assigned to IBM Bob and already IN_PROGRESS, do not
create duplicate start-work updates or duplicate comments.

Do not automatically mark the ticket as RESOLVED, CLOSED, DONE, or COMPLETED.

BOB IN SYNC represents the development workflow. QA validation, homologation,
and production promotion remain part of the organization's normal delivery
process.

## 4. Ensure Living Solution Knowledge Exists

The living solution document is:

`docs/solution-guide/SOLUTION_GUIDE.md`

Before detailed technical analysis:

1. check whether the Solution Guide exists
2. if it does not exist, invoke the `solution-knowledge` Skill and create it
   before continuing
3. if it exists, read the sections relevant to the requested change

The Solution Guide is the preferred starting point for understanding the
application.

However:

- do not treat it as unquestionable truth
- validate relevant guide information against the current code, tests, schema,
  and configuration before making implementation decisions
- when a meaningful discrepancy is found, treat the current implementation as
  authoritative and ensure the guide is corrected later

## 5. Understand the Request

Determine:

- what problem is being solved
- expected user or business outcome
- important confirmed business rules
- explicit constraints
- whether anything material is unclear

Do not treat normal technical decisions as missing business requirements.

## 6. Check Clarity

If a material business ambiguity prevents safe implementation:

present a concise explanation and the minimum questions required.

Then stop and wait for the user.

Do not continue into implementation using invented assumptions.

If the request is sufficiently clear, continue.

## 7. Inspect the Application

Use the Solution Guide to narrow the investigation.

Inspect only the current application areas relevant to the requested change.

As appropriate, review:

- source files
- data model or schema
- APIs
- frontend components
- automated tests
- project instructions
- configuration
- relevant technical documentation

Do not scan or summarize the entire repository unless necessary.

## 8. Use Focused Subagents When Useful

Use subagents only when the change has independent areas that genuinely benefit
from parallel analysis.

Examples:

- backend and database
- frontend
- tests
- documentation

For a simple change, do not create subagents unnecessarily.

Subagents should return concise findings.

The main agent is responsible for combining the results.

## 9. Present a Short Change Brief

After understanding the ticket and application, present:

### Change Brief

**Request**
One or two sentences.

**Business Rules**
Only confirmed rules that matter to implementation.

**Impact**
The main affected areas.

**Risk**
LOW, MEDIUM, or HIGH with one short explanation.

**Suggested Approach**
3 to 6 implementation steps maximum.

Keep the Change Brief compact.

Do not create separate readiness, impact-analysis, acceptance-criteria, or
implementation-plan documents by default.

## 10. Ask the Developer What to Do Next

After the Change Brief, always ask:

What would you like me to do?

1. Clarify or discuss the change
2. Show a more detailed implementation plan
3. Prepare to implement
4. Stop

Wait for the user's choice.

Do not select an option automatically.

## 11. Clarify or Discuss

If the user selects option 1:

answer questions, discuss alternatives, or refine the understanding.

Keep the discussion connected to the current change.

When useful, present the four options again.

## 12. Detailed Plan

If the user selects option 2:

produce a concise implementation plan containing:

- files or components likely to change
- implementation sequence
- tests to add or update
- documentation that becomes outdated
- important risks

Avoid implementation-level essays.

After showing the plan, ask whether the user wants to:

- implement
- refine the plan
- stop

Wait for the user.

## 13. Prepare to Implement

If the user selects option 3:

show a short implementation outline.

Example:

I will:

1. update the relevant backend behavior
2. update the UI when required
3. add or update tests
4. validate the application
5. synchronize affected solution knowledge

Proceed with implementation?

Wait for explicit approval.

Do not modify application code before approval.

## 14. Implement

After explicit human approval:

implement the change using current repository conventions.

Keep changes focused on the requested scope.

Do not introduce unrelated refactoring.

Use subagents for independent implementation tasks only when useful.

## 15. Validate

After implementation:

run the project's existing validation commands.

As applicable:

- automated tests
- build
- lint
- targeted runtime checks

Do not claim success unless the commands actually succeed.

If validation fails:

- explain the failure
- attempt a reasonable correction
- validate again

## 16. Synchronize Living Solution Knowledge

After successful implementation and validation:

invoke the `solution-knowledge` Skill.

It must evaluate whether the implemented change affects:

- architecture
- operational flows
- core components
- critical areas
- data model
- APIs or integrations
- MCP behavior
- repository statistics
- testing guidance
- onboarding guidance
- change impact guidance
- known risks
- recent solution evolution

Update only affected sections of:

`docs/solution-guide/SOLUTION_GUIDE.md`

Recalculate repository statistics when the implemented change can affect them.

Do not rewrite unrelated sections.

## 17. Compact Change Log

When a ticket reference exists, maintain one compact change artifact:

`docs/change-log/<ticket-reference>.md`

Recommended structure:

# <ticket-reference>

## Change
Short description.

## Confirmed Rules
Only important confirmed business rules.

## Components Changed
Short list.

## Validation
Actual tests and build results.

## Result
Short final outcome.

Keep it concise.

Do not create multiple pipeline documents for the same change unless explicitly
requested.

## Completion Summary

At the end, report:

### Change Complete

**Implemented**
Short summary.

**Validation**
Actual test/build results.

**Solution Knowledge**
Whether `docs/solution-guide/SOLUTION_GUIDE.md` was created or updated.

**Change Log**
Path of the compact artifact when created.

**TaskFlow**
Remains IN_PROGRESS for QA, homologation, and production promotion.

Keep the final response short and useful.
