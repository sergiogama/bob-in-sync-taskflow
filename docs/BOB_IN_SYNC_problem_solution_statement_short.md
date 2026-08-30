# BOB IN SYNC — Problem & Solution Statement

## Problem

Software maintenance teams often spend more time **understanding a change than implementing it**.

Developers inherit unfamiliar applications, documentation becomes outdated, business context is scattered across tickets and comments, and knowledge is lost when people move between teams. This slows delivery, increases risk, and forces each new developer to rediscover the same system.

## Solution

**BOB IN SYNC** turns IBM Bob into an interactive change companion connected to both the business request and the application.

Using our TaskFlow maintenance system, a developer can simply say:

`I get TF-0010.`

IBM Bob then:

- retrieves the ticket and comments through **MCP**
- updates TaskFlow with **Owner = IBM Bob** and **Status = IN_PROGRESS**
- loads the application **Solution Guide**
- validates that knowledge against the current code, tests, schema, and configuration
- produces a concise **Change Brief** with rules, impact, risk, and suggested approach
- waits for explicit developer approval before changing code
- implements and validates the change
- updates affected technical knowledge automatically

## Target Users

- software maintenance teams
- developers joining an existing squad
- teams working with legacy or unfamiliar applications

## Why It Is Different

BOB IN SYNC connects:

**Business Request → System of Record → Living Knowledge → Code → Human Approval → Validation**

Its key differentiator is the **living Solution Guide**. Every change starts from maintained application knowledge, and every validated change can update that knowledge.

This reduces rediscovery, improves traceability, lowers implementation risk, and helps new developers become productive faster.

> **Understand. Change. Document. In Sync.**
