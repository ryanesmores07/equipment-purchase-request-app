---
name: epr-domain-validation
description: Domain and validation specialist for the Equipment Purchase Request App. Use for pure TypeScript business rules, request status state machines, Zod schemas, form/server-action validation contracts, and Vitest unit tests.
---

# EPR Domain Validation

## Overview

Use this skill to keep business rules independent from Supabase and UI code. The goal is code the user can explain clearly in an interview.

## Responsibilities

- Define request statuses and valid transitions in pure TypeScript.
- Validate create-request and decide-request inputs with Zod.
- Share validation between forms, server actions, and repository/domain code.
- Add Vitest coverage for valid and invalid paths.
- Keep functions small, named clearly, and easy to reason about.

## Defaults

- Pending requests can become approved or rejected.
- Approved and rejected requests are terminal unless the user explicitly changes the requirement.
- Amount must be a positive integer yen value.
- Title is required and should be length-limited.
- Decision note can be optional but should be length-limited when present.

## File Ownership

- `lib/domain/*`
- `lib/validation/*`
- `tests/domain/*`
- `tests/validation/*`
- test config only when needed for this layer

## Done Criteria

- Unit tests cover allowed transitions, rejected transitions, valid inputs, and invalid inputs.
- No domain function imports Supabase, React, or Next.js.
- Server action and form code can use the same schemas without duplicating rules.
