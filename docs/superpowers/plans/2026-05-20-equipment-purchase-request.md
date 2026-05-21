# Equipment Purchase Request App Implementation Plan

> **Execution mode:** Inline batch execution only. Do not use multiple parallel/asynchronous subagents for this project. Execute one small batch at a time, verify, then continue so the user and Codex can monitor progress clearly.

**Goal:** Build a Next.js + Supabase prototype for an internal equipment purchase request workflow, with a Design / Business Logic deep-dive (extended schema, RLS, audit trigger, Zod validation, Vitest tests).

**Q6 — Effort budget / working style:** Minimize implementation time while still reaching a B+ or better submission. The target is a clean, reproducible, reviewer-friendly prototype, not a maximal build. Start from a clean slate inside the existing git repository: preserve `.git` and the project docs, remove the current app scaffold, install a fresh Next.js app first, then execute the implementation plan in small monitored batches.

**Architecture:** Next.js 15 App Router with RSC for reads and Server Actions for writes. Supabase Postgres holds the data; RLS is the primary authorization mechanism. Domain logic (state machine, validation) lives in pure-TS modules independent of Supabase. Tests cover domain + validation + repository-against-linked-cloud-Supabase.

**Tech Stack:** Next.js (latest stable) + TypeScript (strict) + Tailwind + ESLint + shadcn/ui (selective) + Supabase Cloud (free tier) + Supabase CLI (project-local dev dep, used for migrations against the linked cloud project) + `@supabase/supabase-js` + `@supabase/ssr` + Zod + Vitest + pnpm.

**Reproducibility model:** Supabase Cloud, NOT local Docker. The Supabase CLI is used in `--linked` mode (`supabase link` → `supabase db push` → `supabase gen types --linked`). Reviewer creates their own free Supabase project (~5 min from clone to running app). The assignment's reproducibility rubric explicitly endorses "document service setup in the README" as one of three valid paths for external services.

**Reference spec:** `docs/superpowers/specs/2026-05-20-equipment-purchase-request-design.md`

**Conventions for every task:**
- Working directory is the repo root unless otherwise noted.
- Commit after each coherent batch with the format `[修正]<message>` when the batch is verified.
- All Supabase CLI commands target the linked Supabase Cloud project (no Docker, no local stack). Linking is established in Task 3.
- TypeScript is strict; no `any` without comment justifying it.

---

## Phase 1 — Project bootstrap

### Task 1: Clean-slate reset inside the existing git repo

**Files:**
- Preserve: `.git/`, `docs/superpowers/specs/2026-05-20-equipment-purchase-request-design.md`, `docs/superpowers/plans/2026-05-20-equipment-purchase-request.md`
- Remove before scaffolding: current app scaffold and generated dependencies (`app/`, `.next/`, `node_modules/`, `public/`, package/config files, lockfiles)

- [ ] **Step 1: Confirm current repo state**

Run:
```powershell
git status --short
git rev-parse --is-inside-work-tree
```
Expected: repository is valid. Review the dirty files before cleanup.

- [ ] **Step 2: Remove the current scaffold only after explicit confirmation**

Because this is destructive, confirm with the user before running cleanup. Do not remove `.git/` or `docs/`.

Planned cleanup targets:
```text
.next/
node_modules/
app/
public/
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
next-env.d.ts
next.config.ts
postcss.config.mjs
eslint.config.mjs
tsconfig.json
```

- [ ] **Step 3: Verify clean slate**

Run:
```powershell
Get-ChildItem -Force
git status --short
```
Expected: only `.git/`, docs, and intentional repo metadata remain.

- [ ] **Step 4: Commit the clean-slate baseline if useful**

If the cleanup produces a meaningful baseline, commit it:
```bash
git add -A
git commit -m "[修正]reset project to clean slate before Next.js scaffold"
```

---

### Task 2: Scaffold Next.js

**Files:**
- Create: package.json, tsconfig.json, next.config.ts, postcss.config.mjs, tailwind.config.ts (or equivalent v4 config), app/, public/, .gitignore, eslint.config.mjs

- [ ] **Step 1: Run create-next-app non-interactively**

Run from the repo root:
```bash
pnpm create next-app@latest . --ts --tailwind --eslint --app --src-dir=false --import-alias "@/*" --use-pnpm --turbopack
```
Expected: Project scaffolded into the current directory; pnpm-lock.yaml generated.
If create-next-app refuses to run in a non-empty directory, temporarily move `docs/` aside, run the scaffold, then move `docs/` back.

- [ ] **Step 2: Verify it builds and runs**

Run:
```bash
pnpm build
```
Expected: `Compiled successfully`. No errors.

- [ ] **Step 3: Strip the boilerplate landing page**

Replace `app/page.tsx` with:
```tsx
export default function Home() {
  return null
}
```
This will be replaced with a real route in Task 21. The point now is to remove the demo content so future diffs are clean.

- [ ] **Step 4: Verify build still succeeds**

Run:
```bash
pnpm build
```
Expected: PASS.

- [ ] **Step 5: Commit**

Run:
```bash
git add -A
git commit -m "[修正]scaffold Next.js with TS, Tailwind, ESLint, App Router"
```

---

### Task 3: Initialize Supabase project layout and link to cloud project

> Execute AFTER Task 4 (the CLI is installed there). Keeps task numbering for traceability.
>
> Reproducibility model: **Supabase Cloud** — no local Docker. The local Supabase directory is linked to a remote project so migrations are pushed with `supabase db push`.

**Pre-requisite (one-time, by the developer):** A free Supabase Cloud project must exist. From the dashboard, collect:
- **Project URL** (e.g., `https://<ref>.supabase.co`)
- **anon public key** (Project Settings → API → "anon" public)
- **service_role key** (Project Settings → API → "service_role" — server-only secret)
- **Project ref** (Project Settings → General → Reference ID)
- **Database password** (the one you set when creating the project)

These values are inserted into `.env.local` in Task 6 (not committed). The project ref also feeds the `supabase link` command.

**Files:**
- Create: `supabase/config.toml`, `supabase/.gitignore`, `supabase/seed.sql`
- Modify: `.gitignore`

- [ ] **Step 1: Verify the project-local Supabase CLI is available**

Run:
```bash
pnpm exec supabase --version
```
Expected: a version string (e.g., `2.x.x`).

- [ ] **Step 2: Initialize the Supabase project layout**

Run:
```bash
pnpm exec supabase init
```
Expected: `supabase/config.toml`, `supabase/.gitignore`, `supabase/seed.sql` (empty) created. This initializes the local directory only; no local stack is started.

- [ ] **Step 3: Update `.gitignore`**

Append to the repo-root `.gitignore`:
```text
# Supabase
supabase/.branches
supabase/.temp
**/.supabase
```

- [ ] **Step 4: One-time CLI authentication against Supabase Cloud**

Run:
```bash
pnpm exec supabase login
```
Expected: opens a browser to authenticate against your Supabase account. The CLI stores an access token in `%USERPROFILE%\.supabase` (Windows). This is a developer-machine-only step; nothing is added to the repo.

- [ ] **Step 5: Link the project directory to your Supabase Cloud project**

Run (PowerShell):
```powershell
$env:SUPABASE_PROJECT_REF = "<paste your project ref here>"
pnpm exec supabase link --project-ref $env:SUPABASE_PROJECT_REF
```
Supply the database password when prompted. Expected: a `supabase/.temp/project-ref` file is written; the link persists across runs.

- [ ] **Step 6: Verify the link by pulling the (empty) remote schema**

Run:
```bash
pnpm exec supabase db pull --schema public
```
Expected: completes cleanly. The remote `public` schema is currently empty, so nothing is added to `supabase/migrations`. If this fails, the link or credentials are wrong — fix before continuing.

- [ ] **Step 7: Commit**

Run:
```bash
git add -A
git commit -m "[修正]initialize Supabase project layout and link to cloud project"
```

---

### Task 4: Install runtime dependencies

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install Supabase + Zod**

Run:
```bash
pnpm add @supabase/supabase-js @supabase/ssr zod
```
Expected: three packages installed at latest versions; lockfile updated.

- [ ] **Step 2: Install the Supabase CLI as a project dev dependency**

Run:
```bash
pnpm add -D supabase
```
This pulls the CLI binary into `node_modules/.bin/supabase`. We deliberately avoid a system-wide CLI install so reviewers don't need a separate Supabase install — they only need Node and pnpm. All `supabase ...` invocations in this plan resolve to the project-local CLI when run via pnpm scripts (pnpm puts `node_modules/.bin` on PATH automatically). For ad-hoc CLI use outside scripts, run `pnpm exec supabase <command>`.

- [ ] **Step 3: Commit**

Run:
```bash
git add package.json pnpm-lock.yaml
git commit -m "[修正]add @supabase/supabase-js, @supabase/ssr, zod, supabase CLI"
```

---

### Task 5: Install dev dependencies and configure Vitest

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`
- Create: `vitest.config.ts`, `tests/setup.ts`

- [ ] **Step 1: Install Vitest + supporting libraries**

Run:
```bash
pnpm add -D vitest @vitest/coverage-v8 tsx dotenv-cli
```
- `tsx` is used to run the seed-users TypeScript script in Task 17.
- `dotenv-cli` is used so the `test:integration` script loads `.env.local` for the Supabase URL/keys.

- [ ] **Step 2: Create `vitest.config.ts`**

Create file `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 3: Create `tests/setup.ts`**

Create file `tests/setup.ts`:
```ts
// Reserved for future global hooks (e.g., truncate tables between integration tests).
// Currently a no-op so vitest can load without warnings.
export {}
```

- [ ] **Step 4: Add npm scripts**

Edit `package.json` and merge into the `scripts` block:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run --exclude tests/repositories",
    "test:integration": "dotenv -e .env.local -- vitest run tests/repositories",
    "test:all": "pnpm test && pnpm test:integration",
    "setup": "pnpm exec supabase login && pnpm exec supabase link && pnpm exec supabase db push && pnpm db:seed-users && pnpm db:types",
    "db:push": "pnpm exec supabase db push",
    "db:seed-users": "dotenv -e .env.local -- tsx supabase/seed-users.ts",
    "db:types": "pnpm exec supabase gen types typescript --linked --schema=public > types/supabase.ts"
  }
}
```
Notes:
- `setup` is the one-command reviewer onboarding: it asks them to log in, link, push migrations, seed users, and regenerate types.
- `db:push` applies pending local migration files to the linked cloud project.
- `db:seed-users` loads `.env.local` so the seed script has the cloud URL + service-role key.
- `db:types` uses `--linked` (against the cloud project) rather than `--local` (which would require a Docker stack we no longer run).

- [ ] **Step 5: Verify `pnpm test` exits cleanly with "no tests found"**

Run:
```bash
pnpm test
```
Expected: Vitest reports `No test files found`. Exit code 0 or 1 — both acceptable for the empty case; we'll add tests in Task 19.

- [ ] **Step 6: Commit**

Run:
```bash
git add -A
git commit -m "[修正]add Vitest, tsx, dotenv-cli, and project scripts"
```

---

### Task 6: Create `.env.example` and `.env.local`

**Files:**
- Create: `.env.example`, `.env.local`
- Modify: `.gitignore` (already excludes `.env*.local` from create-next-app default — verify)

- [ ] **Step 1: Confirm `.gitignore` excludes `.env*.local`**

Read `.gitignore`. It should contain a line like `.env*.local`. If not, append it.

- [ ] **Step 2: Create `.env.example`**

Create file `.env.example`:
```text
# === Supabase Cloud project credentials ===
# Get these from your project at https://supabase.com/dashboard
# (Project Settings → API for URL and keys; Project Settings → General for Reference ID.)
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
# WARNING: service_role bypasses RLS. Server-only. Never imported in client code.
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
# Project ref is also used by `supabase link --project-ref <ref>`.
SUPABASE_PROJECT_REF=<your-project-ref>

# === Seeded test users (created by `pnpm db:seed-users` in your project) ===
SEED_EMPLOYEE_EMAIL=employee@example.com
SEED_EMPLOYEE_PASSWORD=Employee123!
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=Admin123!

# === Optional ===
# When "true", shows a small role badge + dev hints in the UI.
NEXT_PUBLIC_DEV_HELPERS=true
```
Notes:
- All four Supabase values are placeholders. The reviewer (and you) replace them with credentials from their own free Supabase Cloud project. See `README.md` setup section for the click-by-click flow.
- The seed user emails/passwords default to known values so the README can document them; override only if you want different credentials.

- [ ] **Step 3: Copy to `.env.local`**

Run:
```bash
Copy-Item .env.example .env.local
```

- [ ] **Step 4: Commit**

Run:
```bash
git add .env.example
git commit -m "[修正]add .env.example with local Supabase defaults"
```
(`.env.local` is git-ignored.)

---

## Phase 2 — Database schema and policies (against Supabase Cloud, no local Docker)

Each migration goes in `supabase/migrations/<timestamp>_<name>.sql`. Use `pnpm exec supabase migration new <name>` to generate the timestamped filename, then paste the SQL into it.

**IMPORTANT for every command in Phase 2:**
1. The Supabase CLI is a project-local dev dependency (installed in Task 4). When invoking it outside a `package.json` script, always prefix with `pnpm exec`.
2. Migrations are pushed to your **linked Supabase Cloud project** using `pnpm exec supabase db push` (NOT `db reset` — that requires a local Docker stack which we don't run).
3. `db push` applies all migration files that haven't been recorded in the linked project's `supabase_migrations.schema_migrations` ledger. It does NOT drop tables. To "undo" a migration during development, write a forward migration that reverses it.
4. To verify the cloud schema matches your local migrations, use `pnpm exec supabase db diff --linked --schema public`. Expected output when in sync: empty.

### Task 7: Migration — `profiles` table and auth trigger

**Files:**
- Create: `supabase/migrations/<ts>_profiles.sql`

- [ ] **Step 1: Generate the migration file**

Run:
```bash
pnpm exec supabase migration new profiles
```
Expected: `supabase/migrations/<timestamp>_profiles.sql` created (empty).

- [ ] **Step 2: Write the migration SQL**

Open the new file and replace its contents with:
```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('employee','admin')),
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);

create or replace function public.tg_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
begin
  v_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );
  insert into public.profiles(id, email, full_name, role)
  values (new.id, new.email, v_full_name, 'employee');
  return new;
end;
$$;

drop trigger if exists tg_handle_new_user on auth.users;
create trigger tg_handle_new_user
after insert on auth.users
for each row execute function public.tg_handle_new_user();
```

- [ ] **Step 3: Push migration to linked cloud project**

Run:
```bash
pnpm exec supabase db push
```
Expected: the new migration is applied to your linked Supabase Cloud project. The CLI prints which migrations were applied. Verify in Dashboard → Database → Tables that `profiles` now exists.

- [ ] **Step 4: Verify `profiles` table exists**

Run:
```bash
pnpm exec supabase db diff --linked --schema public
```
Expected: empty diff (schema matches migrations). If there is a diff, fix the migration.

- [ ] **Step 5: Commit**

Run:
```bash
git add supabase/migrations
git commit -m "[修正]add profiles table and auth.users insert trigger"
```

---

### Task 8: Migration — `categories` table with seed rows inline

> Cloud-mode note: `supabase db push` does NOT auto-run `seed.sql`. To stay reproducible across reviewer projects, the categories seed is included **inside the migration file** with `ON CONFLICT DO NOTHING`, which is idempotent — safe to push multiple times.

**Files:**
- Create: `supabase/migrations/<ts>_categories.sql`

- [ ] **Step 1: Generate the migration**

Run:
```bash
pnpm exec supabase migration new categories
```

- [ ] **Step 2: Write the migration (table + idempotent seed)**

Replace the new migration file with:
```sql
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.categories (name, sort_order) values
  ('オフィス備品', 10),
  ('PC・周辺機器', 20),
  ('ソフトウェアライセンス', 30),
  ('書籍・学習', 40),
  ('その他', 99)
on conflict (name) do nothing;
```

- [ ] **Step 3: Push to the linked cloud project**

Run:
```bash
pnpm exec supabase db push
```
Expected: the new migration is applied; categories are populated.

- [ ] **Step 4: Verify count via the Supabase dashboard or a quick script**

Open your Supabase Cloud project → SQL Editor and run:
```sql
select count(*) from public.categories;
```
Expected: `5`. (You can also write a one-off `tsx` script using `@supabase/supabase-js` with the anon key, but the dashboard SQL Editor is the simplest check.)

- [ ] **Step 5: Commit**

Run:
```bash
git add -A
git commit -m "[修正]add categories table with idempotent seed rows"
```

---

### Task 9: Migration — `purchase_requests` table with constraints

**Files:**
- Create: `supabase/migrations/<ts>_purchase_requests.sql`

- [ ] **Step 1: Generate migration**

Run:
```bash
pnpm exec supabase migration new purchase_requests
```

- [ ] **Step 2: Write migration**

Replace file contents with:
```sql
create table if not exists public.purchase_requests (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.profiles(id),
  category_id uuid not null references public.categories(id),
  title text not null check (length(title) between 1 and 120),
  description text check (description is null or length(description) <= 1000),
  amount_jpy integer not null check (amount_jpy > 0 and amount_jpy <= 10000000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles(id),
  decision_note text check (decision_note is null or length(decision_note) <= 500),
  constraint pending_has_no_decision check (
    (status = 'pending' and decided_at is null and decided_by is null and decision_note is null)
    or status <> 'pending'
  ),
  constraint decided_has_decider check (
    (status in ('approved','rejected') and decided_at is not null and decided_by is not null)
    or status = 'pending'
  ),
  constraint rejected_requires_note check (
    status <> 'rejected' or decision_note is not null
  )
);

create index if not exists purchase_requests_applicant_idx
  on public.purchase_requests(applicant_id, requested_at desc);
create index if not exists purchase_requests_status_idx
  on public.purchase_requests(status, requested_at desc);
```

- [ ] **Step 3: Apply and verify schema**

Run:
```bash
pnpm exec supabase db push
pnpm exec supabase db diff --linked --schema public
```
Expected: empty diff.

- [ ] **Step 4: Commit**

Run:
```bash
git add -A
git commit -m "[修正]add purchase_requests table with constraints and indexes"
```

---

### Task 10: Migration — `approval_history` table

**Files:**
- Create: `supabase/migrations/<ts>_approval_history.sql`

- [ ] **Step 1: Generate migration**

Run:
```bash
pnpm exec supabase migration new approval_history
```

- [ ] **Step 2: Write migration**

Replace file contents with:
```sql
create table if not exists public.approval_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.purchase_requests(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  from_status text not null,
  to_status text not null,
  note text,
  acted_at timestamptz not null default now()
);

create index if not exists approval_history_request_idx
  on public.approval_history(request_id, acted_at desc);
```

- [ ] **Step 3: Apply and verify**

Run:
```bash
pnpm exec supabase db push
pnpm exec supabase db diff --linked --schema public
```
Expected: empty diff.

- [ ] **Step 4: Commit**

Run:
```bash
git add -A
git commit -m "[修正]add approval_history audit table"
```

---

### Task 11: Migration — status transition trigger

**Files:**
- Create: `supabase/migrations/<ts>_status_transition.sql`

- [ ] **Step 1: Generate migration**

Run:
```bash
pnpm exec supabase migration new status_transition
```

- [ ] **Step 2: Write migration**

Replace file contents with:
```sql
create or replace function public.tg_enforce_status_transition()
returns trigger
language plpgsql
as $$
begin
  if old.status is distinct from new.status then
    if old.status = 'pending' and new.status in ('approved','rejected') then
      return new;
    end if;
    raise exception 'invalid status transition: % -> %', old.status, new.status
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists tg_enforce_status_transition on public.purchase_requests;
create trigger tg_enforce_status_transition
before update of status on public.purchase_requests
for each row execute function public.tg_enforce_status_transition();
```

- [ ] **Step 3: Apply and sanity-check the trigger**

Run:
```bash
pnpm exec supabase db push
```
Then open the Supabase dashboard for your linked project → SQL Editor, and paste the following test script. Run sections individually so you can see the expected failure on the reverse-transition step.
```sql
-- Use the auth admin extension to create a throwaway user. The profiles
-- trigger auto-creates a corresponding profiles row.
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
values ('00000000-0000-0000-0000-000000000001', 'trigger-probe@example.com', '', now(), jsonb_build_object('full_name', 'probe user'));

insert into purchase_requests (applicant_id, category_id, title, amount_jpy)
  select '00000000-0000-0000-0000-000000000001', id, 'probe', 100 from categories limit 1;

-- Legal transition (pending → rejected with required note):
update purchase_requests
   set status='rejected', decided_at=now(),
       decided_by='00000000-0000-0000-0000-000000000001',
       decision_note='no'
 where status='pending' returning id;

-- Illegal transition (rejected → pending) — expect the trigger to raise:
update purchase_requests set status='pending' where status='rejected';
-- Expected error: invalid status transition: rejected -> pending

-- Cleanup:
delete from purchase_requests where applicant_id = '00000000-0000-0000-0000-000000000001';
delete from auth.users where id = '00000000-0000-0000-0000-000000000001';
```
Expected: the third `update` fails with the trigger error; the cleanup at the end succeeds.

If the trigger does NOT raise on the illegal transition, the migration didn't push cleanly — re-run Step 1 and verify in Dashboard → Database → Functions that `tg_enforce_status_transition` exists.

- [ ] **Step 4: Commit**

Run:
```bash
git add -A
git commit -m "[修正]add status transition trigger"
```

---

### Task 12: Migration — approval_history trigger

**Files:**
- Create: `supabase/migrations/<ts>_approval_history_trigger.sql`

- [ ] **Step 1: Generate migration**

Run:
```bash
pnpm exec supabase migration new approval_history_trigger
```

- [ ] **Step 2: Write migration**

Replace file contents with:
```sql
create or replace function public.tg_write_approval_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.approval_history(request_id, actor_id, from_status, to_status, note)
    values (new.id, auth.uid(), old.status, new.status, new.decision_note);
  end if;
  return new;
end;
$$;

drop trigger if exists tg_write_approval_history on public.purchase_requests;
create trigger tg_write_approval_history
after update of status on public.purchase_requests
for each row execute function public.tg_write_approval_history();
```

- [ ] **Step 3: Apply and verify schema**

Run:
```bash
pnpm exec supabase db push
pnpm exec supabase db diff --linked --schema public
```
Expected: empty diff.

- [ ] **Step 4: Commit**

Run:
```bash
git add -A
git commit -m "[修正]add approval_history write trigger"
```

---

### Task 13: Migration — Row Level Security policies

**Files:**
- Create: `supabase/migrations/<ts>_rls.sql`

- [ ] **Step 1: Generate migration**

Run:
```bash
pnpm exec supabase migration new rls
```

- [ ] **Step 2: Write migration**

Replace file contents with:
```sql
-- Enable RLS on all tables.
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.purchase_requests enable row level security;
alter table public.approval_history enable row level security;

-- Helper: is current user admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles
create policy "profiles_select_self_or_admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

-- categories: all authenticated users can read; no writes
create policy "categories_select_all"
  on public.categories for select
  to authenticated
  using (true);

-- purchase_requests
create policy "purchase_requests_select_own_or_admin"
  on public.purchase_requests for select
  to authenticated
  using (applicant_id = auth.uid() or public.is_admin());

create policy "purchase_requests_insert_own"
  on public.purchase_requests for insert
  to authenticated
  with check (
    applicant_id = auth.uid()
    and status = 'pending'
    and decided_at is null
    and decided_by is null
    and decision_note is null
  );

create policy "purchase_requests_update_admin"
  on public.purchase_requests for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- (no delete policy → nobody can delete)

-- approval_history: visibility inherits from purchase_requests via RLS subselect.
create policy "approval_history_select_via_request"
  on public.approval_history for select
  to authenticated
  using (
    exists (select 1 from public.purchase_requests pr where pr.id = approval_history.request_id)
  );
-- inserts only via trigger (security definer); no insert policy granted to authenticated.
```

- [ ] **Step 3: Apply and verify**

Run:
```bash
pnpm exec supabase db push
pnpm exec supabase db diff --linked --schema public
```
Expected: empty diff.

- [ ] **Step 4: Commit**

Run:
```bash
git add -A
git commit -m "[修正]enable RLS and add policies for all tables"
```

---

### Task 14: Seed users script

**Files:**
- Create: `supabase/seed-users.ts`

- [ ] **Step 1: Write the seed script**

Create file `supabase/seed-users.ts`:
```ts
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.')
  process.exit(1)
}

const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } })

type Seed = {
  email: string
  password: string
  fullName: string
  role: 'employee' | 'admin'
}

const seeds: Seed[] = [
  {
    email: process.env.SEED_EMPLOYEE_EMAIL ?? 'employee@example.com',
    password: process.env.SEED_EMPLOYEE_PASSWORD ?? 'Employee123!',
    fullName: '一般 太郎',
    role: 'employee',
  },
  {
    email: process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com',
    password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!',
    fullName: '管理 花子',
    role: 'admin',
  },
]

async function upsertUser(seed: Seed) {
  // List existing users (paginated). For local seeding the user list is small.
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 200 })
  if (listErr) throw listErr
  const existing = list.users.find((u) => u.email === seed.email)
  let userId: string
  if (existing) {
    userId = existing.id
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: seed.email,
      password: seed.password,
      email_confirm: true,
      user_metadata: { full_name: seed.fullName },
    })
    if (error) throw error
    userId = data.user.id
  }
  const { error: updErr } = await admin
    .from('profiles')
    .update({ role: seed.role, full_name: seed.fullName })
    .eq('id', userId)
  if (updErr) throw updErr
  console.log(`seeded ${seed.role}: ${seed.email} (${userId})`)
}

async function main() {
  for (const s of seeds) await upsertUser(s)
  console.log('seed-users done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
```

- [ ] **Step 2: Verify it runs against the linked cloud project**

Make sure all migrations are pushed first (run `pnpm exec supabase db push` if you've added migrations since the last push), then run:
```bash
pnpm db:seed-users
```
The script reads `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`, hits the cloud project, creates the two auth users (if not present), and promotes one to `admin` via `profiles.role`. Expected console output:
```
seeded employee: employee@example.com (<uuid>)
seeded admin: admin@example.com (<uuid>)
seed-users done.
```

- [ ] **Step 3: Verify in the dashboard**

In the Supabase Cloud Dashboard for your project, go to **Authentication → Users** — you should see two users (`employee@example.com` and `admin@example.com`). Then **Table Editor → profiles** — confirm one row has `role='employee'` and one has `role='admin'`.

Alternative SQL verification (Dashboard → SQL Editor):
```sql
select email, role from public.profiles order by role;
```
Expected: one row with `role='admin'`, one with `role='employee'`.

- [ ] **Step 4: Commit**

Run:
```bash
git add -A
git commit -m "[修正]add seed-users script for employee+admin"
```

---

### Task 15: Generate TypeScript types from the linked cloud schema

**Files:**
- Create: `types/supabase.ts`

- [ ] **Step 1: Run the type generator (against linked cloud project)**

Run:
```bash
pnpm db:types
```
This wraps `pnpm exec supabase gen types typescript --linked --schema=public`. Expected: `types/supabase.ts` is written with `export type Database = { ... }` covering all tables.

- [ ] **Step 2: Sanity-check the file**

Run:
```bash
pnpm typecheck
```
Expected: PASS.

- [ ] **Step 3: Commit**

Run:
```bash
git add types/supabase.ts package.json
git commit -m "[修正]generate Supabase TS types from local schema"
```

---

## Phase 3 — Domain layer (TDD)

### Task 16: Status state machine

**Files:**
- Create: `lib/domain/status.ts`
- Test: `tests/domain/status.test.ts`

- [ ] **Step 1: Write the failing test**

Create file `tests/domain/status.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { canTransition, type Status } from '@/lib/domain/status'

describe('canTransition', () => {
  it('allows pending -> approved', () => {
    expect(canTransition('pending', 'approved')).toBe(true)
  })
  it('allows pending -> rejected', () => {
    expect(canTransition('pending', 'rejected')).toBe(true)
  })
  it('disallows approved -> pending', () => {
    expect(canTransition('approved', 'pending')).toBe(false)
  })
  it('disallows approved -> rejected', () => {
    expect(canTransition('approved', 'rejected')).toBe(false)
  })
  it('disallows rejected -> approved', () => {
    expect(canTransition('rejected', 'approved')).toBe(false)
  })
  it('disallows same-status transitions', () => {
    const all: Status[] = ['pending', 'approved', 'rejected']
    for (const s of all) expect(canTransition(s, s)).toBe(false)
  })
})
```

- [ ] **Step 2: Run the tests; expect them to fail**

Run:
```bash
pnpm test
```
Expected: 6 failing tests (module not found).

- [ ] **Step 3: Implement minimal code**

Create file `lib/domain/status.ts`:
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

- [ ] **Step 4: Run tests; expect pass**

Run:
```bash
pnpm test
```
Expected: 6 passing tests.

- [ ] **Step 5: Commit**

Run:
```bash
git add lib/domain/status.ts tests/domain/status.test.ts
git commit -m "[修正]add status state machine with tests"
```

---

### Task 17: Validation schemas

**Files:**
- Create: `lib/validation/request-schemas.ts`
- Test: `tests/validation/request-schemas.test.ts`

- [ ] **Step 1: Write failing tests**

Create file `tests/validation/request-schemas.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import {
  createRequestSchema,
  decideRequestSchema,
} from '@/lib/validation/request-schemas'

describe('createRequestSchema', () => {
  const valid = {
    title: 'モニター購入',
    description: '27インチ 4K',
    amount_jpy: 50000,
    category_id: '00000000-0000-0000-0000-000000000000',
  }

  it('accepts a valid payload', () => {
    expect(createRequestSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects empty title', () => {
    const r = createRequestSchema.safeParse({ ...valid, title: '' })
    expect(r.success).toBe(false)
  })

  it('rejects title over 120 chars', () => {
    const r = createRequestSchema.safeParse({ ...valid, title: 'a'.repeat(121) })
    expect(r.success).toBe(false)
  })

  it('rejects amount <= 0', () => {
    const r = createRequestSchema.safeParse({ ...valid, amount_jpy: 0 })
    expect(r.success).toBe(false)
  })

  it('rejects amount over 10,000,000', () => {
    const r = createRequestSchema.safeParse({ ...valid, amount_jpy: 10_000_001 })
    expect(r.success).toBe(false)
  })

  it('rejects non-uuid category_id', () => {
    const r = createRequestSchema.safeParse({ ...valid, category_id: 'not-a-uuid' })
    expect(r.success).toBe(false)
  })

  it('accepts missing description', () => {
    const { description, ...rest } = valid
    expect(createRequestSchema.safeParse(rest).success).toBe(true)
  })
})

describe('decideRequestSchema', () => {
  it('accepts approve without note', () => {
    expect(
      decideRequestSchema.safeParse({ status: 'approved' }).success,
    ).toBe(true)
  })
  it('requires note when rejecting', () => {
    const r = decideRequestSchema.safeParse({ status: 'rejected' })
    expect(r.success).toBe(false)
  })
  it('accepts reject with note', () => {
    expect(
      decideRequestSchema.safeParse({ status: 'rejected', note: '予算超過のため' }).success,
    ).toBe(true)
  })
  it('rejects unknown status', () => {
    const r = decideRequestSchema.safeParse({ status: 'pending' })
    expect(r.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests; expect fail**

Run:
```bash
pnpm test
```
Expected: 11 failing tests (module not found).

- [ ] **Step 3: Implement schemas**

Create file `lib/validation/request-schemas.ts`:
```ts
import { z } from 'zod'

export const createRequestSchema = z.object({
  title: z.string().trim().min(1, 'タイトルは必須です').max(120, 'タイトルは120文字以内で入力してください'),
  description: z
    .string()
    .max(1000, '説明は1000文字以内で入力してください')
    .optional(),
  amount_jpy: z
    .number({ invalid_type_error: '金額は数値で入力してください' })
    .int('金額は整数で入力してください')
    .positive('金額は1円以上で入力してください')
    .max(10_000_000, '金額は10,000,000円以下で入力してください'),
  category_id: z.string().uuid('カテゴリが正しく選択されていません'),
})

export type CreateRequestInput = z.infer<typeof createRequestSchema>

export const decideRequestSchema = z
  .object({
    status: z.enum(['approved', 'rejected']),
    note: z.string().trim().max(500, '理由は500文字以内で入力してください').optional(),
  })
  .refine(
    (v) => v.status !== 'rejected' || (v.note !== undefined && v.note.length > 0),
    { message: '却下時は理由を入力してください', path: ['note'] },
  )

export type DecideRequestInput = z.infer<typeof decideRequestSchema>
```

- [ ] **Step 4: Run tests; expect pass**

Run:
```bash
pnpm test
```
Expected: 11 passing tests (6 from Task 16 plus 11 new).

- [ ] **Step 5: Commit**

Run:
```bash
git add lib/validation/request-schemas.ts tests/validation/request-schemas.test.ts
git commit -m "[修正]add Zod schemas for create and decide actions"
```

---

## Phase 4 — Supabase clients, auth helpers, login

### Task 18: Supabase server and browser clients + middleware

**Files:**
- Create: `lib/supabase/server.ts`, `lib/supabase/browser.ts`, `middleware.ts`, `lib/supabase/middleware.ts`

- [ ] **Step 1: Write `lib/supabase/server.ts`**

Create file `lib/supabase/server.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function getSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(toSet) {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options)
          }
        },
      },
    },
  )
}
```

- [ ] **Step 2: Write `lib/supabase/browser.ts`**

Create file `lib/supabase/browser.ts`:
```ts
'use client'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function getSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

- [ ] **Step 3: Write `lib/supabase/middleware.ts`**

Create file `lib/supabase/middleware.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(toSet) {
          for (const { name, value, options } of toSet) {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )
  await supabase.auth.getUser()
  return response
}
```

- [ ] **Step 4: Write `middleware.ts` at repo root**

Create file `middleware.ts`:
```ts
import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 5: Verify typecheck and build**

Run:
```bash
pnpm typecheck
pnpm build
```
Expected: PASS.

- [ ] **Step 6: Commit**

Run:
```bash
git add lib/supabase middleware.ts
git commit -m "[修正]add Supabase server/browser clients and session middleware"
```

---

### Task 19: Auth helpers

**Files:**
- Create: `lib/auth/require-user.ts`, `lib/auth/require-role.ts`

- [ ] **Step 1: Write `require-user.ts`**

Create file `lib/auth/require-user.ts`:
```ts
import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function requireUser() {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    redirect('/login')
  }
  return data.user
}
```

- [ ] **Step 2: Write `require-role.ts`**

Create file `lib/auth/require-role.ts`:
```ts
import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'

type Role = 'employee' | 'admin'

export async function requireRole(role: Role) {
  const supabase = await getSupabaseServerClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) {
    redirect('/login')
  }
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()
  if (error || !profile || profile.role !== role) {
    redirect('/requests')
  }
  return { userId: userData.user.id, role: profile.role as Role }
}

export async function getCurrentRole(): Promise<Role | null> {
  const supabase = await getSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()
  return (profile?.role as Role) ?? null
}
```

- [ ] **Step 3: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: PASS.

- [ ] **Step 4: Commit**

Run:
```bash
git add lib/auth
git commit -m "[修正]add requireUser and requireRole helpers"
```

---

### Task 20: Install initial shadcn/ui components

**Files:**
- Create: `components/ui/*` (button, input, label, textarea, select, badge, dialog, sonner, table)
- Modify: `package.json`, `tailwind.config.*`

- [ ] **Step 1: Initialize shadcn**

Run:
```bash
pnpm dlx shadcn@latest init
```
Choose defaults: Style=Default, Base color=Slate, CSS variables=Yes. Confirm tailwind config path and component alias `@/components`.

- [ ] **Step 2: Install the components used in this project**

Run:
```bash
pnpm dlx shadcn@latest add button input label textarea select badge dialog sonner table
```
Expected: files created under `components/ui/`.

- [ ] **Step 3: Add `<Toaster />` to the root layout**

Modify `app/layout.tsx` and insert before `</body>`:
```tsx
import { Toaster } from '@/components/ui/sonner'
// ...
<Toaster richColors position="top-right" />
```

- [ ] **Step 4: Verify build**

Run:
```bash
pnpm build
```
Expected: PASS.

- [ ] **Step 5: Commit**

Run:
```bash
git add -A
git commit -m "[修正]install shadcn/ui base components"
```

---

### Task 21: Login page and login action

**Files:**
- Create: `app/(auth)/login/page.tsx`, `app/(auth)/login/login-form.tsx`, `app/(auth)/login/actions.ts`

- [ ] **Step 1: Write the server action**

Create file `app/(auth)/login/actions.ts`:
```ts
'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getSupabaseServerClient } from '@/lib/supabase/server'

const schema = z.object({
  email: z.string().email('メールアドレスの形式が正しくありません'),
  password: z.string().min(1, 'パスワードを入力してください'),
})

export type LoginState =
  | { ok: false; fieldErrors?: Partial<Record<'email' | 'password', string[]>>; formError?: string }
  | { ok: true }

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) {
    return { ok: false, formError: 'メールアドレスまたはパスワードが正しくありません' }
  }
  redirect('/requests')
}
```

- [ ] **Step 2: Write the client form**

Create file `app/(auth)/login/login-form.tsx`:
```tsx
'use client'

import { useActionState } from 'react'
import { loginAction, type LoginState } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const initial: LoginState = { ok: false }

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial)
  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-1">
        <Label htmlFor="email">メールアドレス</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
        {state.ok === false && state.fieldErrors?.email && (
          <p className="text-sm text-red-600">{state.fieldErrors.email[0]}</p>
        )}
      </div>
      <div className="grid gap-1">
        <Label htmlFor="password">パスワード</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
        {state.ok === false && state.fieldErrors?.password && (
          <p className="text-sm text-red-600">{state.fieldErrors.password[0]}</p>
        )}
      </div>
      {state.ok === false && state.formError && (
        <p className="text-sm text-red-600">{state.formError}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? '送信中…' : 'ログイン'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: Write the page**

Create file `app/(auth)/login/page.tsx`:
```tsx
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <main className="mx-auto grid max-w-sm gap-6 p-8">
      <h1 className="text-2xl font-semibold">ログイン</h1>
      <p className="text-sm text-muted-foreground">
        テストユーザー: <code>employee@example.com</code> / <code>Employee123!</code> または{' '}
        <code>admin@example.com</code> / <code>Admin123!</code>
      </p>
      <LoginForm />
    </main>
  )
}
```

- [ ] **Step 4: Verify build + manual login flow**

Run:
```bash
pnpm dev
```
In a browser, visit `http://localhost:3000/login`, log in as `employee@example.com`. Expected: redirect to `/requests` (which will 404 until Task 24 — that's expected; the auth flow itself should succeed).

- [ ] **Step 5: Commit**

Run:
```bash
git add app/(auth)
git commit -m "[修正]add login page, form, and server action"
```

---

### Task 22: Logout action and authenticated shell layout

**Files:**
- Create: `app/(app)/layout.tsx`, `app/(app)/_components/header.tsx`, `app/(app)/_components/logout-button.tsx`, `app/(app)/actions/logout.ts`

- [ ] **Step 1: Logout server action**

Create file `app/(app)/actions/logout.ts`:
```ts
'use server'
import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function logoutAction() {
  const supabase = await getSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

- [ ] **Step 2: Logout button (client)**

Create file `app/(app)/_components/logout-button.tsx`:
```tsx
'use client'
import { Button } from '@/components/ui/button'
import { logoutAction } from '../actions/logout'

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="ghost">ログアウト</Button>
    </form>
  )
}
```

- [ ] **Step 3: Header**

Create file `app/(app)/_components/header.tsx`:
```tsx
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LogoutButton } from './logout-button'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function Header() {
  const supabase = await getSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  let profile: { full_name: string; role: 'employee' | 'admin' } | null = null
  if (userId) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single()
    profile = (data as { full_name: string; role: 'employee' | 'admin' } | null) ?? null
  }
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <Link href="/requests" className="text-lg font-semibold">備品購入申請</Link>
        <nav className="flex items-center gap-3">
          <Link href="/requests/new">
            <Button variant="outline" size="sm">新規申請</Button>
          </Link>
          {profile && (
            <>
              <span className="text-sm">{profile.full_name}</span>
              <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                {profile.role === 'admin' ? '管理者' : '一般社員'}
              </Badge>
            </>
          )}
          <LogoutButton />
        </nav>
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Authenticated layout**

Create file `app/(app)/layout.tsx`:
```tsx
import { requireUser } from '@/lib/auth/require-user'
import { Header } from './_components/header'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser()
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </>
  )
}
```

- [ ] **Step 5: Build + manual sanity check**

Run:
```bash
pnpm build
```
Expected: PASS.

- [ ] **Step 6: Commit**

Run:
```bash
git add -A
git commit -m "[修正]add authenticated shell layout with header and logout"
```

---

## Phase 5 — Repositories and integration tests

### Task 23: Requests repository (read APIs)

**Files:**
- Create: `lib/repositories/requests.repo.ts`

- [ ] **Step 1: Write the repository**

Create file `lib/repositories/requests.repo.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { createRequestSchema, type CreateRequestInput, type DecideRequestInput } from '@/lib/validation/request-schemas'

type Client = SupabaseClient<Database>

export type RequestRow = Database['public']['Tables']['purchase_requests']['Row']
export type RequestWithApplicant = RequestRow & {
  applicant: { id: string; full_name: string; email: string } | null
  category: { id: string; name: string } | null
}

export type ListFilters = {
  status?: 'pending' | 'approved' | 'rejected'
  applicantId?: string
  limit?: number
}

export async function listRequests(
  supabase: Client,
  filters: ListFilters = {},
): Promise<RequestWithApplicant[]> {
  let q = supabase
    .from('purchase_requests')
    .select(
      'id, applicant_id, category_id, title, description, amount_jpy, status, requested_at, decided_at, decided_by, decision_note, applicant:profiles!purchase_requests_applicant_id_fkey(id, full_name, email), category:categories(id, name)',
    )
    .order('requested_at', { ascending: false })
    .limit(filters.limit ?? 100)
  if (filters.status) q = q.eq('status', filters.status)
  if (filters.applicantId) q = q.eq('applicant_id', filters.applicantId)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as RequestWithApplicant[]
}

export async function getRequest(
  supabase: Client,
  id: string,
): Promise<RequestWithApplicant | null> {
  const { data, error } = await supabase
    .from('purchase_requests')
    .select(
      'id, applicant_id, category_id, title, description, amount_jpy, status, requested_at, decided_at, decided_by, decision_note, applicant:profiles!purchase_requests_applicant_id_fkey(id, full_name, email), category:categories(id, name)',
    )
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as RequestWithApplicant | null) ?? null
}

export async function createRequest(
  supabase: Client,
  applicantId: string,
  input: CreateRequestInput,
): Promise<RequestRow> {
  const parsed = createRequestSchema.parse(input)
  const { data, error } = await supabase
    .from('purchase_requests')
    .insert({
      applicant_id: applicantId,
      title: parsed.title,
      description: parsed.description ?? null,
      amount_jpy: parsed.amount_jpy,
      category_id: parsed.category_id,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function decideRequest(
  supabase: Client,
  id: string,
  deciderId: string,
  input: DecideRequestInput,
): Promise<RequestRow> {
  const { data, error } = await supabase
    .from('purchase_requests')
    .update({
      status: input.status,
      decided_at: new Date().toISOString(),
      decided_by: deciderId,
      decision_note: input.note ?? null,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
```

- [ ] **Step 2: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: PASS.

- [ ] **Step 3: Commit**

Run:
```bash
git add lib/repositories
git commit -m "[修正]add requests repository (list/get/create/decide)"
```

---

### Task 24: Integration tests against local Supabase

**Files:**
- Create: `tests/repositories/requests.repo.test.ts`, `tests/helpers/supabase-clients.ts`

- [ ] **Step 1: Test helper**

Create file `tests/helpers/supabase-clients.ts`:
```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export function adminClient(): SupabaseClient<Database> {
  return createClient<Database>(url, serviceRoleKey, { auth: { persistSession: false } })
}

export async function signedInClient(email: string, password: string): Promise<SupabaseClient<Database>> {
  const c = createClient<Database>(url, anonKey, { auth: { persistSession: false } })
  const { error } = await c.auth.signInWithPassword({ email, password })
  if (error) throw error
  return c
}
```

- [ ] **Step 2: Failing integration test**

Create file `tests/repositories/requests.repo.test.ts`:
```ts
import { beforeAll, describe, expect, it } from 'vitest'
import { adminClient, signedInClient } from '@/tests/helpers/supabase-clients'
import {
  createRequest,
  decideRequest,
  getRequest,
  listRequests,
} from '@/lib/repositories/requests.repo'

const EMPLOYEE_EMAIL = process.env.SEED_EMPLOYEE_EMAIL ?? 'employee@example.com'
const EMPLOYEE_PASSWORD = process.env.SEED_EMPLOYEE_PASSWORD ?? 'Employee123!'
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!'

describe('requests repository (integration, RLS-enforced)', () => {
  let employeeId: string
  let adminId: string
  let categoryId: string

  beforeAll(async () => {
    const admin = adminClient()
    // Wipe data tables (preserve auth users and categories seed)
    await admin.from('approval_history').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await admin.from('purchase_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    const { data: emp } = await admin.from('profiles').select('id').eq('role', 'employee').single()
    const { data: adm } = await admin.from('profiles').select('id').eq('role', 'admin').single()
    const { data: cat } = await admin.from('categories').select('id').limit(1).single()
    if (!emp || !adm || !cat) throw new Error('seed data missing — run pnpm setup (or pnpm db:seed-users) against your linked Supabase project before integration tests')
    employeeId = emp.id
    adminId = adm.id
    categoryId = cat.id
  })

  it('employee can create their own request and read it back', async () => {
    const empClient = await signedInClient(EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD)
    const created = await createRequest(empClient, employeeId, {
      title: '統合テスト用申請',
      amount_jpy: 1234,
      category_id: categoryId,
    })
    expect(created.status).toBe('pending')

    const list = await listRequests(empClient, {})
    expect(list.find((r) => r.id === created.id)).toBeTruthy()
  })

  it('employee cannot see another user\'s requests', async () => {
    const admin = adminClient()
    // Insert a row owned by the admin (acting as a second user) via service-role
    const { data: otherReq } = await admin
      .from('purchase_requests')
      .insert({
        applicant_id: adminId,
        title: 'other user request',
        amount_jpy: 999,
        category_id: categoryId,
      })
      .select()
      .single()
    if (!otherReq) throw new Error('failed to seed other-user request')

    const empClient = await signedInClient(EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD)
    const list = await listRequests(empClient, {})
    expect(list.find((r) => r.id === otherReq.id)).toBeFalsy()
  })

  it('admin can list all requests and approve a pending one; trigger writes history', async () => {
    const admin = adminClient()
    const { data: pending } = await admin
      .from('purchase_requests')
      .insert({
        applicant_id: employeeId,
        title: 'approve-me',
        amount_jpy: 5000,
        category_id: categoryId,
      })
      .select()
      .single()
    if (!pending) throw new Error('failed to seed pending request')

    const adminCli = await signedInClient(ADMIN_EMAIL, ADMIN_PASSWORD)
    const all = await listRequests(adminCli, {})
    expect(all.length).toBeGreaterThan(0)

    const decided = await decideRequest(adminCli, pending.id, adminId, { status: 'approved' })
    expect(decided.status).toBe('approved')
    expect(decided.decided_by).toBe(adminId)

    const { data: history } = await adminCli
      .from('approval_history')
      .select('*')
      .eq('request_id', pending.id)
    expect(history?.length).toBe(1)
    expect(history?.[0].from_status).toBe('pending')
    expect(history?.[0].to_status).toBe('approved')
  })

  it('employee cannot approve a request (RLS denies update)', async () => {
    const admin = adminClient()
    const { data: pending } = await admin
      .from('purchase_requests')
      .insert({
        applicant_id: employeeId,
        title: 'cannot-approve',
        amount_jpy: 100,
        category_id: categoryId,
      })
      .select()
      .single()
    if (!pending) throw new Error('failed to seed pending request')

    const empClient = await signedInClient(EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD)
    const r = await empClient
      .from('purchase_requests')
      .update({ status: 'approved', decided_at: new Date().toISOString(), decided_by: employeeId })
      .eq('id', pending.id)
      .select()
    // RLS denial typically returns an empty array (no rows affected) for UPDATE in PostgREST.
    expect(r.data?.length ?? 0).toBe(0)
    const after = await getRequest(admin, pending.id)
    expect(after?.status).toBe('pending')
  })
})
```

- [ ] **Step 3: Ensure DB is migrated + seeded, then run integration tests**

Run:
```bash
pnpm db:push
pnpm db:seed-users
pnpm test:integration
```
Expected: 4 passing tests. Tests run against the linked Supabase Cloud project; the `beforeAll` block clears `purchase_requests` and `approval_history` to ensure a clean slate.

> Important caveat: these tests mutate data in your linked project. They are safe to run repeatedly (idempotent cleanup), but do not run them against a project that holds data you care about.

- [ ] **Step 4: Commit**

Run:
```bash
git add tests
git commit -m "[修正]add integration tests for requests repository (RLS+trigger)"
```

---

## Phase 6 — UI pages

### Task 25: `/requests` list page

**Files:**
- Create: `app/(app)/requests/page.tsx`, `app/(app)/requests/_components/request-list.tsx`, `app/(app)/requests/_components/status-filter.tsx`, `app/(app)/requests/_components/status-badge.tsx`

- [ ] **Step 1: Status badge**

Create file `app/(app)/requests/_components/status-badge.tsx`:
```tsx
import { Badge } from '@/components/ui/badge'
import type { Status } from '@/lib/domain/status'

const LABEL: Record<Status, string> = {
  pending: '申請中',
  approved: '承認済み',
  rejected: '却下',
}
const VARIANT: Record<Status, 'secondary' | 'default' | 'destructive'> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
}

export function StatusBadge({ status }: { status: Status }) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>
}
```

- [ ] **Step 2: Status filter (admin only)**

Create file `app/(app)/requests/_components/status-filter.tsx`:
```tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function StatusFilter() {
  const router = useRouter()
  const sp = useSearchParams()
  const current = sp.get('status') ?? 'all'
  return (
    <Select
      value={current}
      onValueChange={(v) => {
        const next = new URLSearchParams(sp.toString())
        if (v === 'all') next.delete('status')
        else next.set('status', v)
        router.push(`/requests${next.toString() ? `?${next.toString()}` : ''}`)
      }}
    >
      <SelectTrigger className="w-40">
        <SelectValue placeholder="ステータス" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">すべて</SelectItem>
        <SelectItem value="pending">申請中</SelectItem>
        <SelectItem value="approved">承認済み</SelectItem>
        <SelectItem value="rejected">却下</SelectItem>
      </SelectContent>
    </Select>
  )
}
```

- [ ] **Step 3: Request list rendering**

Create file `app/(app)/requests/_components/request-list.tsx`:
```tsx
import Link from 'next/link'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import type { RequestWithApplicant } from '@/lib/repositories/requests.repo'
import { StatusBadge } from './status-badge'

const fmtJpy = (n: number) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(n)
const fmtDate = (s: string) => new Date(s).toLocaleString('ja-JP', { hour12: false })

export function RequestList({ rows, showApplicant }: { rows: RequestWithApplicant[]; showApplicant: boolean }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">申請はありません。</p>
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>申請日</TableHead>
          <TableHead>タイトル</TableHead>
          <TableHead>カテゴリ</TableHead>
          <TableHead className="text-right">金額</TableHead>
          {showApplicant && <TableHead>申請者</TableHead>}
          <TableHead>ステータス</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id} className="cursor-pointer">
            <TableCell>{fmtDate(r.requested_at)}</TableCell>
            <TableCell>
              <Link className="underline-offset-4 hover:underline" href={`/requests/${r.id}`}>
                {r.title}
              </Link>
            </TableCell>
            <TableCell>{r.category?.name ?? '—'}</TableCell>
            <TableCell className="text-right tabular-nums">{fmtJpy(r.amount_jpy)}</TableCell>
            {showApplicant && <TableCell>{r.applicant?.full_name ?? '—'}</TableCell>}
            <TableCell><StatusBadge status={r.status as 'pending' | 'approved' | 'rejected'} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

- [ ] **Step 4: List page**

Create file `app/(app)/requests/page.tsx`:
```tsx
import { getCurrentRole } from '@/lib/auth/require-role'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { listRequests } from '@/lib/repositories/requests.repo'
import { RequestList } from './_components/request-list'
import { StatusFilter } from './_components/status-filter'

type SP = Record<string, string | string[] | undefined>

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<SP>
}) {
  const sp = await searchParams
  const supabase = await getSupabaseServerClient()
  const role = await getCurrentRole()
  const isAdmin = role === 'admin'
  const status = typeof sp.status === 'string'
    ? (['pending', 'approved', 'rejected'].includes(sp.status) ? (sp.status as 'pending' | 'approved' | 'rejected') : undefined)
    : undefined
  const rows = await listRequests(supabase, { status })

  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{isAdmin ? '全申請一覧' : '自分の申請一覧'}</h1>
        {isAdmin && <StatusFilter />}
      </div>
      <RequestList rows={rows} showApplicant={isAdmin} />
    </section>
  )
}
```

- [ ] **Step 5: Build + manual test**

Run:
```bash
pnpm build
```
Then `pnpm dev`, log in as each seeded user, visit `/requests`. Expected:
- Employee sees only their own (empty until Task 26).
- Admin sees all.

- [ ] **Step 6: Commit**

Run:
```bash
git add app/(app)/requests
git commit -m "[修正]add /requests list page with role-aware filtering"
```

---

### Task 26: `/requests/new` create form

**Files:**
- Create: `app/(app)/requests/new/page.tsx`, `app/(app)/requests/new/new-request-form.tsx`, `app/(app)/requests/new/actions.ts`

- [ ] **Step 1: Server action**

Create file `app/(app)/requests/new/actions.ts`:
```ts
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth/require-user'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { createRequest } from '@/lib/repositories/requests.repo'
import { createRequestSchema } from '@/lib/validation/request-schemas'

export type CreateState =
  | { ok: false; fieldErrors?: Record<string, string[]>; formError?: string }
  | { ok: true }

export async function createRequestAction(_prev: CreateState, formData: FormData): Promise<CreateState> {
  const user = await requireUser()
  const parsed = createRequestSchema.safeParse({
    title: formData.get('title'),
    description: (formData.get('description') as string) || undefined,
    amount_jpy: Number(formData.get('amount_jpy')),
    category_id: formData.get('category_id'),
  })
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }
  const supabase = await getSupabaseServerClient()
  try {
    const created = await createRequest(supabase, user.id, parsed.data)
    revalidatePath('/requests')
    redirect(`/requests/${created.id}`)
  } catch (err) {
    console.error({ op: 'createRequest', userId: user.id, err })
    return { ok: false, formError: '申請の作成に失敗しました' }
  }
}
```

- [ ] **Step 2: Client form**

Create file `app/(app)/requests/new/new-request-form.tsx`:
```tsx
'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { createRequestAction, type CreateState } from './actions'

const initial: CreateState = { ok: false }

type Category = { id: string; name: string }

export function NewRequestForm({ categories }: { categories: Category[] }) {
  const [state, formAction, pending] = useActionState(createRequestAction, initial)
  return (
    <form action={formAction} className="grid max-w-lg gap-4">
      <div className="grid gap-1">
        <Label htmlFor="title">タイトル</Label>
        <Input id="title" name="title" required maxLength={120} />
        {state.ok === false && state.fieldErrors?.title && (
          <p className="text-sm text-red-600">{state.fieldErrors.title[0]}</p>
        )}
      </div>
      <div className="grid gap-1">
        <Label htmlFor="amount_jpy">金額（円）</Label>
        <Input id="amount_jpy" name="amount_jpy" type="number" inputMode="numeric" min={1} required />
        {state.ok === false && state.fieldErrors?.amount_jpy && (
          <p className="text-sm text-red-600">{state.fieldErrors.amount_jpy[0]}</p>
        )}
      </div>
      <div className="grid gap-1">
        <Label htmlFor="category_id">カテゴリ</Label>
        <Select name="category_id" required>
          <SelectTrigger id="category_id">
            <SelectValue placeholder="カテゴリを選択" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.ok === false && state.fieldErrors?.category_id && (
          <p className="text-sm text-red-600">{state.fieldErrors.category_id[0]}</p>
        )}
      </div>
      <div className="grid gap-1">
        <Label htmlFor="description">説明（任意）</Label>
        <Textarea id="description" name="description" maxLength={1000} rows={4} />
        {state.ok === false && state.fieldErrors?.description && (
          <p className="text-sm text-red-600">{state.fieldErrors.description[0]}</p>
        )}
      </div>
      {state.ok === false && state.formError && (
        <p className="text-sm text-red-600">{state.formError}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? '送信中…' : '申請する'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: Page**

Create file `app/(app)/requests/new/page.tsx`:
```tsx
import { requireUser } from '@/lib/auth/require-user'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { NewRequestForm } from './new-request-form'

export default async function NewRequestPage() {
  await requireUser()
  const supabase = await getSupabaseServerClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('sort_order', { ascending: true })

  return (
    <section className="grid gap-4">
      <h1 className="text-xl font-semibold">新規申請</h1>
      <NewRequestForm categories={categories ?? []} />
    </section>
  )
}
```

- [ ] **Step 4: Manual smoke test**

Run:
```bash
pnpm dev
```
Log in as `employee@example.com`, create a request, expect a redirect to its detail page (404 until Task 27, that's fine; verify in DB that the row exists by checking `/requests`).

- [ ] **Step 5: Commit**

Run:
```bash
git add app/(app)/requests/new
git commit -m "[修正]add /requests/new create form and server action"
```

---

### Task 27: `/requests/[id]` detail page with history

**Files:**
- Create: `app/(app)/requests/[id]/page.tsx`, `app/(app)/requests/[id]/_components/history-timeline.tsx`

- [ ] **Step 1: History timeline component**

Create file `app/(app)/requests/[id]/_components/history-timeline.tsx`:
```tsx
import { StatusBadge } from '../../_components/status-badge'
import type { Status } from '@/lib/domain/status'

type Row = {
  id: string
  from_status: string
  to_status: string
  acted_at: string
  note: string | null
  actor: { full_name: string } | null
}

const fmt = (s: string) => new Date(s).toLocaleString('ja-JP', { hour12: false })

export function HistoryTimeline({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">履歴はありません。</p>
  }
  return (
    <ol className="grid gap-3">
      {rows.map((r) => (
        <li key={r.id} className="rounded-md border p-3">
          <div className="flex items-center gap-2 text-sm">
            <StatusBadge status={r.from_status as Status} />
            <span>→</span>
            <StatusBadge status={r.to_status as Status} />
            <span className="ml-auto text-muted-foreground">{fmt(r.acted_at)}</span>
          </div>
          <div className="mt-1 text-sm">操作者: {r.actor?.full_name ?? '—'}</div>
          {r.note && <p className="mt-1 text-sm text-muted-foreground">理由: {r.note}</p>}
        </li>
      ))}
    </ol>
  )
}
```

- [ ] **Step 2: I'll add the approval panel in the next task; for now build a read-only detail page**

Create file `app/(app)/requests/[id]/page.tsx`:
```tsx
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth/require-user'
import { getCurrentRole } from '@/lib/auth/require-role'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getRequest } from '@/lib/repositories/requests.repo'
import { StatusBadge } from '../_components/status-badge'
import { HistoryTimeline } from './_components/history-timeline'

const fmtJpy = (n: number) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(n)
const fmt = (s: string) => new Date(s).toLocaleString('ja-JP', { hour12: false })

export default async function RequestDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  await requireUser()
  const { id } = await params
  const supabase = await getSupabaseServerClient()
  const req = await getRequest(supabase, id)
  if (!req) notFound()
  const role = await getCurrentRole()

  const { data: history } = await supabase
    .from('approval_history')
    .select('id, from_status, to_status, acted_at, note, actor:profiles!approval_history_actor_id_fkey(full_name)')
    .eq('request_id', id)
    .order('acted_at', { ascending: false })

  return (
    <section className="grid gap-6">
      <header className="grid gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{req.title}</h1>
          <StatusBadge status={req.status as 'pending' | 'approved' | 'rejected'} />
        </div>
        <p className="text-sm text-muted-foreground">申請日: {fmt(req.requested_at)}</p>
      </header>

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-muted-foreground">申請者</dt>
        <dd>{req.applicant?.full_name ?? '—'}</dd>
        <dt className="text-muted-foreground">カテゴリ</dt>
        <dd>{req.category?.name ?? '—'}</dd>
        <dt className="text-muted-foreground">金額</dt>
        <dd className="tabular-nums">{fmtJpy(req.amount_jpy)}</dd>
        {req.description && (
          <>
            <dt className="text-muted-foreground">説明</dt>
            <dd className="whitespace-pre-wrap">{req.description}</dd>
          </>
        )}
        {req.decided_at && (
          <>
            <dt className="text-muted-foreground">決定日時</dt>
            <dd>{fmt(req.decided_at)}</dd>
          </>
        )}
        {req.decision_note && (
          <>
            <dt className="text-muted-foreground">理由</dt>
            <dd className="whitespace-pre-wrap">{req.decision_note}</dd>
          </>
        )}
      </dl>

      <section className="grid gap-2">
        <h2 className="text-base font-semibold">承認履歴</h2>
        <HistoryTimeline rows={(history ?? []) as Parameters<typeof HistoryTimeline>[0]['rows']} />
      </section>

      {role === 'admin' && req.status === 'pending' && (
        <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          管理者の承認/却下パネルは次のタスクで追加されます。
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 3: Build + smoke test**

Run:
```bash
pnpm build
```
Expected: PASS. Visit a request detail page in `pnpm dev` to confirm it renders.

- [ ] **Step 4: Commit**

Run:
```bash
git add -A
git commit -m "[修正]add /requests/[id] detail page with history timeline"
```

---

### Task 28: Admin approve/reject panel

**Files:**
- Create: `app/(app)/requests/[id]/_components/approval-panel.tsx`, `app/(app)/requests/[id]/actions.ts`
- Modify: `app/(app)/requests/[id]/page.tsx`

- [ ] **Step 1: Decide server action**

Create file `app/(app)/requests/[id]/actions.ts`:
```ts
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireRole } from '@/lib/auth/require-role'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { decideRequest, getRequest } from '@/lib/repositories/requests.repo'
import { decideRequestSchema } from '@/lib/validation/request-schemas'
import { canTransition, type Status } from '@/lib/domain/status'

export type DecideState =
  | { ok: false; fieldErrors?: Record<string, string[]>; formError?: string }
  | { ok: true }

const idSchema = z.string().uuid()

export async function decideAction(
  requestId: string,
  _prev: DecideState,
  formData: FormData,
): Promise<DecideState> {
  const idCheck = idSchema.safeParse(requestId)
  if (!idCheck.success) return { ok: false, formError: '不正なIDです' }
  const { userId } = await requireRole('admin')
  const supabase = await getSupabaseServerClient()
  const current = await getRequest(supabase, requestId)
  if (!current) return { ok: false, formError: '対象の申請が見つかりません' }

  const parsed = decideRequestSchema.safeParse({
    status: formData.get('status'),
    note: (formData.get('note') as string | null) || undefined,
  })
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }
  if (!canTransition(current.status as Status, parsed.data.status)) {
    return { ok: false, formError: '無効なステータス遷移です' }
  }
  try {
    await decideRequest(supabase, requestId, userId, parsed.data)
    revalidatePath(`/requests/${requestId}`)
    revalidatePath('/requests')
    return { ok: true }
  } catch (err) {
    console.error({ op: 'decideRequest', userId, requestId, err })
    return { ok: false, formError: '更新に失敗しました' }
  }
}
```

- [ ] **Step 2: Approval panel component**

Create file `app/(app)/requests/[id]/_components/approval-panel.tsx`:
```tsx
'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { decideAction, type DecideState } from '../actions'

const initial: DecideState = { ok: false }

export function ApprovalPanel({ requestId }: { requestId: string }) {
  const action = decideAction.bind(null, requestId)
  const [state, formAction, pending] = useActionState(action, initial)
  const [openReject, setOpenReject] = useState(false)
  const [openApprove, setOpenApprove] = useState(false)

  if (state.ok === true) {
    toast.success('更新しました')
  }

  return (
    <div className="rounded-md border p-4">
      <h2 className="mb-3 text-base font-semibold">この申請を判定する</h2>
      <div className="flex gap-2">
        <Dialog open={openApprove} onOpenChange={setOpenApprove}>
          <DialogTrigger asChild>
            <Button>承認</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>承認の確認</DialogTitle>
              <DialogDescription>この申請を承認します。よろしいですか？</DialogDescription>
            </DialogHeader>
            <form action={formAction}>
              <input type="hidden" name="status" value="approved" />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenApprove(false)}>キャンセル</Button>
                <Button type="submit" disabled={pending}>{pending ? '送信中…' : '承認する'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={openReject} onOpenChange={setOpenReject}>
          <DialogTrigger asChild>
            <Button variant="destructive">却下</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>却下の確認</DialogTitle>
              <DialogDescription>却下の理由を入力してください。</DialogDescription>
            </DialogHeader>
            <form action={formAction} className="grid gap-3">
              <input type="hidden" name="status" value="rejected" />
              <Textarea name="note" required maxLength={500} placeholder="理由" />
              {state.ok === false && state.fieldErrors?.note && (
                <p className="text-sm text-red-600">{state.fieldErrors.note[0]}</p>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenReject(false)}>キャンセル</Button>
                <Button type="submit" variant="destructive" disabled={pending}>{pending ? '送信中…' : '却下する'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {state.ok === false && state.formError && (
        <p className="mt-3 text-sm text-red-600">{state.formError}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Wire panel into detail page**

In `app/(app)/requests/[id]/page.tsx`, replace the placeholder `<div>` ("管理者の承認/却下パネルは次のタスクで追加されます。") block with:
```tsx
{role === 'admin' && req.status === 'pending' && (
  <ApprovalPanel requestId={req.id} />
)}
```
And add at the top of the file:
```tsx
import { ApprovalPanel } from './_components/approval-panel'
```

- [ ] **Step 4: Manual end-to-end check**

Run `pnpm dev`. As employee, create a request. Log out, log in as admin, approve it. Expected: status updates to 「承認済み」, toast shows, history timeline grows by one row, employee logging back in sees their request as approved.

- [ ] **Step 5: Commit**

Run:
```bash
git add -A
git commit -m "[修正]add admin approve/reject panel with confirmation dialog"
```

---

### Task 29: Error boundary and loading skeletons

**Files:**
- Create: `app/(app)/error.tsx`, `app/(app)/requests/loading.tsx`, `app/(app)/requests/[id]/loading.tsx`

- [ ] **Step 1: Error boundary**

Create file `app/(app)/error.tsx`:
```tsx
'use client'
import { Button } from '@/components/ui/button'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  console.error({ op: 'route-error', digest: error.digest, message: error.message })
  return (
    <div className="grid gap-3 rounded-md border border-red-200 bg-red-50 p-4">
      <h2 className="text-base font-semibold text-red-700">エラーが発生しました</h2>
      <p className="text-sm text-red-700">時間をおいて再度お試しください。</p>
      <Button onClick={reset} variant="outline">再試行</Button>
    </div>
  )
}
```

- [ ] **Step 2: List loading skeleton**

Create file `app/(app)/requests/loading.tsx`:
```tsx
export default function Loading() {
  return (
    <div className="grid gap-2">
      <div className="h-6 w-40 animate-pulse rounded bg-muted" />
      <div className="h-32 animate-pulse rounded bg-muted" />
    </div>
  )
}
```

- [ ] **Step 3: Detail loading skeleton**

Create file `app/(app)/requests/[id]/loading.tsx`:
```tsx
export default function Loading() {
  return (
    <div className="grid gap-3">
      <div className="h-6 w-64 animate-pulse rounded bg-muted" />
      <div className="h-40 animate-pulse rounded bg-muted" />
    </div>
  )
}
```

- [ ] **Step 4: Build**

Run:
```bash
pnpm build
```
Expected: PASS.

- [ ] **Step 5: Commit**

Run:
```bash
git add -A
git commit -m "[修正]add error boundary and loading skeletons"
```

---

### Task 30: Root redirect

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace empty `app/page.tsx`**

Replace `app/page.tsx` with:
```tsx
import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  redirect(data.user ? '/requests' : '/login')
}
```

- [ ] **Step 2: Build + manual check**

Run:
```bash
pnpm build
```
Expected: PASS. Visiting `/` redirects to `/login` (logged out) or `/requests` (logged in).

- [ ] **Step 3: Commit**

Run:
```bash
git add app/page.tsx
git commit -m "[修正]redirect root to /requests or /login based on session"
```

---

## Phase 7 — README and submission

### Task 31: README (Japanese primary, English secondary)

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write the README**

Create file `README.md`:
````markdown
# 備品購入申請アプリ (Equipment Purchase Request App)

社内利用を想定した備品購入申請プロトタイプ。スキルチェック課題の提出物です。

> English version follows the Japanese section below.

---

## 概要

- 一般社員: 備品購入の申請を作成し、自分の申請一覧を確認できます。
- 管理者: 全申請を一覧で確認し、承認/却下を行えます。

承認/却下はデータベースレベルでステータス遷移とAudit Trailを強制する設計です。

## 技術スタックと選定理由

| Layer | 技術 | 理由 |
|---|---|---|
| Framework | Next.js 15 (App Router, RSC) | サーバーコンポーネントでデータ取得を完結させ、ミューテーションはServer Actionsで集約することで境界を明確にできるため |
| Language | TypeScript (strict) | Supabaseのスキーマから型生成でき、ドメイン層と整合する型安全性を最小コストで担保できるため |
| DB / Auth / Authz | Supabase (Postgres + Auth + RLS) | 認可をDB層に集約し、APIの抜け道を最小化できる。本課題の深掘り領域(認可設計)と最も整合する選択 |
| Validation | Zod | フォーム・Server Action・ドメイン層で同一スキーマを共有でき、エラーメッセージの一元管理が可能 |
| Testing | Vitest (+ supabase-js による統合テスト) | RLS の挙動を実DBに対して検証するための最も軽量なテスト構成 |
| UI | Tailwind + shadcn/ui (選択コンポーネントのみ) | UI 深掘りはしないため、依存を最小化しつつアクセシブルな部品を確保 |
| Package mgr | pnpm | 一貫したロックファイルでクローン後の再現性を担保 |

「Next.js + Supabase」は課題説明の最初の例として挙げられている構成であり、深掘り領域である「設計・ビジネスロジック方面（RLS、バリデーション、テスト）」と最も自然に噛み合うためこの選択にしています。

## 深掘りした領域: 設計 / ビジネスロジック

本提出物では以下を意識的に深掘りしました:

1. **拡張データモデル**: `purchase_requests` に加えて、`profiles`(ロール)、`categories`(マスタ)、`approval_history`(監査) を分離。
2. **DBレベルの不変条件**: `pending → approved/rejected` のみ許可するBEFORE UPDATEトリガ、`rejected` 時に理由必須のCHECK制約など。
3. **監査ログ**: ステータス変更時に AFTER UPDATE トリガが `approval_history` を自動INSERTし、アプリ側の書き忘れで監査が抜けないように保証。
4. **多層認可 (RLS が主、APIが補助)**: 行レベル可視性は `is_admin()` ヘルパ関数で完結。Server Actions でも `requireRole('admin')` で先回りチェック (defense in depth)。
5. **Zod による一貫したバリデーション**: フォーム・Server Action・リポジトリで同じスキーマを使用。`refine` で「却下時は理由必須」のような業務制約も同居。
6. **ドメイン状態機械の二重化**: `lib/domain/status.ts::canTransition` と PostgreSQL トリガで同じ状態機械を実装し、UIエラーは早く、DBエラーは確実に。
7. **テスト**: Vitest による単体 (ドメイン + バリデーション) と、ローカルSupabaseを実DBとして使う統合テスト (RLS の実挙動、トリガの実挙動)。

## データモデル

```
auth.users (Supabase)
  └─ profiles (1:1, role: employee|admin)
              └─ purchase_requests (applicant_id)
                                    │
                                    └─ approval_history (request_id, append only, by trigger)
categories ─ purchase_requests (category_id)
```

ER図および列定義の詳細は [docs/superpowers/specs/2026-05-20-equipment-purchase-request-design.md](./docs/superpowers/specs/2026-05-20-equipment-purchase-request-design.md) §4 を参照してください。

## セットアップ手順

### 前提

- Node.js 20+ (推奨: Volta などのバージョンマネージャ)
- pnpm (Corepack: `corepack enable && corepack prepare pnpm@latest --activate`、または Volta: `volta install pnpm`)
- Supabase アカウント (https://supabase.com、無料サインアップで OK)

> Supabase CLI は **プロジェクトの dev dependency** として含まれているため、別途インストール不要です (`pnpm install` で自動的に導入されます)。
>
> **Docker は不要です。** 本プロジェクトは Supabase Cloud (無料枠) をデータベース/認証バックエンドとして使用します。課題要件「外部サービスを使用する場合は手順を丁寧に記載する」に従い、5 分程度でセットアップできるよう手順を整理しています。

### 手順

```bash
# 1. Supabase Cloud プロジェクトを作成
#    a. https://supabase.com にサインアップ (約 1 分)
#    b. "New project" を押し、名前 / リージョン / DB パスワードを設定
#    c. プロビジョニング完了まで約 2 分待機
#    d. Project Settings → API から以下をコピー
#       - Project URL
#       - anon public key
#       - service_role key (サーバー専用シークレット)
#    e. Project Settings → General から Reference ID をコピー

# 2. リポジトリ取得 & 依存導入
git clone https://github.com/<owner>/equipment-purchase-request-app.git
cd equipment-purchase-request-app
pnpm install

# 3. 環境変数を設定 (.env.example の 4 つの Supabase 値を 1. でコピーした値に置換)
cp .env.example .env.local
# エディタで .env.local を編集し、プレースホルダ <your-project-ref> 等を実値に置換

# 4. ワンコマンド・セットアップ (login → link → migrations push → seed users → types 生成)
pnpm setup
# - ブラウザが開き Supabase へのログインを求められます (初回のみ)
# - link コマンドで DB パスワードを聞かれたら、1.b で設定したものを入力

# 5. 開発サーバ
pnpm dev
# → http://localhost:3000
```

### テストユーザー

| ロール | メール | パスワード |
|---|---|---|
| 一般社員 | `employee@example.com` | `Employee123!` |
| 管理者 | `admin@example.com` | `Admin123!` |

### テスト実行

```bash
pnpm test              # 単体 (ドメイン + バリデーション)
pnpm test:integration  # 統合 (実Supabaseに対するRLS/トリガ検証)
pnpm test:all          # 両方
```

## 妥協した点 / もっと時間があればやりたかったこと

- 多段階承認 (マネージャ → 管理者) と金額に応じたルート分岐は未実装。スキーマ的には `approval_history` を流用して拡張可能な構造にとどめた。
- 通知 (Email / Slack) は未実装。
- ファイル添付 (見積書) は未実装。Supabase Storage を使えば実装可能。
- リアルタイム更新 (Supabase Realtime) は未実装。現状はサーバーアクション後の `revalidatePath` で再取得。
- 一覧の本格的なページネーション (現状は最新100件)。
- E2E テスト (Playwright) は時間の都合で省略し、Vitest 統合テストで代替。
- GitHub Actions による CI は時間の都合で省略。
- 国際化 (UIは日本語のみ)。

## おおよその作業時間

最短実装を優先しつつ、B+以上を狙える品質ラインを維持する。実作業時間は最終提出前に実績ベースで記載する。

---

# English summary

A Next.js 15 + Supabase prototype for an internal equipment purchase request workflow.

**Stack:** Next.js (App Router, RSC) · TypeScript (strict) · Supabase (Postgres + Auth + RLS) · Tailwind · shadcn/ui (selective) · Zod · Vitest · pnpm.

**Deep-dive area:** Design / Business Logic — extended schema (profiles, categories, audit history), DB-enforced state machine and audit trigger, RLS as the primary authorization layer, server-side `requireRole` as defense in depth, shared Zod schemas between forms / server actions / domain, Vitest unit + integration tests against the local Supabase stack.

**Setup:** see the Japanese section above for details. Summary:
1. Create a free Supabase Cloud project at https://supabase.com (~3 min including provisioning).
2. Copy Project URL, anon key, service-role key, and Reference ID into `.env.local`.
3. Install + setup:
```bash
pnpm install
cp .env.example .env.local   # then fill in the 4 Supabase values
pnpm setup                    # login → link → push migrations → seed users → gen types
pnpm dev
```
No Docker required.

**Test users:** `employee@example.com` / `Employee123!`, `admin@example.com` / `Admin123!`.

**Working time:** keep the build as short as practical while preserving B+ or better quality. Record the actual time spent before final submission.
````

- [ ] **Step 2: Commit**

Run:
```bash
git add README.md
git commit -m "[修正]add README (Japanese primary + English summary)"
```

---

### Task 32: Final verification (the "clean-clone" rehearsal)

**Files:** none

- [ ] **Step 1: Push current branch**

Run:
```bash
git push origin main
```

- [ ] **Step 2: Clean-clone rehearsal in a sibling folder against a SEPARATE Supabase project**

> Why a separate project: the rehearsal pushes migrations and seeds users into whatever project the local `supabase link` points at. To rehearse like a real reviewer would, create a second free Supabase Cloud project and point the rehearsal at it. This protects your primary dev project from rehearsal mutations.
>
> Steps before this rehearsal:
> 1. In the Supabase dashboard, create a second free project (e.g. `epr-rehearsal`). Wait for provisioning.
> 2. Note its URL, anon key, service-role key, project ref.

Run (PowerShell):
```powershell
$tmp = Join-Path $env:TEMP "epr-clone-test-$(Get-Random)"
git clone https://github.com/<owner>/equipment-purchase-request-app.git $tmp
Push-Location $tmp
pnpm install
Copy-Item .env.example .env.local
# Edit .env.local to put the rehearsal project's URL/keys/ref in place (use notepad .env.local).
notepad .env.local
# After saving, continue:
pnpm setup
pnpm build
pnpm test:all
Pop-Location
```
Expected: every command succeeds; tests all green. If any step fails, fix the README or scripts before submission.

You may delete the rehearsal Supabase project after a successful run (Dashboard → Project Settings → General → Delete project).

- [ ] **Step 3: Browser E2E walk-through via the cursor-ide-browser MCP**

Open `http://localhost:3000`, log in as employee, create a request, log out, log in as admin, approve the request, log out, log in as employee again, verify it appears as approved with one history row. Capture a screenshot for the user.

- [ ] **Step 4: Clean up the rehearsal clone**

Run:
```powershell
Pop-Location -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force $tmp
```

- [ ] **Step 5: Commit any README/script fixes uncovered during rehearsal**

Run:
```bash
git status
git add -A
git commit -m "[修正]post-rehearsal fixes"
git push
```

---

### Task 33: Submit

**Files:** none

- [ ] **Step 1: Confirm repo URL**

Print the final URL: `https://github.com/<owner>/equipment-purchase-request-app`.

- [ ] **Step 2: Notify the user**

Tell the user: "Submission ready. Repo: <URL>. README setup verified by clean-clone rehearsal." Ask whether they want me to also produce a short Slack-ready message they can paste to the reviewer (including repo URL, login credentials, and the final actual working-time note).

---

## Plan self-review summary

Verified after writing:
- **Spec coverage**: every spec section maps to at least one task:
  - §2 Tech stack → Tasks 2–5
  - §3 Architecture → Tasks 18–28
  - §4 Data model → Tasks 7–10
  - §5 Triggers → Tasks 11–12
  - §6 RLS → Task 13
  - §7 State machine → Task 16
  - §8 Routes → Tasks 21–28, 30
  - §9 Server actions → Tasks 21, 22, 26, 28
  - §10 Error handling → Tasks 21, 26, 28, 29
  - §11 Testing → Tasks 16, 17, 24
  - §12 Setup → Tasks 6, 7–15, 31
  - §13 YAGNI cuts → reflected by their absence and called out in README (Task 31)
  - §14 Language → Task 31
  - §15 Orchestration → applied through inline one-batch-at-a-time execution
  - §16 Deferred decisions → existing git repo confirmed; CI/preview kept out of scope as agreed
- **No placeholders**: every step shows the exact file path, exact code, exact command, expected output.
- **Type consistency**: shared names (`createRequest`, `decideRequest`, `canTransition`, `Status`, `CreateState`, `DecideState`, `RequestWithApplicant`) appear consistently across tasks.
- **Frequent commits**: every task ends with a commit.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-20-equipment-purchase-request.md`.

Execution choice is locked:

- **Inline batch execution only** — clean slate first, scaffold Next.js, then execute the plan in small batches with verification checkpoints.
- **No parallel/asynchronous subagents** — simpler monitoring, easier debugging, and lower coordination overhead.

Next step: confirm the clean-slate cleanup targets in Task 1 before deleting the existing scaffold.
