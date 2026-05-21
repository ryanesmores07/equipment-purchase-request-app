# Equipment Purchase Request App — Design Spec

**Date:** 2026-05-20
**Status:** Approved (pending user file review)
**Source assignment:** [スキルチェック課題 - Webエンジニア](https://www.notion.so/Web-3664c366b0548085b672e7a89dbdc866)
**Deep-dive area:** Design / Business Logic
**Effort budget:** ~6–8 hours

---

## 1. Goal

Build a prototype internal "Equipment Purchase Request" web app where:
- General employees create purchase requests and view their own list.
- Administrators view all requests across the company and approve or reject them.

The deliverable is a public GitHub repository that a reviewer can clone, set up by following the README, and run locally without friction.

The submission is scored on environment reproducibility, design intent, code readability, depth in the chosen strength area, and prioritization. Our strength area is **Design / Business Logic**, so the schema, authorization (RLS), validation, domain layer, and tests are the showcase. UI and infrastructure are kept simple-but-correct.

---

## 2. Tech stack (locked)

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js (latest stable, App Router) | `create-next-app` gives TS + Tailwind + ESLint defaults in one command; matches existing `.cursor/rules` preference |
| Language | TypeScript (strict) | Default in `create-next-app`; Supabase generates TS types from the schema |
| Styling | Tailwind CSS | Default in `create-next-app` |
| UI components | shadcn/ui (selective install only) | Components are copied into repo (no opaque dependency); used for forms, dialog, toast, badge, table |
| Lint | ESLint (Next.js default config) | Default in `create-next-app` |
| Database | Supabase Cloud (free tier) — managed Postgres + Auth + RLS | Postgres + Auth + RLS in one tool; matches deep-dive area. Work machine constraints made a local Docker stack impractical, so we use Supabase Cloud throughout. The Supabase CLI is used to apply migrations to the linked cloud project (`supabase db push`), not to run a local stack. |
| Auth | Supabase Auth (email + password) | Integrates with RLS via `auth.uid()` |
| Validation | Zod | Single source of truth for forms, server actions, and domain; called out in the rubric ("バリデーション設計") |
| Tests | Vitest + `@vitest/coverage-v8` | Industry standard for Vite/Next ecosystems; rubric explicitly lists test code |
| Package manager | pnpm | Lockfile committed for reproducibility |

**Explicitly NOT used** (with reason):
- Prisma/Drizzle — Supabase migrations + generated types are sufficient; no ORM needed.
- shadcn/ui beyond the listed components — YAGNI.
- Biome — ESLint is already the default; no reason to swap.
- pino / external logger — `console.error` with a structured object is enough for this scope.
- NextAuth/Auth.js/Lucia — Supabase Auth already covers it.
- Playwright/Cypress — out of budget; Vitest integration tests cover the critical paths.
- Storybook — not deep-diving on UI.
- Tanstack Query — RSC + Server Actions handle data flow.

---

## 3. Architecture

Layered structure, separation by responsibility, not by technical layer:

```text
app/                       Next.js App Router routes (RSC for reads, Server Actions for writes)
  (auth)/login/            Login page (Server Component + form)
  (app)/
    layout.tsx             Authenticated shell (header, role badge, logout)
    requests/
      page.tsx             List view (RSC) — employee sees own; admin sees all
      new/page.tsx         Create form (Server Action)
      [id]/page.tsx        Detail view + history timeline + admin approve/reject panel
    error.tsx              Route-level error boundary
components/
  ui/                      shadcn/ui copied components (only what is used)
  request-form.tsx         Create-request form (client component, useFormState)
  request-list.tsx         List rendering, role-aware columns
  request-status-badge.tsx Badge with color per status
  approval-panel.tsx       Admin-only approve/reject UI in detail page
  history-timeline.tsx     Renders approval_history rows
lib/
  domain/
    status.ts              Status enum + `canTransition()` state machine
    request.ts             Pure domain types (no Supabase imports)
  validation/
    request-schemas.ts     Zod schemas: createRequestSchema, decideRequestSchema
  repositories/
    requests.repo.ts       Read/write `purchase_requests`
    profiles.repo.ts       Read `profiles`
    history.repo.ts        Read `approval_history` (no writes — trigger only)
  supabase/
    server.ts              Server-side Supabase client (RSC + Server Actions)
    browser.ts             Browser Supabase client (client components only)
    middleware.ts          Session refresh middleware
  auth/
    require-user.ts        Returns current user or redirects to /login
    require-role.ts        Asserts role at action boundary (defense in depth on top of RLS)
supabase/
  config.toml              Supabase CLI configuration
  migrations/
    0001_init.sql          Tables + constraints
    0002_rls.sql           RLS policies
    0003_history_trigger.sql  Trigger that writes approval_history
    0004_status_transition.sql Function/trigger enforcing valid status transitions
  seed.sql                 Categories + sample requests (users seeded via TS script)
  seed-users.ts            Creates seeded `employee@example.com` + `admin@example.com` via Supabase Admin API
tests/
  domain/
    status.test.ts         State machine unit tests
  validation/
    request-schemas.test.ts  Zod boundary tests
  repositories/
    requests.repo.test.ts    Integration tests against local Supabase
docs/
  superpowers/
    specs/                 This document
    plans/                 Implementation plan (next step)
README.md                  In English + Japanese; setup, architecture, deep-dive, compromises
README.ja.md               (or single bilingual README — TBD during README task)
.env.example               Documents required env vars without secrets
```

### Data flow
- **Reads**: RSC route → repository (server Supabase client with user session) → Supabase Postgres (RLS filters). No client-side data fetching for the primary views.
- **Writes**: Form → Client Component invokes Server Action → `require-role` check → Zod parse → domain `canTransition` check → repository → Supabase Postgres (RLS enforces final authorization).
- **Audit**: Status changes on `purchase_requests` fire a Postgres trigger that inserts a row into `approval_history`. Application code never writes to `approval_history` directly.

---

## 4. Data model

### Tables

#### `profiles` (1:1 with `auth.users`)
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK, FK → `auth.users.id` ON DELETE CASCADE |
| `email` | `text` | NOT NULL, mirrored from auth for convenience |
| `full_name` | `text` | NOT NULL |
| `role` | `text` | NOT NULL, CHECK (`role IN ('employee','admin')`) |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` |

A trigger on `auth.users` insertion creates a matching `profiles` row with `role='employee'` by default; the seed script promotes one user to `admin`.

#### `categories`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` |
| `name` | `text` | UNIQUE NOT NULL |
| `sort_order` | `integer` | NOT NULL DEFAULT 0 |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` |

Seeded with: `オフィス備品`, `PC・周辺機器`, `ソフトウェアライセンス`, `書籍・学習`, `その他`.

#### `purchase_requests`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` |
| `applicant_id` | `uuid` | NOT NULL, FK → `profiles.id` |
| `category_id` | `uuid` | NOT NULL, FK → `categories.id` |
| `title` | `text` | NOT NULL, CHECK (`length(title) BETWEEN 1 AND 120`) |
| `description` | `text` | NULL allowed, CHECK (`description IS NULL OR length(description) <= 1000`) |
| `amount_jpy` | `integer` | NOT NULL, CHECK (`amount_jpy > 0 AND amount_jpy <= 10000000`) |
| `status` | `text` | NOT NULL, CHECK (`status IN ('pending','approved','rejected')`), DEFAULT `'pending'` |
| `requested_at` | `timestamptz` | NOT NULL DEFAULT `now()` |
| `decided_at` | `timestamptz` | NULL allowed |
| `decided_by` | `uuid` | NULL allowed, FK → `profiles.id` |
| `decision_note` | `text` | NULL allowed, CHECK (`decision_note IS NULL OR length(decision_note) <= 500`) |

Invariants enforced at DB level (CHECK constraint):
- If `status = 'pending'`: `decided_at IS NULL AND decided_by IS NULL AND decision_note IS NULL`.
- If `status IN ('approved','rejected')`: `decided_at IS NOT NULL AND decided_by IS NOT NULL`.
- If `status = 'rejected'`: `decision_note IS NOT NULL` (rejection reason required).

#### `approval_history` (append-only audit)
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` |
| `request_id` | `uuid` | NOT NULL, FK → `purchase_requests.id` ON DELETE CASCADE |
| `actor_id` | `uuid` | NOT NULL, FK → `profiles.id` |
| `from_status` | `text` | NOT NULL |
| `to_status` | `text` | NOT NULL |
| `note` | `text` | NULL allowed |
| `acted_at` | `timestamptz` | NOT NULL DEFAULT `now()` |

### Indexes
- `purchase_requests (applicant_id, requested_at DESC)` — for employee list view
- `purchase_requests (status, requested_at DESC)` — for admin filtered list view
- `approval_history (request_id, acted_at DESC)` — for timeline rendering

---

## 5. Triggers & functions

### `tg_handle_new_user` (on `auth.users` AFTER INSERT)
Creates a corresponding `profiles` row with `role='employee'`, copying `email` from `auth.users` and `full_name` from `raw_user_meta_data->>'full_name'` (fallback to email local-part).

### `tg_write_approval_history` (on `purchase_requests` AFTER UPDATE OF status)
When `OLD.status IS DISTINCT FROM NEW.status`, inserts a row into `approval_history`:
- `actor_id = auth.uid()`
- `from_status = OLD.status`
- `to_status = NEW.status`
- `note = NEW.decision_note`

### `tg_enforce_status_transition` (on `purchase_requests` BEFORE UPDATE OF status)
Raises an exception unless the transition is permitted by the state machine:
- `pending → approved`: allowed
- `pending → rejected`: allowed
- any other change: rejected with `ERROR: invalid status transition % → %`

This is duplicated in `lib/domain/status.ts` for defense in depth and for user-friendly errors before hitting the DB.

---

## 6. Authorization (RLS — the deep-dive showcase)

RLS is enabled on every table. The `authenticated` role has no direct privileges except what RLS grants.

### `profiles`
- **SELECT**: `id = auth.uid()` OR `(SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'`
- **INSERT/UPDATE/DELETE**: nobody (managed by trigger only)

### `categories`
- **SELECT**: all authenticated users
- **INSERT/UPDATE/DELETE**: nobody (managed via migrations/seed only)

### `purchase_requests`
- **SELECT**: `applicant_id = auth.uid()` OR `(SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'`
- **INSERT**: `applicant_id = auth.uid()` AND `status = 'pending'` AND `decided_at IS NULL` AND `decided_by IS NULL`
- **UPDATE**: `(SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'` — applies only to status/decision columns; the BEFORE trigger blocks invalid transitions and the CHECK constraint blocks malformed decision data
- **DELETE**: nobody

### `approval_history`
- **SELECT**: `request_id IN (SELECT id FROM purchase_requests)` — leverages RLS on `purchase_requests` to determine visibility (Postgres composes RLS through subqueries)
- **INSERT/UPDATE/DELETE**: nobody (trigger uses SECURITY DEFINER to bypass)

### Defense-in-depth at the API layer
Server Actions also call `require-role('admin')` before approving/rejecting. RLS is the last line of defense; the API layer gives clearer errors and avoids hitting Postgres for obviously-wrong requests.

---

## 7. State machine

`lib/domain/status.ts`:

```ts
export type Status = 'pending' | 'approved' | 'rejected'
const TRANSITIONS: Record<Status, readonly Status[]> = {
  pending: ['approved', 'rejected'],
  approved: [],
  rejected: [],
}
export function canTransition(from: Status, to: Status): boolean {
  return TRANSITIONS[from].includes(to)
}
```

Approved and rejected are terminal — no resubmission flow in this scope.

---

## 8. Routes & screens

| Path | Type | Who | Purpose |
|---|---|---|---|
| `/login` | RSC + client form | Public | Email + password login (Supabase Auth) |
| `/` | RSC | Auth required | Redirects to `/requests` |
| `/requests` | RSC | Auth required | Employee: list own requests, newest first. Admin: list all + filter by status, applicant. |
| `/requests/new` | RSC + client form | Employee or admin | Create a new request |
| `/requests/[id]` | RSC | Auth required | Detail view with metadata, status badge, history timeline. Admin sees the approve/reject panel when status is `pending`. |

Top navigation in the authenticated shell shows: current user name, role badge, "New request" button, logout. The role badge and a `[Dev only] reseed` link are visible only when `NEXT_PUBLIC_DEV_HELPERS=true`.

---

## 9. Server actions (mutations)

All in `app/(app)/requests/_actions.ts`:

- **`createRequest(prevState, formData): Promise<ActionResult>`**
  1. `requireUser()` → throw redirect if no session
  2. Parse `formData` with `createRequestSchema`; if fail, return field errors
  3. Insert via `requests.repo.create({...parsed, applicant_id: user.id})`
  4. Revalidate `/requests` and redirect to `/requests/[id]`

- **`decideRequest(requestId, decision, prevState, formData): Promise<ActionResult>`**
  1. `requireUser()` then `requireRole('admin')`
  2. Parse `decideRequestSchema` (status + optional note; note required if rejecting)
  3. Domain check: `canTransition(current, decision)` (read current row first)
  4. Update via `requests.repo.decide({id, decision, decided_by: user.id, note})`
  5. Revalidate `/requests` and `/requests/[id]`

Return shape:
```ts
type ActionResult =
  | { ok: true }
  | { ok: false; fieldErrors: Record<string, string[]>; formError?: string }
```

---

## 10. Error handling & UX

| Source | Handling |
|---|---|
| Zod validation | Return `fieldErrors` to the form via `useFormState`; inline rendering |
| Domain transition error | Return `formError: '無効なステータス遷移です'` and log with context |
| RLS denial (Postgres error code `42501` or PGRST301) | `console.error({ op, userId, err })`; return generic `formError: '操作が許可されていません'` |
| Auth session missing | `redirect('/login')` |
| Unknown error | Re-throw to nearest `error.tsx`; render reset button |
| Loading states | `Suspense` + skeleton in list/detail RSCs; button `disabled` during action pending |
| Success feedback | shadcn/ui `sonner` toast: "申請を作成しました" / "承認しました" / "却下しました" |

---

## 11. Testing strategy

Target: ~12 tests, all green in CI / locally, runnable in under 30 seconds.

### Domain unit tests (no DB) — `tests/domain/`
1. `canTransition('pending','approved')` is `true`
2. `canTransition('pending','rejected')` is `true`
3. `canTransition('approved','pending')` is `false`
4. `canTransition('approved','rejected')` is `false`
5. `canTransition('rejected','approved')` is `false`

### Validation unit tests (no DB) — `tests/validation/`
6. `createRequestSchema` rejects `amount_jpy <= 0`
7. `createRequestSchema` rejects empty title
8. `createRequestSchema` rejects title > 120 chars
9. `decideRequestSchema` requires `note` when `status='rejected'`

### Repository integration tests (live local Supabase) — `tests/repositories/`
10. Employee can `INSERT` and `SELECT` their own row but not another employee's row (RLS)
11. Admin can `SELECT` all rows and `UPDATE` status from pending → approved (RLS + trigger)
12. After `UPDATE status`, `approval_history` has exactly one new row with correct `from_status`/`to_status`/`actor_id` (trigger contract)

Integration tests sign in two seeded test users via the Supabase JS client to exercise real RLS behavior. They run against the **linked Supabase Cloud project** using the URL and keys in `.env.local`. There is no local Docker stack. The `beforeAll` hook clears `purchase_requests` and `approval_history` so tests are repeatable. Tests mutate data only in the linked project; the reviewer's own project is naturally isolated. CI is deferred — see §13 YAGNI cuts.

---

## 12. Setup & reproducibility (the "clone → README → runs" path)

Reviewer experience (Supabase Cloud path; the assignment explicitly endorses "document service setup in README" as a valid reproducibility option):

```bash
# 1. Prerequisites listed in README:
#    - Node.js 20+, pnpm
#    (The Supabase CLI is a project dev dependency installed by `pnpm install`,
#     so no separate system install is required. No Docker required.)

# 2. Create a free Supabase Cloud project
#    - Sign up at https://supabase.com (free, takes 1 minute)
#    - Click "New project", choose a name and region, set a database password.
#    - Wait ~2 minutes for provisioning to finish.
#    - From Project Settings → API, copy:
#        * Project URL
#        * anon public key
#        * service_role key
#    - From Project Settings → General, copy the Reference ID (project ref).

# 3. Clone & install
git clone https://github.com/<user>/equipment-purchase-request-app.git
cd equipment-purchase-request-app
pnpm install

# 4. Copy env example and fill in the four values from step 2
cp .env.example .env.local
# Edit .env.local in your editor; placeholders explain each variable.

# 5. Link the local CLI to your Supabase project, apply migrations, seed users
pnpm setup
# This wraps:
#   pnpm exec supabase login          # browser-based one-time auth
#   pnpm exec supabase link --project-ref <SUPABASE_PROJECT_REF>
#   pnpm exec supabase db push        # applies all migrations to your cloud project
#   pnpm db:seed-users                # creates employee@example.com and admin@example.com
#   pnpm db:types                     # generates types/supabase.ts from the linked project

# 6. Run dev server
pnpm dev

# 7. Open http://localhost:3000
#    Log in as employee@example.com / password (documented in README)
#    Log in as admin@example.com / password (documented in README)
```

`.env.example` documents:
- `NEXT_PUBLIC_SUPABASE_URL` — placeholder `https://<your-project-ref>.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — placeholder, instructions point to Project Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` — placeholder; clearly labeled as server-only, never imported in client code
- `SUPABASE_PROJECT_REF` — placeholder; used by `supabase link`
- `SEED_EMPLOYEE_EMAIL` / `SEED_EMPLOYEE_PASSWORD` / `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — defaults provided
- `NEXT_PUBLIC_DEV_HELPERS=true` (optional)

Notes on the Cloud path:
- The reviewer's own Supabase project is isolated; nothing in our repo touches our (developer's) Supabase project.
- The free tier is sufficient for this assignment.
- The integration tests in Task 24 run against the reviewer's linked project — they mutate `purchase_requests` and `approval_history` only, clean up in `beforeAll`, and are bounded in scale.

---

## 13. YAGNI cuts (will be listed in README "compromises")

Explicitly out of scope to respect the 6–8h budget:
1. Multi-step approval routing (manager → admin)
2. Amount-based approval routing rules
3. Resubmission flow after rejection (terminal states stay terminal)
4. File attachments (receipts, quotes)
5. Email or Slack notifications
6. Real-time updates via Supabase Realtime
7. Pagination beyond the first 100 rows
8. i18n / language switcher (UI Japanese only)
9. End-to-end browser tests (Playwright/Cypress)
10. GitHub Actions CI workflow (deferred; mentioned as future work)
11. Vercel preview deployment (optional stretch — see §16)

---

## 14. Language

- **UI labels:** Japanese (matches assignment language and likely-Japanese reviewer audience)
- **README:** Bilingual — Japanese primary, English secondary (mirrors the bilingual Notion assignment page; demonstrates clarity for international reviewers if any)
- **Code comments / commit messages / spec / plan:** English (project working language)

---

## 15. Orchestration plan — skills, subagents, MCP

| Phase | Skills / Subagents / MCP used |
|---|---|
| **Spec writing (now)** | `brainstorming` skill — present spec, get user approval, commit |
| **Plan writing** | `writing-plans` skill → save to `docs/superpowers/plans/2026-05-20-equipment-purchase-request.md` |
| **Repo creation** | `user-github` MCP — create public repo `equipment-purchase-request-app` |
| **Project scaffold** | `shell` subagent — `pnpm create next-app@latest` with non-interactive flags; initialize Supabase CLI |
| **Latest docs lookup** | `user-context7` MCP — fetch current Next.js 15 App Router + Supabase RLS docs before writing code (avoid stale knowledge) |
| **DB migrations & RLS** | `user-supabase` MCP for direct schema inspection; `supabase` CLI for migrations |
| **Per-task implementation** | `subagent-driven-development` skill — fresh subagent per task; `code-reviewer` subagent reviews between tasks; `executing-plans` skill as fallback |
| **Debugging** | `systematic-debugging` skill whenever a test fails or runtime error appears |
| **UI library** | `shadcn` skill — selective component install only |
| **Next.js patterns** | `nextjs` skill (Vercel skill set) for App Router / RSC / Server Action patterns |
| **E2E verification** | `verification-before-completion` skill + `browser-use` subagent — clicks through both roles in a real browser |
| **CI investigation** | `ci-investigator` subagent — only if we add GitHub Actions (stretch) |
| **Submission** | `finishing-a-development-branch` skill — README, PR/release, optional deploy |

---

## 16. Open / deferred decisions

- **Repo name:** default `equipment-purchase-request-app`. Confirm before repo creation.
- **README language ratio:** Japanese-primary + English-secondary, or single bilingual file. Decide during README task.
- **Vercel preview deploy:** out of v1 scope; add only if budget remains.
- **GitHub Actions CI:** out of v1 scope; add only if budget remains.
- **Dev user-switcher widget:** dropped in favor of two-tab login per role; reviewer logs in with the two seeded accounts.

---

## 17. Self-review summary

The author re-read this spec after writing for placeholders, contradictions, ambiguity, and scope:

- **Placeholders:** none — no "TBD", "TODO", or vague requirements remain. Open decisions in §16 are explicit and bounded.
- **Internal consistency:** the data model in §4, RLS in §6, server actions in §9, and tests in §11 reference the same column names and state values throughout.
- **Scope:** single subsystem, fits one implementation plan, matches the 6–8h budget per §13 cuts.
- **Ambiguity:** every requirement has one interpretation. State transitions are explicit. Error handling lists all sources.

Ready for user review.
