# Equipment Purchase Request App Project Status

This file is the project memory for implementation work. Update it after every meaningful batch so future agents can quickly understand what changed, why, and what should happen next.

## Current Snapshot

- Branch: `dev`
- Remote: `https://ryanesmores07@github.com/ryanesmores07/equipment-purchase-request-app.git`
- GitHub account for this repo: personal `ryanesmores07`
- Global GitHub default should remain the work account.
- Stack baseline: Next.js `15.5.18`, React `19.2.4`, TypeScript, Tailwind CSS, ESLint, pnpm.
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

## Next Execution Batch

Batch 1 should:

- Remove default Next.js starter content from `app/page.tsx`.
- Set proper app metadata in `app/layout.tsx`.
- Install Supabase, Zod, Vitest, and supporting test/setup dependencies.
- Keep `pnpm lint` and `pnpm build` passing.
- Update this status file with exact dependency and verification results.
