# Acceptance Criteria — TF-0014: Add Ticket Priority and SLA Management

**Ticket:** TF-0014  
**Title:** Add ticket priority and SLA management  
**Status:** OPEN  
**Requested by:** Maria Santos  
**Document status:** Revised — approved requirements strictly separated from technical proposals and open questions  
**Source of truth:** TaskFlow ticket TF-0014 (created 2026-08-30) and approved comments #9 and #10 (Maria Santos, 2026-08-30)

---

## ⚠ How to read this document

This document uses three distinct classifications. **Do not treat them interchangeably.**

| Label | Meaning |
|-------|---------|
| ✅ **Approved Requirement / Accepted AC** | Directly supported by the ticket description or an approved comment from Maria Santos. A developer or tester may implement and verify this without further approval. |
| 🔧 **Proposed Technical AC** | A technical design decision that is consistent with and necessary to implement the approved requirements, but whose exact form was not specified in the ticket or comments. It represents a recommended approach only. It must be confirmed before a tester treats it as a pass/fail criterion. |
| ❓ **Pending Business Confirmation** | An open question whose answer changes observable, verifiable behaviour. No implementation decision should be made for these items without an explicit answer from Maria Santos or an authorised stakeholder. |

Every section header and every individual criterion is labelled with one of these three categories.

---

## Table of Contents

1. [Business Objective](#1-business-objective) ✅
2. [Functional Requirements Summary](#2-functional-requirements-summary) ✅
3. [Approved Business Rules](#3-approved-business-rules) ✅
4. [Priority Values](#4-priority-values) ✅
5. [Approved AC: New Ticket Behavior](#5-approved-ac-new-ticket-behavior)
6. [Approved AC: Existing Ticket Behavior](#6-approved-ac-existing-ticket-behavior)
7. [Approved AC: Priority Change Behavior](#7-approved-ac-priority-change-behavior)
8. [Approved AC: SLA Behavior](#8-approved-ac-sla-behavior)
9. [Approved AC: Overdue Behavior](#9-approved-ac-overdue-behavior)
10. [Approved AC: Dashboard Expectations](#10-approved-ac-dashboard-expectations)
11. [Approved AC: Ticket List and Detail Pages](#11-approved-ac-ticket-list-and-detail-pages)
12. [Approved AC: Ticket Create / Edit Form](#12-approved-ac-ticket-create--edit-form)
13. [Approved AC: Backward Compatibility](#13-approved-ac-backward-compatibility)
14. [Approved AC: API Contract](#14-approved-ac-api-contract)
15. [Approved AC: Automated Tests](#15-approved-ac-automated-tests)
16. [Proposed Technical Acceptance Criteria](#16-proposed-technical-acceptance-criteria)
17. [Edge Cases](#17-edge-cases)
18. [Pending Business Confirmation](#18-pending-business-confirmation)

---

## 1. Business Objective

✅ **Approved — sourced from ticket description**

The support team requires a mechanism to classify maintenance requests by urgency so that the team can triage and respond to the most critical issues first.

Three concrete outcomes are required:

1. **Priority classification** — each ticket carries one of four priority levels (LOW, MEDIUM, HIGH, CRITICAL) so that engineers and managers can immediately understand severity.
2. **SLA enforcement for CRITICAL tickets** — a CRITICAL ticket automatically receives a 4-hour deadline from the moment the ticket is opened (or the moment it becomes CRITICAL), making SLA breach visible before it occurs.
3. **Dashboard visibility** — the dashboard exposes **separate** counts for CRITICAL tickets and OVERDUE tickets, enabling managers to act on the most urgent situations.

---

## 2. Functional Requirements Summary

✅ **Approved — all items sourced from ticket description or comment #10**

| # | Requirement | Source |
|---|-------------|--------|
| FR-1 | Add a `priority` attribute to tickets with values `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. | Ticket description |
| FR-2 | `MEDIUM` is the default priority for new tickets. | Comment #10, clause 1 |
| FR-3 | All existing tickets must be migrated to priority `MEDIUM`. | Comment #10, clause 1 |
| FR-4 | SLA applies only to CRITICAL tickets. | Comment #10, clause 2 |
| FR-5 | If a ticket is created as CRITICAL, `sla_deadline = creation_time + 4 hours`. | Comment #10, clause 3 |
| FR-6 | If an existing ticket changes to CRITICAL, `sla_deadline = priority_change_timestamp + 4 hours`. | Comment #10, clause 4 |
| FR-7 | If a CRITICAL ticket changes to LOW, MEDIUM, or HIGH, its `sla_deadline` must be cleared. | Comment #10, clause 5 |
| FR-8 | Tickets that exceed their SLA deadline without being resolved or closed must be identified as overdue. | Ticket description |
| FR-9 | The ticket list page must display the priority. | Ticket description |
| FR-10 | The ticket detail page must display the priority. | Ticket description |
| FR-11 | The dashboard must display a separate count for CRITICAL tickets. | Comment #10, clause 6 |
| FR-12 | The dashboard must display a separate count for OVERDUE tickets. | Comment #10, clause 6 |
| FR-13 | Existing tickets must continue to work correctly after this change. | Ticket description |

---

## 3. Approved Business Rules

✅ **Approved — all items sourced directly from comment #10 (Maria Santos, 2026-08-30)**

These rules are not open to interpretation. Any implementation must satisfy them exactly.

| Rule | Statement |
|------|-----------|
| BR-1 | The four valid priority values are, in ascending urgency order: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. No other values are permitted. |
| BR-2 | The default priority for a new ticket, when no priority is supplied, is `MEDIUM`. |
| BR-3 | When the database is upgraded, existing tickets that have no priority must be assigned `MEDIUM`. |
| BR-4 | SLA management (the `sla_deadline` field) is exclusive to CRITICAL tickets. LOW, MEDIUM, and HIGH tickets never have an SLA deadline. |
| BR-5 | A new CRITICAL ticket's SLA deadline is `creation_time + 4 hours` (computed at ticket creation). |
| BR-6 | When any non-CRITICAL ticket is updated to CRITICAL, the SLA deadline is `timestamp_of_that_update + 4 hours` (computed when the update is saved). |
| BR-7 | When a CRITICAL ticket is updated to any non-CRITICAL priority (LOW, MEDIUM, or HIGH), the SLA deadline is cleared to `null`. No SLA deadline is retained. |
| BR-8 | Overdue status applies when a ticket is CRITICAL, its `sla_deadline` is in the past, and its status is neither `RESOLVED` nor `CLOSED`. |
| BR-9 | The dashboard must expose CRITICAL count and OVERDUE count as **separate** metrics. They are not aggregated together. |

---

## 4. Priority Values

✅ **Approved — sourced from ticket description and comment #10**

| Value | Description | SLA Applied | Default |
|-------|-------------|-------------|---------|
| `LOW` | Lowest urgency | No | — |
| `MEDIUM` | Standard urgency | No | ✔ |
| `HIGH` | Elevated urgency | No | — |
| `CRITICAL` | Highest urgency; SLA clock active | Yes (4 h) | — |

---

## 5. Approved AC: New Ticket Behavior

### AC-NT-1 — Default priority when none is supplied ✅

**Source:** Comment #10, clause 1 (BR-2)

**Given** a user creates a ticket without specifying a priority  
**When** the ticket creation request is submitted  
**Then** the created ticket has `priority = 'MEDIUM'` and `sla_deadline = null`

---

### AC-NT-2 — Explicit LOW priority ✅

**Source:** Ticket description (FR-1), comment #10 (BR-4)

**Given** a user creates a ticket with `priority = 'LOW'`  
**When** the ticket is created  
**Then** the ticket has `priority = 'LOW'` and `sla_deadline = null`

---

### AC-NT-3 — Explicit MEDIUM priority ✅

**Source:** Ticket description (FR-1), comment #10 (BR-4)

**Given** a user creates a ticket with `priority = 'MEDIUM'`  
**When** the ticket is created  
**Then** the ticket has `priority = 'MEDIUM'` and `sla_deadline = null`

---

### AC-NT-4 — Explicit HIGH priority ✅

**Source:** Ticket description (FR-1), comment #10 (BR-4)

**Given** a user creates a ticket with `priority = 'HIGH'`  
**When** the ticket is created  
**Then** the ticket has `priority = 'HIGH'` and `sla_deadline = null`

---

### AC-NT-5 — CRITICAL ticket triggers SLA calculation ✅

**Source:** Comment #10, clause 3 (BR-5)

**Given** a user creates a ticket with `priority = 'CRITICAL'`  
**When** the ticket is created  
**Then** the ticket has `priority = 'CRITICAL'`  
**And** `sla_deadline` is set to a value equal to `created_at + 4 hours`  
**And** `sla_deadline` is not null

> **Note on test tolerance:** Because the SLA deadline is computed server-side at creation, a test comparing `sla_deadline` to `created_at + 4 hours` should allow a small clock tolerance (e.g. ±5 seconds) to account for processing time. This is a testing implementation detail, not a business requirement.

---

### AC-NT-6 — Invalid priority is rejected ✅

**Source:** Comment #10, clause 1 (BR-1) — only `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` are valid

**Given** a user submits a ticket creation request with an unrecognised priority value (e.g. `'URGENT'`, `'P1'`)  
**When** the server processes the request  
**Then** the server responds with HTTP 400  
**And** no ticket is created

> **Note:** The exact error message wording is a 🔧 technical decision. See TECH-3 in Section 16.

---

## 6. Approved AC: Existing Ticket Behavior

### AC-ET-1 — All existing tickets migrated to MEDIUM priority ✅

**Source:** Comment #10, clause 1 (BR-3)

**Given** a database that was created before TF-0014 was implemented (tickets have no `priority` column)  
**When** the application starts and the migration runs  
**Then** every existing ticket has `priority = 'MEDIUM'`  
**And** every existing ticket has `sla_deadline = null`

---

### AC-ET-2 — Seed data tickets have MEDIUM priority ✅

**Source:** Comment #10, clause 1 (BR-2, BR-3)

**Given** the test database is seeded with the standard 12 seed tickets  
**When** the seed completes  
**Then** all 12 seed tickets have `priority = 'MEDIUM'`  
**And** all 12 seed tickets have `sla_deadline = null`

---

### AC-ET-3 — Existing tickets remain readable and editable ✅

**Source:** Ticket description (FR-13)

**Given** an existing ticket that was migrated to `priority = 'MEDIUM'`  
**When** a user reads the ticket detail or edits the ticket  
**Then** the ticket loads correctly, displaying all previous fields plus the new `priority` field  
**And** the user can edit the ticket without any errors caused by the migration

---

## 7. Approved AC: Priority Change Behavior

### AC-PC-1 — Non-CRITICAL to CRITICAL: SLA deadline is set ✅

**Source:** Comment #10, clause 4 (BR-6)

**Given** an existing ticket with `priority = 'MEDIUM'` (or `'LOW'` or `'HIGH'`) and `sla_deadline = null`  
**When** the ticket is updated so that `priority = 'CRITICAL'`  
**Then** `sla_deadline` is set to the priority-change timestamp + 4 hours  
**And** `sla_deadline` reflects the timestamp at which the priority change was saved, not the original creation time

---

### AC-PC-2 — CRITICAL to MEDIUM: SLA deadline is cleared ✅

**Source:** Comment #10, clause 5 (BR-7)

**Given** an existing CRITICAL ticket with a non-null `sla_deadline`  
**When** the ticket is updated so that `priority = 'MEDIUM'`  
**Then** `sla_deadline` becomes `null`

---

### AC-PC-3 — CRITICAL to LOW: SLA deadline is cleared ✅

**Source:** Comment #10, clause 5 (BR-7)

**Given** an existing CRITICAL ticket with a non-null `sla_deadline`  
**When** the ticket is updated so that `priority = 'LOW'`  
**Then** `sla_deadline` becomes `null`

---

### AC-PC-4 — CRITICAL to HIGH: SLA deadline is cleared ✅

**Source:** Comment #10, clause 5 (BR-7)

**Given** an existing CRITICAL ticket with a non-null `sla_deadline`  
**When** the ticket is updated so that `priority = 'HIGH'`  
**Then** `sla_deadline` becomes `null`

---

### AC-PC-5 — Priority update without status change: SLA logic still applies ✅

**Source:** Comment #10, clauses 4 and 5 (BR-6, BR-7) — the rules state transitions trigger SLA changes unconditionally; no status precondition is mentioned

**Given** an existing OPEN ticket with `priority = 'LOW'`  
**When** the ticket is updated and only the `priority` field changes to `'CRITICAL'` (status, title, description remain unchanged)  
**Then** `sla_deadline` is set to the update timestamp + 4 hours  
**And** all other ticket fields are preserved

---

## 8. Approved AC: SLA Behavior

### AC-SLA-1 — SLA only applies to CRITICAL tickets ✅

**Source:** Comment #10, clause 2 (BR-4)

**Given** tickets with priorities `LOW`, `MEDIUM`, and `HIGH`  
**Then** all such tickets have `sla_deadline = null` regardless of their status or age

---

### AC-SLA-2 — SLA deadline is computed server-side ✅

**Source:** Comment #10, clauses 3 and 4 (BR-5, BR-6) — the rules define the deadline as computed from server timestamps (creation time and priority-change timestamp); these are server-side values

**Given** a CRITICAL ticket is created or a ticket's priority is changed to CRITICAL  
**When** the `sla_deadline` is set  
**Then** its value is determined by the server using the timestamp of the creation or priority-change event, plus 4 hours  
**And** the client does not control the `sla_deadline` value

> **Note:** The specific storage format (e.g. UTC, ISO 8601) and how the value is displayed are 🔧 technical decisions. See TECH-1 and TECH-2 in Section 16.

---

### AC-SLA-3 — SLA deadline is not a user-editable field ✅

**Source:** Comment #10, clauses 3 and 4 (BR-5, BR-6) — the SLA deadline is defined as an automatic calculation from system timestamps, not a user-supplied value. Ticket description says priority is what users set.

**Given** a user creates or edits a ticket  
**When** the form is rendered  
**Then** there is no input field that allows the user to set or modify `sla_deadline` directly

---

### AC-SLA-4 — SLA deadline is displayed on the ticket detail page for CRITICAL tickets ✅

**Source:** Ticket description — "Tickets that exceed their SLA deadline … should be clearly identified" and the detail page must show the priority; the deadline is the mechanism that determines overdue status and must therefore be visible

**Given** a CRITICAL ticket with a non-null `sla_deadline`  
**When** the user views the ticket detail page  
**Then** the SLA deadline value is visible on the page

> **Note:** Where exactly it appears, and how it is formatted, are 🔧 technical decisions. See TECH-2 in Section 16.

---

### AC-SLA-5 — SLA deadline is not shown for non-CRITICAL tickets ✅

**Source:** Comment #10, clause 2 (BR-4) — SLA applies only to CRITICAL tickets; there is nothing to display for other priorities

**Given** a ticket whose `priority` is `LOW`, `MEDIUM`, or `HIGH`  
**When** the user views the ticket detail page  
**Then** no SLA deadline value is visible on the page

---

## 9. Approved AC: Overdue Behavior

The overdue definition below is derived directly from the approved business rules:

> ✅ A ticket is **overdue** when: `priority = 'CRITICAL'` AND `sla_deadline IS NOT NULL` AND `sla_deadline < current_time` AND `status NOT IN ('RESOLVED', 'CLOSED')`
>
> **Source:** Ticket description (FR-8) — "tickets that exceed their SLA deadline without being resolved or closed"; and comment #10, clause 2 (BR-4) — SLA applies only to CRITICAL tickets.

---

### AC-OD-1 — CRITICAL ticket past SLA deadline and OPEN is overdue ✅

**Source:** Ticket description (FR-8), comment #10 (BR-8)

**Given** a CRITICAL ticket whose `sla_deadline` has passed and whose `status = 'OPEN'`  
**When** the overdue condition is evaluated  
**Then** the ticket is classified as overdue

---

### AC-OD-2 — CRITICAL ticket past SLA deadline and IN_PROGRESS is overdue ✅

**Source:** Ticket description (FR-8), comment #10 (BR-8)

**Given** a CRITICAL ticket whose `sla_deadline` has passed and whose `status = 'IN_PROGRESS'`  
**When** the overdue condition is evaluated  
**Then** the ticket is classified as overdue

---

### AC-OD-3 — CRITICAL ticket past SLA deadline but RESOLVED is NOT overdue ✅

**Source:** Ticket description (FR-8) — "without being resolved or closed"; comment #10 (BR-8)

**Given** a CRITICAL ticket whose `sla_deadline` has passed and whose `status = 'RESOLVED'`  
**When** the overdue condition is evaluated  
**Then** the ticket is **not** classified as overdue

---

### AC-OD-4 — CRITICAL ticket past SLA deadline but CLOSED is NOT overdue ✅

**Source:** Ticket description (FR-8) — "without being resolved or closed"; comment #10 (BR-8)

**Given** a CRITICAL ticket whose `sla_deadline` has passed and whose `status = 'CLOSED'`  
**When** the overdue condition is evaluated  
**Then** the ticket is **not** classified as overdue

---

### AC-OD-5 — CRITICAL ticket within SLA deadline is NOT overdue ✅

**Source:** Ticket description (FR-8) — "exceed their SLA deadline"; comment #10 (BR-8)

**Given** a CRITICAL ticket whose `sla_deadline` is in the future  
**When** the overdue condition is evaluated  
**Then** the ticket is **not** classified as overdue, regardless of its status

---

### AC-OD-6 — Non-CRITICAL ticket is never overdue ✅

**Source:** Comment #10, clause 2 (BR-4) — SLA applies only to CRITICAL tickets

**Given** a ticket whose `priority` is `LOW`, `MEDIUM`, or `HIGH`  
**When** the overdue condition is evaluated  
**Then** the ticket is **not** classified as overdue regardless of its age or status

---

### AC-OD-7 — Overdue tickets are clearly identified ✅

**Source:** Ticket description — "should be clearly identified as overdue"

**Given** a ticket that meets the overdue definition  
**When** the ticket appears in the ticket list or ticket detail page  
**Then** the overdue state is clearly visible to the user

> **Note:** The specific visual treatment (badge, icon, colour, label) is a 🔧 technical design decision. See TECH-4 in Section 16.

---

## 10. Approved AC: Dashboard Expectations

### AC-DB-1 — Dashboard API exposes a CRITICAL count ✅

**Source:** Comment #10, clause 6 (BR-9) — "separate visibility for CRITICAL … tickets"

**Given** the dashboard API is called (`GET /api/dashboard`)  
**When** the response is received  
**Then** the `counts` object contains a `CRITICAL` key with a non-negative integer value

> ❓ **The exact scope of this count is unresolved.** See PBC-1 in Section 18. A developer must not hardcode a scope assumption here.

---

### AC-DB-2 — Dashboard API exposes a separate OVERDUE count ✅

**Source:** Comment #10, clause 6 (BR-9) — "separate visibility for … OVERDUE tickets"

**Given** the dashboard API is called (`GET /api/dashboard`)  
**When** the response is received  
**Then** the `counts` object contains an `OVERDUE` key with a non-negative integer value  
**And** the `OVERDUE` key is separate from the `CRITICAL` key (they are not summed into a single value)

---

### AC-DB-3 — CRITICAL and OVERDUE counts are separate from status counts ✅

**Source:** Comment #10, clause 6 (BR-9) — "separate visibility"; the four status keys have always represented all tickets regardless of priority

**Given** the dashboard response  
**When** the response is received  
**Then** the existing keys `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` are still present with their correct values  
**And** `CRITICAL` and `OVERDUE` are additional keys alongside the status keys — they are not replacements and are not disjoint categories relative to the status totals

---

### AC-DB-4 — Dashboard page displays a CRITICAL metric ✅

**Source:** Comment #10, clause 6 (BR-9) — "Dashboard must provide separate visibility for CRITICAL … tickets"

**Given** a user views the Dashboard page  
**When** the page loads successfully  
**Then** a metric showing the count of CRITICAL tickets is visible and labelled distinctly as CRITICAL  
**And** it is separate from the four existing status metrics

> ❓ **Whether the CRITICAL metric links to a filtered ticket list is unresolved.** See PBC-2 in Section 18.

---

### AC-DB-5 — Dashboard page displays an OVERDUE metric ✅

**Source:** Comment #10, clause 6 (BR-9) — "Dashboard must provide separate visibility for … OVERDUE tickets"

**Given** a user views the Dashboard page  
**When** the page loads successfully  
**Then** a metric showing the count of overdue tickets is visible and labelled distinctly as OVERDUE  
**And** it is separate from the four existing status metrics and from the CRITICAL metric

---

## 11. Approved AC: Ticket List and Detail Pages

### AC-TL-1 — Priority is displayed on the ticket list page ✅

**Source:** Ticket description (FR-9) — "The ticket list … page should display the priority"

**Given** a user navigates to the Tickets page  
**When** the ticket list loads  
**Then** the priority of each ticket is visible on the page

> **Note:** The specific UI element used (column, badge, inline label) is a 🔧 technical decision. See TECH-5 in Section 16.

---

### AC-TL-2 — Overdue tickets are clearly identified in the ticket list ✅

**Source:** Ticket description (FR-8) — "should be clearly identified as overdue"

**Given** a ticket list that contains a ticket meeting the overdue definition  
**When** the list is rendered  
**Then** that ticket's overdue state is clearly visible to the user within the list

---

### AC-TD-1 — Priority is displayed on the ticket detail page ✅

**Source:** Ticket description (FR-10) — "ticket detail pages should display the priority"

**Given** a user views a ticket detail page  
**When** the page loads  
**Then** the ticket's priority value is visible on the page

---

### AC-TD-2 — SLA deadline is visible on the detail page for CRITICAL tickets ✅

**Source:** Ticket description (FR-8) and AC-SLA-4

**Given** a CRITICAL ticket with a non-null `sla_deadline`  
**When** the user views the ticket detail page  
**Then** the SLA deadline value is visible on the page

---

### AC-TD-3 — Overdue state is visible on the ticket detail page ✅

**Source:** Ticket description (FR-8) — "should be clearly identified as overdue"

**Given** a ticket that meets the overdue definition  
**When** the user views the ticket detail page  
**Then** the overdue state is clearly visible on the page

---

## 12. Approved AC: Ticket Create / Edit Form

### AC-FM-1 — Priority selector is available on the create form ✅

**Source:** Ticket description (FR-1) — priority is an attribute of tickets; FR-2 — default is MEDIUM. Users must be able to set it.

**Given** a user opens the "Create ticket" form  
**When** the form renders  
**Then** a Priority field is visible with the four valid options: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`  
**And** the default selected value is `MEDIUM`

---

### AC-FM-2 — Priority selector is available on the edit form ✅

**Source:** Ticket description (FR-1) and comment #10, clause 4 — priority can change on existing tickets (BR-6 describes the update scenario explicitly)

**Given** a user opens the "Edit ticket" form for an existing ticket  
**When** the form loads  
**Then** a Priority field is visible with the four valid options  
**And** it is pre-populated with the ticket's current priority value

---

### AC-FM-3 — SLA deadline is not a user-editable field in the form ✅

**Source:** AC-SLA-3 — the SLA deadline is server-computed (BR-5, BR-6); the ticket and comments describe no user interaction with `sla_deadline` directly

**Given** a user fills in the create or edit form  
**When** the form is rendered  
**Then** there is no input field that allows the user to set or modify `sla_deadline` directly

---

### AC-FM-4 — Priority is included in the create payload ✅

**Source:** FR-1, FR-2 — priority is required for ticket creation; the default applies when it is absent

**Given** a user fills in the create ticket form and selects a priority  
**When** the form is submitted  
**Then** the `priority` field is included in the request body sent to `POST /api/tickets`

---

### AC-FM-5 — Priority is included in the edit payload ✅

**Source:** Comment #10, clauses 4 and 5 (BR-6, BR-7) — priority changes on existing tickets trigger SLA transitions; the client must be able to send an updated priority

**Given** a user edits a ticket and changes the priority  
**When** the form is submitted  
**Then** the `priority` field is included in the request body sent to `PUT /api/tickets/:id`

---

## 13. Approved AC: Backward Compatibility

### AC-BC-1 — All 12 seed tickets remain present and functional ✅

**Source:** Ticket description (FR-13)

**Given** the application is started against the upgraded schema  
**When** the 12 seed tickets are queried  
**Then** all 12 tickets are returned with all original fields intact  
**And** each ticket additionally includes `priority = 'MEDIUM'` and `sla_deadline = null`

---

### AC-BC-2 — Existing API responses are additive only ✅

**Source:** Ticket description (FR-13) — "Existing tickets must continue to work correctly"

**Given** an API consumer that was written before TF-0014  
**When** the consumer calls any ticket endpoint  
**Then** all fields that existed before TF-0014 are still present in the response with their original names and types  
**And** the only change to ticket objects is the addition of `priority` and `sla_deadline`

---

### AC-BC-3 — Ticket creation without `priority` still succeeds ✅

**Source:** Comment #10, clause 1 (BR-2) — MEDIUM is the default; the field is optional on input

**Given** a client that does not send a `priority` field  
**When** the client calls `POST /api/tickets` with a valid payload  
**Then** the ticket is created successfully with `priority = 'MEDIUM'`  
**And** the API responds with HTTP 201

---

### AC-BC-4 — Existing database upgraded safely without data loss ✅

**Source:** Ticket description (FR-13); comment #10, clause 1 (BR-3)

**Given** a production database containing tickets that predate TF-0014  
**When** the application starts with the updated code  
**Then** all pre-existing ticket rows receive `priority = 'MEDIUM'` and `sla_deadline = null`  
**And** no existing ticket rows are deleted, altered in any other field, or corrupted  
**And** the application starts without errors

---

## 14. Approved AC: API Contract

### AC-API-1 — Ticket objects include `priority` and `sla_deadline` ✅

**Source:** FR-1 (priority is an attribute of tickets); FR-5, FR-6 (sla_deadline is computed and stored)

**Given** a call to `GET /api/tickets`, `GET /api/tickets/:id`, `POST /api/tickets`, or `PUT /api/tickets/:id`  
**When** the response is received  
**Then** every ticket object in the response contains a `priority` field (a string from the approved value set) and a `sla_deadline` field (a timestamp value or `null`)

---

### AC-API-2 — Dashboard `counts` contains `CRITICAL` and `OVERDUE` keys ✅

**Source:** Comment #10, clause 6 (BR-9)

**Given** a call to `GET /api/dashboard`  
**When** the response is received  
**Then** `counts.CRITICAL` is a non-negative integer  
**And** `counts.OVERDUE` is a non-negative integer  
**And** the existing keys `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` are still present

---

### AC-API-3 — Invalid priority value returns HTTP 400 ✅

**Source:** BR-1 — only four values are valid; the existing API pattern (HTTP 400 for invalid status) establishes the error shape

**Given** a `POST /api/tickets` or `PUT /api/tickets/:id` call with a `priority` value not in `{LOW, MEDIUM, HIGH, CRITICAL}`  
**When** the request is processed  
**Then** the server returns HTTP 400  
**And** the response body contains an `error` field

---

## 15. Approved AC: Automated Tests

These criteria describe what the automated test suite must verify. They are required by FR-13 (backward compatibility) and by the need to verify the approved business rules.

### AC-TEST-1 — Existing dashboard sum assertion must be replaced ✅

**Source:** BR-9 — CRITICAL and OVERDUE are supplemental keys, not disjoint status categories; the existing `reduce` assertion (`sum === 13`) will produce a false failure once these keys are present

**Given** the existing test `'returns dashboard counts and users'` in `server/tests/api.test.js`  
**When** TF-0014 is implemented  
**Then** the assertion `Object.values(counts).reduce(...) === 13` must be replaced  
**And** replaced with per-key assertions on `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`  
**And** `counts.CRITICAL` and `counts.OVERDUE` must each equal `0` for the default seed data (all 12 seed tickets are MEDIUM)

---

### AC-TEST-2 — New ticket defaults to MEDIUM ✅

Automated test asserts: a ticket created with no `priority` field returns `priority === 'MEDIUM'` and `sla_deadline === null`. (Verifies BR-2.)

---

### AC-TEST-3 — CRITICAL ticket creation sets SLA deadline ✅

Automated test asserts: a ticket created with `priority = 'CRITICAL'` returns a non-null `sla_deadline` that is approximately `created_at + 4 hours`. (Verifies BR-5.)

---

### AC-TEST-4 — Invalid priority returns 400 ✅

Automated test asserts: `POST /api/tickets` with `priority = 'URGENT'` returns HTTP 400. (Verifies BR-1.)

---

### AC-TEST-5 — Non-CRITICAL to CRITICAL transition sets SLA deadline ✅

Automated test asserts: updating a MEDIUM ticket to CRITICAL sets a non-null `sla_deadline` approximately 4 hours after the update timestamp. (Verifies BR-6.)

---

### AC-TEST-6 — CRITICAL to non-CRITICAL transition clears SLA deadline ✅

Automated test asserts: updating a CRITICAL ticket to MEDIUM results in `sla_deadline === null`. (Verifies BR-7.)

---

### AC-TEST-7 — All 12 seed tickets have MEDIUM priority and null SLA deadline ✅

Automated test asserts: the 12 seed tickets all return `priority === 'MEDIUM'` and `sla_deadline === null`. (Verifies BR-2, BR-3.)

---

### AC-TEST-8 — Dashboard OVERDUE count excludes RESOLVED and CLOSED ✅

Automated test asserts: a CRITICAL ticket whose `sla_deadline` is in the past is counted as OVERDUE only when its status is OPEN or IN_PROGRESS; it is not counted when RESOLVED or CLOSED. (Verifies BR-8.)

---

## 16. Proposed Technical Acceptance Criteria

🔧 **The items in this section are technical design recommendations.** They are consistent with and required to implement the approved business requirements, but their exact form was not specified in the ticket or comments. They must be confirmed before a tester treats them as pass/fail criteria.

---

### TECH-1 — SLA deadline stored as UTC timestamp 🔧

**Rationale:** The SLA deadline must be comparable across time zones. The existing application already stores all `TEXT` timestamps in UTC and normalises them in the frontend via `formatDate()`. Storing `sla_deadline` in the same format avoids inconsistency.

**Proposed criterion:**  
The `sla_deadline` column stores its value as a UTC timestamp string, consistent with the storage format of `created_at` and `updated_at` in the `tickets` table.

**Status:** Recommended. Confirm before treating as a pass/fail test criterion.

---

### TECH-2 — SLA deadline displayed with date and time 🔧

**Rationale:** A 4-hour SLA window makes a date-only display (e.g. `Aug 30, 2026`) practically useless and potentially misleading. Date + time (e.g. `Aug 30, 2026, 10:00 AM`) is the only format that allows a user to act on the deadline meaningfully.

**Proposed criterion:**  
The SLA deadline on the ticket detail page is displayed using both date and time components, not date alone.

**Status:** Recommended. Business confirmation required before implementing as a pass/fail criterion.

---

### TECH-3 — Error message for invalid priority references the field 🔧

**Rationale:** The existing error message for invalid status is `'A valid status is required.'`. A consistent pattern for priority would be `'A valid priority is required.'` (or similar). Exact wording is a technical decision.

**Proposed criterion:**  
The HTTP 400 response body `error` field for an invalid priority value contains text that identifies the priority field as the source of the error (e.g. matches `/valid priority/i`).

**Status:** Recommended. Not a business decision; a developer may decide the exact message text.

---

### TECH-4 — Overdue visual treatment 🔧

**Rationale:** The ticket requires that overdue tickets are "clearly identified." The implementation method (a distinct badge, a colour change, an icon, a label) is not specified and is a UI design decision.

**Proposed criterion:**  
The overdue visual indicator is distinct from the standard priority badge so that a user can tell at a glance that the ticket is overdue, not merely CRITICAL. The exact visual form is to be decided by the implementer, consistent with the existing badge and status-indicator patterns in the application.

**Status:** Recommended approach. The requirement to "clearly identify" is approved (FR-8); the specific form is not.

---

### TECH-5 — Priority displayed as a styled badge 🔧

**Rationale:** The existing application uses `StatusBadge` for status display. A parallel `PriorityBadge` component with CSS classes following the pattern `priority-${priority.toLowerCase()}` would be consistent with the established convention.

**Proposed criterion:**  
Priority is rendered using a visual badge component that applies a distinct style per priority level, parallel to how `StatusBadge` works for ticket status.

**Status:** Recommended implementation approach. Not specified in the ticket.

---

### TECH-6 — Priority filter on ticket list page 🔧

**Rationale:** The ticket says the list page must display priority (FR-9). A filter control would naturally follow and would support the dashboard link use case. However, filtering by priority is not explicitly required in the ticket or comments.

**Proposed criterion:**  
The ticket list page provides a priority filter dropdown (alongside the existing status filter) that restricts results to tickets of a selected priority.

**Status:** Recommended. Requires business or product confirmation. See also PBC-2.

---

### TECH-7 — `?priority=` query parameter on `GET /api/tickets` 🔧

**Rationale:** A frontend priority filter (TECH-6) requires server-side filtering support. If the API does not accept `?priority=`, the frontend must filter client-side, which is less efficient and inconsistent with how status filtering works.

**Proposed criterion:**  
`GET /api/tickets` accepts an optional `?priority=` query parameter. A valid priority value returns only matching tickets. An invalid value returns HTTP 400.

**Status:** Implied by TECH-6 and the dashboard link use case. Requires the same confirmation as TECH-6. See PBC-2.

---

### TECH-8 — Server ignores client-supplied `sla_deadline` in request body 🔧

**Rationale:** Because `sla_deadline` is server-computed, a defensive implementation would silently ignore any `sla_deadline` value sent in a `POST` or `PUT` body. This is a standard defensive practice but was not mentioned in the ticket.

**Proposed criterion:**  
If a client includes `sla_deadline` in the request body of `POST /api/tickets` or `PUT /api/tickets/:id`, the server ignores the client-supplied value and applies the server-side SLA logic exclusively.

**Status:** Recommended defensive behaviour. Not a stated business rule.

---

### TECH-9 — SLA deadline shown read-only on the edit form 🔧

**Rationale:** The ticket says the detail page must show priority (and by extension the deadline), but does not specify whether the edit form should also display it read-only. Showing it read-only on the edit form is useful for context but is a UI design choice.

**Proposed criterion:**  
When a user opens the edit form for a CRITICAL ticket that has a non-null `sla_deadline`, the current SLA deadline is displayed as a read-only informational field. The user cannot modify it.

**Status:** Recommended. Not a stated business requirement.

---

## 17. Edge Cases

The edge cases below are derived from the approved business rules. Where a case depends on an unresolved ambiguity, this is noted explicitly.

| # | Classification | Edge Case | Expected Behaviour |
|---|---------------|-----------|-------------------|
| EC-1 | ✅ | `priority` field is `null` in the request body | Treat as if the field was absent: apply the MEDIUM default (BR-2). |
| EC-2 | ✅ | `priority` field is an empty string `""` | Reject with HTTP 400 — empty string is not in the approved value set (BR-1). |
| EC-3 | ✅ | Priority changes from CRITICAL → HIGH → CRITICAL | On the second transition to CRITICAL, `sla_deadline` is recalculated from the timestamp of that second transition (BR-6). The original creation time is not used. |
| EC-4 | ✅ | Existing database has no `priority` column; application starts | The migration must add the column and assign `MEDIUM` to all existing rows without error or data loss (BR-3). |
| EC-5 | 🔧 | CRITICAL ticket is created with `status = 'RESOLVED'` in the same request | `sla_deadline` is still set (BR-5 states the deadline is set at creation if priority is CRITICAL; no status exception is stated). The ticket is not overdue because its status is RESOLVED (BR-8). This interpretation follows from the approved rules but is an inference — confirm if a CRITICAL ticket with an initial RESOLVED status is a realistic scenario. |
| EC-6 | 🔧 | CRITICAL ticket is edited; priority remains CRITICAL; no priority change occurs | Whether `sla_deadline` is recalculated or left unchanged depends on the answer to PBC-3. This edge case must not be resolved by implementation assumption. |
| EC-7 | 🔧 | Client sends `sla_deadline` in the request body | Depends on TECH-8. If TECH-8 is confirmed, the client-supplied value is silently ignored. |

---

## 18. Pending Business Confirmation

❓ **The items in this section are open questions.** No implementation decision should be made for them without an explicit answer from Maria Santos or an authorised stakeholder. Until confirmed, do not implement any assumption as if it were an approved requirement.

---

### PBC-1 — Scope of the CRITICAL dashboard count

**Question:** Does the `CRITICAL` count on the dashboard include all CRITICAL-priority tickets regardless of status, or only CRITICAL tickets that are active (i.e., `status NOT IN ('RESOLVED', 'CLOSED')`)?

**Why this matters:** The two interpretations produce different numbers and different operational meaning:
- **Option A — All CRITICAL tickets (any status):** A historical count; shows how many critical tickets have ever been opened.
- **Option B — Active CRITICAL tickets only (`OPEN` or `IN_PROGRESS`):** An operational count; shows how many critical tickets currently need attention.

**Impact on existing criteria:** AC-DB-1 currently cannot be written as a testable assertion until this is answered. AC-TEST-8 similarly depends on this answer.

**Recommendation (not a requirement):** Option B is more operationally useful for a support team. However, this is a business decision.

---

### PBC-2 — Navigation from the CRITICAL metric card

**Question:** Should the CRITICAL metric card on the Dashboard link to the ticket list pre-filtered to CRITICAL priority? If yes, is this achieved via server-side filtering (`GET /api/tickets?priority=CRITICAL`) or client-side filtering?

**Why this matters:** If the card must link to a filtered view, both TECH-6 (priority filter on the list page) and TECH-7 (`?priority=` API parameter) become required rather than recommended. If no navigation link is required, those items remain optional enhancements.

**Impact on existing criteria:** AC-DB-4 includes a proposed link target that is not in the approved requirements. TECH-6 and TECH-7 are blocked on this answer.

---

### PBC-3 — SLA recalculation when a CRITICAL ticket is saved without changing priority

**Question:** If a CRITICAL ticket (with an existing `sla_deadline`) is updated but `priority` remains `CRITICAL`, should the `sla_deadline` be recalculated from the new update timestamp, or left unchanged?

**Why this matters:**
- **Option A — Leave unchanged:** The SLA clock is anchored to the moment the ticket became CRITICAL and does not move. A developer saving other fields (title, description, status) does not accidentally reset the deadline.
- **Option B — Recalculate on every save:** The deadline extends by 4 hours from the moment of the last edit, which would effectively allow users to defer the SLA indefinitely by saving the ticket repeatedly.

**Recommendation (not a requirement):** Option A. Option B undermines the purpose of the SLA deadline. However, this is a business decision; do not implement either option as a confirmed rule until answered.

**Impact on existing criteria:** EC-6 in Section 17 and any test covering a no-op priority update depend on this answer.

---

### PBC-4 — Overdue indicator persistence after resolution

**Question:** If a ticket was CRITICAL and overdue, then is subsequently RESOLVED or CLOSED, should any historical record of the overdue state be preserved visually (e.g. a "was overdue" label), or should the overdue indicator be removed entirely?

**Why this matters:** The approved overdue definition (BR-8) excludes RESOLVED and CLOSED tickets from being overdue. This means the overdue indicator naturally disappears on resolution. However, the business may want an audit trail showing that the SLA was breached before closure.

**Recommendation (not a requirement):** Remove the overdue indicator on resolution, consistent with BR-8. Implement a separate audit or reporting feature if historical overdue tracking is needed. Confirm before implementing.

---

*Document revised from the initial version. All items in Sections 5–15 are sourced exclusively from TaskFlow ticket TF-0014 and approved comments #9 and #10 (Maria Santos, 2026-08-30). Section 16 contains technical recommendations only. Section 18 lists questions that require explicit stakeholder confirmation before implementation.*
