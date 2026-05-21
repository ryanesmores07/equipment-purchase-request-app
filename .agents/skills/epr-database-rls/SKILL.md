---
name: epr-database-rls
description: Supabase database specialist for the Equipment Purchase Request App. Use for schema design, migrations, seed data, Supabase CLI setup, RLS policies, approval audit triggers, status-transition database enforcement, and generated TypeScript database types.
---

# EPR Database and RLS

## Overview

Use this skill for all Supabase persistence and authorization work. Keep database work reproducible from a fresh clone and aligned with the Design / Business Logic deep-dive.

## Responsibilities

- Create and maintain `supabase/` project files.
- Add migrations for `profiles`, `categories`, `purchase_requests`, `approval_history`, triggers, and RLS policies.
- Keep Supabase Cloud setup reviewer-friendly; do not assume local Docker unless the project strategy changes.
- Use RLS as the primary authorization layer, with server-side role checks as defense in depth.
- Keep seed data minimal: employee and admin users/profiles, useful categories, and enough sample records to verify the workflow.
- Generate and update Supabase TypeScript types after schema changes.

## Required Checks

- Before touching migrations, inspect existing `supabase/migrations`.
- Before pushing schema, confirm the project is linked intentionally.
- Never commit `.env.local`, service-role secrets, Supabase temp files, or dashboard-only credentials.
- After schema changes, run the relevant Supabase CLI command and regenerate DB types if available.

## Design Defaults

- `profiles` stores app role data linked to `auth.users`.
- `categories` is a small master table.
- `purchase_requests` stores the request, applicant, category, amount, status, and decision metadata.
- `approval_history` is append-only and written by trigger when status changes.
- Enforce valid status transitions in the database and in TypeScript.

## Done Criteria

- Migrations are committed.
- Seed/setup path is documented or scripted.
- RLS behavior is testable by employee and admin roles.
- Generated DB types match the current schema.
- `docs/project-status.md` records schema/policy changes, Supabase setup status, verification run, and next database step.
