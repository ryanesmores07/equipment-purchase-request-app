---
name: epr-senior-orchestrator
description: Senior orchestration skill for the Equipment Purchase Request App. Use when Codex needs to interpret the Notion assignment, choose the next implementation batch, assign work to EPR specialist skills, resolve scope tradeoffs, or keep the project aligned with the sequential no-overengineering plan.
---

# EPR Senior Orchestrator

## Overview

Use this skill as the first stop for non-trivial project work. It turns the assignment into small verified batches and routes each batch to the right specialist skill.

## Source Order

1. Read `AGENTS.md`.
2. Read `docs/project-status.md`.
3. Read the current request from the user.
4. Check `git status --short`.
5. Use the Notion assignment page when requirements are unclear.
6. Use `docs/superpowers/plans/2026-05-20-equipment-purchase-request.md` for the current implementation path.

Use `docs/superpowers/specs/2026-05-20-equipment-purchase-request-design.md` for exact design details when it exists in the worktree; verify it before relying on schema or route claims.

## Routing

- Database, migrations, seed data, triggers, policies, or generated DB types: use `epr-database-rls`.
- State transitions, Zod schemas, pure domain functions, or unit tests: use `epr-domain-validation`.
- Supabase clients, middleware, login/logout, role guards, or server actions: use `epr-auth-server-actions`.
- Pages, forms, status badges, filters, loading/error UI, or approval panel: use `epr-request-ui`.
- README, `.env.example`, setup script, build/test checks, clean-clone rehearsal, or final submission: use `epr-reproducibility-qa`.

## Batch Rules

- Execute one small coherent batch at a time.
- Verify after each batch with the cheapest meaningful command first.
- Do not use parallel/asynchronous implementation subagents; the project plan explicitly chooses monitored inline execution.
- Ask before destructive cleanup, especially removal of scaffold files, dependencies, or generated directories.
- Keep the deep-dive focused on Design / Business Logic. Do not broaden into CI, notification systems, file attachments, or complex UI unless the user asks.
- Update `docs/project-status.md` before ending every meaningful batch. Include what changed, the responsible skill, verification results, blockers, and the next recommended step.
- Before committing, review `git status --short` and exclude temp scripts, local env, machine-specific files, generated output, screenshots, and anything not reviewer-relevant.
- Use concise English commit messages. Prefer Conventional Commits-style prefixes when useful, and do not use the old Japanese prefix.
- Keep project-local `.agents/` files portable across the work PC and Mac. Do not add absolute machine-specific paths to skills unless they are already in user-provided context and necessary.

## Quality Bar

- Prioritize clone-to-running reproducibility.
- Prefer readable, boring code over clever abstractions.
- Keep RSC/server-side reads as the default and isolate client components.
- Require explicit loading/error states for route-level data fetching.
- Leave no TODOs or placeholders in final implementation.
- Keep project memory factual, compact, and current in `docs/project-status.md`.
- Keep the repository explainable to a skeptical employer reviewer.
