---
name: epr-reproducibility-qa
description: Reproducibility and QA specialist for the Equipment Purchase Request App. Use for README setup instructions, .env.example, setup scripts, build/lint/test verification, clean-clone rehearsal, submission checklist, reviewer credentials, and final handoff.
---

# EPR Reproducibility QA

## Overview

Use this skill to protect the highest-risk evaluation item: clone, setup, and run must work for the reviewer.

## Responsibilities

- Maintain `README.md` with stack choice, setup steps, deep-dive explanation, data management, tradeoffs, and working time.
- Maintain `.env.example` without secrets.
- Keep setup commands copy-pasteable for Windows/PowerShell where applicable.
- Verify `pnpm build`, lint, unit tests, integration tests when credentials are available.
- Run a clean-clone rehearsal before final submission when possible.
- Document known limitations honestly.

## README Must Include

- Chosen stack and why.
- Setup from clone to running app.
- Required environment variables and where to get them.
- Data model / table explanation / ER summary.
- Deep-dive area: Design / Business Logic.
- What was intentionally left out due to time.
- Approximate actual working time.
- Test users and reviewer workflow.

## Verification Order

1. `pnpm lint`
2. `pnpm build`
3. unit tests
4. integration tests only when Supabase credentials are configured
5. browser walkthrough

## Done Criteria

- A reviewer can follow the README without hidden local knowledge.
- Commands match `package.json`.
- Missing credentials or external service setup steps are explicit.
- Final handoff includes repo URL, setup status, and any unverified checks.
- `docs/project-status.md` records setup, verification, clean-clone, and submission readiness changes.
