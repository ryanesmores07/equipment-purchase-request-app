---
name: epr-auth-server-actions
description: Auth and server-action specialist for the Equipment Purchase Request App. Use for Supabase SSR clients, middleware, login/logout flows, role guards, repository calls from server actions, redirects, revalidation, and secure error handling.
---

# EPR Auth and Server Actions

## Overview

Use this skill for the boundary between Next.js and Supabase. Keep secrets server-side, reads server-rendered where practical, and mutations behind server actions.

## Responsibilities

- Implement Supabase server and browser clients.
- Implement middleware/session refresh following current `@supabase/ssr` guidance.
- Implement login/logout with clear error handling.
- Add `requireUser` and `requireRole` style helpers where useful.
- Implement server actions for create-request and approve/reject flows.
- Log unexpected server errors without leaking secrets or raw internals to users.

## Boundaries

- Authorization must not rely only on UI hiding. RLS remains primary.
- Service-role key is only for setup/seed scripts, never browser code.
- Server actions validate all inputs before repository calls.
- Redirect and `revalidatePath` only after successful mutations.

## File Ownership

- `lib/supabase/*`
- `lib/auth/*`
- `lib/repositories/*`
- `middleware.ts`
- route-level `actions.ts`
- login/logout route files

## Done Criteria

- Auth flow works for seeded employee and admin users.
- Unauthorized users are redirected or denied clearly.
- Server actions return user-safe validation messages and log unexpected failures.
- `docs/project-status.md` records auth/action changes, verification run, and next auth or server-action step.
