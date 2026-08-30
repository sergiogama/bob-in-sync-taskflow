---
name: change-readiness-check
description: >-
  Evaluates whether a maintenance request, bug, or change request contains
  enough clear and consistent business information to proceed safely into
  technical impact analysis and the development pipeline.
---

# Change Readiness Check

Evaluate whether a maintenance request, bug, or change request contains enough business information to proceed safely into technical impact analysis.

This skill is a quality gate before change-impact-analysis.

Do not perform technical impact analysis.
Do not create an implementation plan.
Do not modify application code.

## Sources of Truth

If a TaskFlow ticket reference is provided and TaskFlow MCP tools are available, retrieve the complete ticket and all comments directly from TaskFlow before evaluating readiness.

The ticket description and approved comments are the primary sources of truth for business requirements.

Later approved comments override earlier assumptions or conflicting information.

Do not invent business requirements to make an incomplete ticket appear ready.

## Readiness Philosophy

A request does not need to be large or highly detailed to be READY.

Simple changes may require only a clear objective and observable expected behavior.

Do not penalize a request for missing technical implementation details that can reasonably be determined during technical analysis.

Only identify missing information as blocking when it materially affects:

- expected business behavior
- observable user behavior
- scope of the requested change
- business rules
- data behavior
- compatibility expectations
- acceptance of the resulting change

Distinguish business ambiguity from technical design decisions.

Technical implementation choices must not cause a request to be classified as NOT_READY unless the business outcome itself cannot be determined without them.

## Evaluate

For every request, evaluate:

1. Business objective
   - Is the problem or desired outcome understandable?

2. Requested behavior
   - Is it clear what should change from the user's or business perspective?

3. Scope
   - Is the requested scope sufficiently bounded?
   - Are there statements that could represent substantially different implementations?

4. Business rules
   - Are required values, conditions, transitions, or calculations defined when they materially affect behavior?

5. User-visible outcome
   - Can a developer or tester determine whether the change works?

6. Existing-data behavior
   - If the change affects existing records or data, is the expected behavior sufficiently clear?

7. State-transition behavior
   - If the feature changes state over time, are important transitions defined?

8. Backward compatibility
   - If existing behavior may be affected, is the intended compatibility expectation known?

9. Conflicts
   - Do the ticket description or comments contain conflicting requirements?

10. Remaining ambiguity
   - Separate business questions from technical implementation choices.

## Readiness Classification

Assign exactly one status:

### READY

Use when there is enough confirmed business information to proceed with technical impact analysis.

Minor implementation choices or normal technical design decisions do not prevent READY status.

### READY_WITH_CLARIFICATIONS

Use when technical impact analysis can proceed safely, but one or more non-blocking business questions remain.

The unresolved items must be explicitly documented and must not silently become implementation assumptions.

### NOT_READY

Use when material missing or conflicting business information could significantly change the scope, expected behavior, data behavior, or acceptance of the change.

Technical impact analysis should not proceed until the blocking questions are answered.

## Questions

When clarification is required:

- Ask only questions that materially affect the requested behavior.
- Keep questions concise and understandable by a business requester.
- Do not ask implementation questions that should be decided by developers.
- Explain briefly why each question matters.

## Final Output

Use this structure:

# Change Readiness Assessment

## Change Request

## Business Objective

## Confirmed Requirements

## Approved Business Rules

## Readiness Evaluation

| Area | Status | Notes |
|---|---|---|
| Business Objective | CLEAR / PARTIAL / MISSING | |
| Requested Behavior | CLEAR / PARTIAL / MISSING | |
| Scope | CLEAR / PARTIAL / MISSING | |
| Business Rules | CLEAR / PARTIAL / MISSING / NOT_APPLICABLE | |
| Existing Data Behavior | CLEAR / PARTIAL / MISSING / NOT_APPLICABLE | |
| State Transitions | CLEAR / PARTIAL / MISSING / NOT_APPLICABLE | |
| Backward Compatibility | CLEAR / PARTIAL / MISSING / NOT_APPLICABLE | |
| Conflicts | NONE / FOUND | |

## Missing Information

## Business Questions

## Technical Decisions That Do Not Block Readiness

## Readiness Status

READY / READY_WITH_CLARIFICATIONS / NOT_READY

## Readiness Rationale

## Next Recommended Action

If READY:
Proceed to change-impact-analysis.

If READY_WITH_CLARIFICATIONS:
Proceed to change-impact-analysis while explicitly tracking the listed clarifications. Do not convert them into approved requirements.

If NOT_READY:
Return the business questions to the requester before technical impact analysis.

Save the assessment under:

docs/change-readiness/

Use the ticket reference as the filename when available, for example:

docs/change-readiness/TF-0015.md
