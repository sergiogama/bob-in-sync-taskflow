---
name: change-impact-analysis
description: >-
  Analyzes a maintenance request, bug, or change request against the TaskFlow
  codebase to identify affected components, risks, tests, documentation, data
  model changes, and implementation considerations before any code is modified.
---

# Change Impact Analysis

Before any implementation begins, analyze the requested change against the current TaskFlow application.

The change request and its comments are the primary sources of truth for business requirements and approved clarifications.

The source code, automated tests, database schema, AGENTS.md files, and current project documentation are the primary sources of truth for the existing technical implementation.

Before creating assumptions, check whether the change request or its comments already contain an approved clarification. Approved clarifications from the request must take precedence over inferred assumptions.

Do not modify application code while executing this skill.

For every change request:

1. Restate the requested change and its expected business outcome.

2. Identify ambiguities, missing requirements, or assumptions that should be clarified before implementation.

3. Analyze impact across:
   - frontend
   - backend routes
   - controllers
   - services
   - models
   - database/schema
   - authentication and security
   - automated tests
   - existing documentation
   - local and production runtime behavior

4. Identify the exact files likely to require modification and explain why.

5. Identify dependencies between impacted components.

6. Identify backward compatibility risks and possible regression areas.

7. Evaluate whether the change requires a database migration. Remember that TaskFlow v1.0 currently does not have a migration framework.

8. Identify existing automated tests that may be affected and new tests that should be created.

9. Analyze documentation impact.

   Before deciding which documentation must change, inspect the actual documentation currently present in the repository, especially the docs/ directory and relevant AGENTS.md files.

   Identify the exact existing documentation files affected by the change and explain what information would become outdated.

   Do not use generic statements such as "API documentation if any" when an actual documentation file exists.

   For TaskFlow, explicitly verify whether changes affect documents such as:
   - docs/api.md
   - docs/developer-onboarding.md
   - docs/overview.md
   - AGENTS.md files

10. Assign a risk level:
    - LOW
    - MEDIUM
    - HIGH

    Explain the reason for the risk level.

11. Produce a recommended implementation sequence, but DO NOT implement the change.

When useful, delegate independent analysis to focused subagents so frontend, backend, database, testing, and documentation impacts can be investigated separately and consolidated into one final assessment.

The final output must use this structure:

# Change Impact Analysis

## Change Request

## Business Outcome

## Clarifications and Assumptions

## Impacted Components

## Impacted Files

## Database and Migration Impact

## API Impact

## Frontend Impact

## Testing Impact

## Documentation Impact

## Risks and Regression Areas

## Risk Level

## Recommended Implementation Sequence

## Definition of Done

Save the final analysis under:

docs/change-impact/

Use a filename that identifies the change request, for example:

docs/change-impact/TF-0014.md

Do not modify application source code unless the user explicitly approves implementation in a subsequent task.
