# Equipment Purchase Request App - Current Design Spec

**Date:** 2026-05-26
**Status:** Current implementation reference
**Assignment:** https://www.notion.so/Web-3664c366b0548085b672e7a89dbdc866
**Deep-dive area:** UI/UX and front-end development

## Goal

Build a reviewer-runnable prototype for an internal equipment purchase request workflow.

- Employees create equipment purchase requests and view only their own requests.
- Employees can edit or cancel their own pending requests.
- Admins view all employees' requests.
- Admins approve or reject pending requests.
- The reviewer-facing strength area is the request workflow UI: clear states, responsive layouts, action feedback, loading/error states, semantic markup, and accessible form behavior.

## Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 App Router | Server-rendered request views and Server Actions keep the app simple and reviewer-friendly. |
| Language | TypeScript | Strict typed boundaries for routes, repositories, validation, and domain rules. |
| Styling | Tailwind CSS | Fast, dependency-light styling with readable component-local classes. |
| UI components | Plain React components | Keeps the prototype lean; no shadcn/toast dependency is needed for this scope. |
| Auth/database | Supabase Cloud Auth + Postgres + RLS | Real role-based access and reproducible migrations without a local Docker dependency. |
| Validation | Zod | Shared form/server-action validation rules. |
| Tests | Vitest | Focused unit coverage for status transitions, validation, and activity diff summaries. |
| Package manager | pnpm | Lockfile-backed reproducible installs. |

## App Structure

```text
app/
  (auth)/login/            login page and login action
  (app)/layout.tsx         authenticated shell
  (app)/requests/page.tsx  employee/admin request list
  (app)/requests/new/      employee-only create form
  (app)/requests/[id]/     detail page, timeline, admin decision panel
  (app)/requests/[id]/edit employee-only pending edit form
components/                small workflow UI components
lib/auth/                  route/action role guards
lib/domain/                request status state machine
lib/repositories/          Supabase data access
lib/supabase/              SSR/browser/middleware clients
lib/validation/            Zod request schemas
supabase/migrations/       reproducible database schema, RLS, triggers
supabase/seed-users.ts     reviewer user seed script
tests/                     focused unit tests
```

## Data Model

- `profiles`: one profile per Supabase Auth user, with `employee` or `admin` role.
- `categories`: selectable request categories.
- `purchase_requests`: request title, category, amount, notes, status, applicant, decision/cancellation metadata.
- `approval_history`: strict decision audit for approve/reject/cancel status changes.
- `request_activity`: user-facing activity timeline for create, edit, cancel, approve, and reject events, including edit before/after details.

Valid request statuses:

```text
pending -> approved
pending -> rejected
pending -> cancelled
approved -> terminal
rejected -> terminal
cancelled -> terminal
```

## Authorization

Supabase RLS is the final authorization boundary.

- Employees can select only their own requests.
- Employees can create requests only as themselves.
- Employees can update or cancel only their own pending requests.
- Admins can select all requests.
- Admins can approve or reject pending requests.
- Admins cannot create requests in this prototype.

Server-side role guards mirror those rules for clearer UX and defense in depth.

## UI/UX Decisions

- Japanese-first UI and README because the assignment and likely reviewer audience are Japanese.
- Route-level `loading.tsx` files cover list, detail, create, and edit routes.
- Redirect-based success banners are used after create, edit, cancel, approve, and reject actions. This fits Server Actions without adding a toast library.
- Admin request filters stay server-rendered and fresh because the list is auth/RLS-sensitive.
- Mobile request lists use tappable cards; desktop keeps the denser table.
- Long user-entered text is constrained and wrapped to prevent mobile overflow.
- Admin create actions are hidden and blocked at route, action, and RLS levels to keep role responsibilities clear.

## Reproducibility

The reviewer path is documented in `README.md`:

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local`.
3. Fill Supabase Cloud values.
4. Run `pnpm setup` to link, migrate, seed reviewer users, and generate DB types.
5. Run `pnpm dev`.

The repository includes migrations, seed users, `.env.example`, and checked-in Supabase types. Secrets stay out of git.

## Deliberate Scope Limits

- No email/Slack notifications.
- No file attachments.
- No multi-step approval routing.
- No user-management dashboard.
- No CI/deployment pipeline.
- No custom cache layer for request lists.

These limits keep the prototype aligned with the 2-8 hour assignment expectation and the selected UI/UX deep-dive.
