# Equipment Purchase Request App Project Status

This file is the project memory for implementation work. Update it after every meaningful batch so future agents can quickly understand what changed, why, and what should happen next.

## Current Snapshot

- Branch: `dev`
- Remote: `https://ryanesmores07@github.com/ryanesmores07/equipment-purchase-request-app.git`
- GitHub account for this repo: personal `ryanesmores07`
- Global GitHub default should remain the work account.
- Stack baseline: Next.js `15.5.18`, React `19.2.4`, TypeScript, Tailwind CSS, ESLint, pnpm.
- Core app dependencies: `@supabase/supabase-js` `2.106.0`, `@supabase/ssr` `0.10.3`, `zod` `4.4.3`, `supabase` CLI `2.100.1`, `vitest` `4.1.6`.
- Baseline verification: `pnpm lint` and `pnpm build` passed before the preparation commit.
- Preparation commit: `03193a2` preparation baseline.

## Source Of Truth

- Assignment: `https://www.notion.so/Web-3664c366b0548085b672e7a89dbdc866`
- Plan: `docs/superpowers/plans/2026-05-20-equipment-purchase-request.md`
- Spec: `docs/superpowers/specs/2026-05-20-equipment-purchase-request-design.md`
- Agent routing: `AGENTS.md`
- Senior orchestrator: `.agents/skills/epr-senior-orchestrator/SKILL.md`

## Operating Rules

- Execute one small batch at a time.
- Use `.agents/skills/epr-senior-orchestrator/SKILL.md` before non-trivial work.
- Route specialist work through the relevant `.agents/skills/epr-*` skill.
- Keep the deep-dive focused on Design / Business Logic.
- Keep this file updated whenever dependencies, architecture, schema, routes, auth, tests, setup, or submission status changes.
- Do not push with the global work GitHub account. This repo is configured for personal GitHub only.
- Keep the repository clean for employer review: commit only files that are necessary, reviewer-relevant, and easy to explain.
- Support both the current Windows work PC and the user's Mac through committed project config and docs, not local machine state.

## Decision Log

| Date | Decision | Reason | Status |
|---|---|---|---|
| 2026-05-21 | Use Next.js 15 instead of Next.js 16. | User explicitly requested Next.js 15; project rules also mention Next.js 15. | Done |
| 2026-05-21 | Keep work GitHub as global default, but use personal GitHub for this repo. | User wants work account to remain default while this project pushes to `ryanesmores07`. | Done |
| 2026-05-21 | Use sequential batches, not parallel subagents. | Project plan prioritizes monitored execution and lower coordination risk. | Active |
| 2026-05-21 | Add project-local EPR specialist skills. | Keeps ownership clear without adding unnecessary process overhead. | Done |
| 2026-05-21 | Keep project-local agent skills committed, but avoid temp/local clutter. | User will work from Windows and Mac, and employer will review the repo. Skills are portable project workflow docs; temp files and machine state are not. | Active |
| 2026-05-21 | Use standard English commit messages instead of the old Japanese prefix. | User wants employer-review-friendly commit history and no unexplained prefix in future commits. | Active |

## Batch Log

| Date | Batch | Owner Skill | Changed | Verification | Next |
|---|---|---|---|---|---|
| 2026-05-21 | Preparation baseline | `epr-senior-orchestrator` | Added project agent routing, EPR skills, Next.js 15 baseline, personal GitHub repo-local setup. | `pnpm lint`, `pnpm build`, pushed `dev`. | Start Batch 1: clean boilerplate and install core app dependencies. |
| 2026-05-21 | Repo hygiene and two-PC workflow | `epr-senior-orchestrator` | Added repo cleanliness rules, cross-PC workflow guidance, and stricter ignore rules for env/temp/local files. | `pnpm lint`; hygiene scan found only expected docs references to env/token concepts, no committed secrets. | Commit and push hygiene update, then start Batch 1. |
| 2026-05-21 | Commit message rule cleanup | `epr-senior-orchestrator` | Removed the old Japanese commit-message prefix rule and replaced it with concise English Conventional Commits-style guidance. | `rg` scan confirmed old prefix is no longer present in repo instructions/docs. `pnpm lint` was not used for this docs-only batch because unrelated dependency changes currently require pnpm build approval for `esbuild`. | Commit only rule/docs changes; keep unrelated app/dependency changes out of this commit. |
| 2026-05-21 | Batch 1 app baseline and tooling | `epr-reproducibility-qa` | Removed starter page content, set app metadata, installed Supabase/Zod/Vitest/Supabase CLI tooling, added Vitest config and test scripts, approved `esbuild` build scripts in pnpm workspace config. | `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all passed. `pnpm test` has no tests yet and exits cleanly with `--passWithNoTests`. | Commit Batch 1, then start Supabase project layout and `.env.example` setup. |
| 2026-05-21 | Supabase config and env scaffolding | `epr-reproducibility-qa` | Added `.env.example` with placeholder Supabase Cloud credentials and reviewer users, initialized `supabase/config.toml`, added `supabase/seed.sql`, ignored Supabase temp state, added `setup` script and tracked `types/` output directory. | `pnpm exec supabase --version`, `pnpm exec supabase init`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`; placeholder scan found no real secrets. | Commit config scaffolding, then create first database migrations for profiles/categories/request tables once a Supabase Cloud project is ready to link. |
| 2026-05-21 | Initial schema, RLS, and audit migration | `epr-database-rls` | Added one initial Supabase migration for `profiles`, `categories`, `purchase_requests`, `approval_history`, category seed rows, RLS policies, grants, status-transition enforcement, auth profile trigger, and approval-history trigger. | `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` passed. Migration has not been pushed because no Supabase Cloud project is linked in this session. | Commit migration, then add domain status/validation modules and unit tests before wiring app routes. |
| 2026-05-21 | Domain state machine and validation | `epr-domain-validation` | Added pure TypeScript request status transitions, terminal-status helper, Zod create/decision schemas, and unit tests for transition and validation boundaries. | `pnpm lint`, `pnpm typecheck`, `pnpm test` (13 tests), and `pnpm build` passed. | Commit domain/validation layer, then add Supabase server clients and auth helpers. |
| 2026-05-21 | Supabase SSR auth foundation | `epr-auth-server-actions` | Added Supabase env helper, browser/server clients, middleware session refresh, login/logout server actions, and `requireUser`/`requireRole` helpers. | `pnpm lint`, `pnpm typecheck`, `pnpm test` (13 tests), and `pnpm build` passed. Build includes middleware. | Commit auth foundation, then add typed repositories and seed-user script after DB types or hand-written row types are available. |
| 2026-05-21 | Repositories and seed-user script | `epr-auth-server-actions` | Added hand-written row types, repositories for categories/profiles/requests/history, and `supabase/seed-users.ts` for service-role seeded employee/admin accounts. | `pnpm lint`, `pnpm typecheck`, `pnpm test` (13 tests), and `pnpm build` passed. Seed script was not executed because `.env.local` and linked Supabase credentials are not configured in this session. | Commit data access batch, then build request server actions and route pages. |
| 2026-05-21 | First request workflow UI | `epr-request-ui` | Added login page/form, authenticated shell, root redirect, request list, create request form, detail page, admin approval panel, loading states, and request server actions. | `pnpm lint`, `pnpm typecheck`, `pnpm test` (13 tests), and `pnpm build` passed. A stale `.next` cache caused one transient build page-data error and was fixed by deleting generated `.next` and rebuilding. Browser walkthrough not run because Supabase Cloud credentials are not configured. | Commit UI workflow, then link Supabase Cloud, push migrations, seed users, generate DB types, and run a live walkthrough. |

## Next Execution Batch

Next batch needs live Supabase setup:

- Fill `.env.local` from a Supabase Cloud project.
- Run `pnpm exec supabase link`, `pnpm db:push`, `pnpm db:seed-users`, and `pnpm db:types`.
- Run the app locally and verify employee create flow plus admin approve/reject flow.
- Keep `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` passing.
