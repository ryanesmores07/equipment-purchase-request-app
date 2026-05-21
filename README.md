# Equipment Purchase Request App

A Next.js 15 + Supabase prototype for an internal equipment purchase request workflow.

Employees can submit equipment, software, or learning purchase requests. Admins can review all requests, approve or reject pending requests, and see the approval history.

## Stack

- Next.js `15.5.18` App Router with React Server Components for reads and Server Actions for writes.
- Supabase Cloud for Auth, Postgres, Row Level Security, migrations, and generated database types.
- TypeScript, Tailwind CSS, ESLint, Zod, Vitest, and pnpm.

This stack keeps the prototype close to production patterns while staying simple to clone and review. Supabase Cloud is used instead of a local Docker stack so reviewers only need a free Supabase project and the documented environment variables.

## Deep Dive

The selected deep-dive area is **Design / Business Logic**.

Implemented focus areas:

- Database schema for profiles, categories, purchase requests, and approval history.
- RLS policies that let employees see only their own requests while admins can review all requests.
- Database triggers that enforce one-way status transitions and write approval audit history.
- Pure TypeScript status transition helpers and Zod validation schemas.
- Unit tests for status transitions and validation boundaries.

## Data Model

- `profiles`: one row per Supabase Auth user, with `employee` or `admin` role.
- `categories`: seeded request categories.
- `purchase_requests`: immutable request details plus `pending`, `approved`, or `rejected` decision state.
- `approval_history`: append-only audit rows written when an admin changes request status.

Request transitions are intentionally small:

```text
pending -> approved
pending -> rejected
approved -> terminal
rejected -> terminal
```

Rejected requests require a decision note. Request details cannot be edited after creation.

## Setup

Prerequisites:

- Node.js 20+
- pnpm
- A free Supabase Cloud project

Install dependencies:

```bash
pnpm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Fill in `.env.local` with values from Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`: Project Settings > API > Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Project Settings > API > anon public key
- `SUPABASE_SERVICE_ROLE_KEY`: Project Settings > API > service_role key
- `SUPABASE_PROJECT_REF`: Project Settings > General > Reference ID

Keep `SUPABASE_SERVICE_ROLE_KEY` only in `.env.local`. Never commit it.

Log in to Supabase, link the project, push migrations, seed reviewer users, and generate DB types:

```bash
pnpm setup
```

`supabase link` is interactive. When prompted, choose the Supabase project or enter the project ref and database password.

Start the app:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Reviewer Users

The seed script reads these values from `.env.local`. The defaults in `.env.example` are safe placeholders and can be used for a reviewer project:

- Employee: `employee@example.com` / `Employee123!`
- Admin: `admin@example.com` / `Admin123!`

Suggested walkthrough:

1. Sign in as the employee.
2. Create a new purchase request from `/requests/new`.
3. Sign out and sign in as the admin.
4. Open the request detail page.
5. Approve or reject the pending request.
6. Confirm the status and approval history changed.

## Scripts

- `pnpm dev`: run the development server.
- `pnpm lint`: run ESLint.
- `pnpm typecheck`: run TypeScript with `--noEmit`.
- `pnpm test`: run unit tests.
- `pnpm test:integration`: reserved for credentialed repository tests against `.env.local` when those tests are present.
- `pnpm build`: create a production build.
- `pnpm setup`: log in/link Supabase, push migrations, seed users, and generate `types/supabase.ts`.
- `pnpm db:push`: push Supabase migrations to the linked project.
- `pnpm db:seed-users`: seed the employee and admin users.
- `pnpm db:types`: regenerate Supabase database types.

## Verification

Current verified checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Live Supabase verification has also been run with a linked Cloud project: migrations applied, reviewer users seeded, employee create flow verified, admin approval flow verified, and approval history checked.

## Known Limits

- No email notifications, file attachments, or multi-step approval chains.
- No self-service user management UI; reviewer users are seeded through `supabase/seed-users.ts`.
- UI polish is intentionally functional and minimal so the implementation stays focused on the business logic deep dive.
- The checked-in automated tests cover domain and validation logic; repository behavior was verified through the live Supabase walkthrough instead of committed integration tests.

Approximate working time: one focused implementation day, including Supabase setup, verification, and handoff documentation.
