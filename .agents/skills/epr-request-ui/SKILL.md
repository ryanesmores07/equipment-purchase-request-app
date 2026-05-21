---
name: epr-request-ui
description: Request workflow UI specialist for the Equipment Purchase Request App. Use for Next.js App Router pages, RSC-first data display, create-request forms, request lists, filters, detail pages, approval panels, loading states, error states, and semantic accessible markup.
---

# EPR Request UI

## Overview

Use this skill for the visible workflow. Build only the screens needed for reviewers to create, inspect, approve, and reject equipment purchase requests.

## Screens

- `/login`: sign in as seeded employee or admin.
- `/requests`: list own requests for employee, all requests for admin.
- `/requests/new`: create a request with title, amount, and any approved extra fields.
- `/requests/[id]`: show request details, status, applicant/category info, and approval history.
- Admin decision panel: approve/reject pending requests only.

## Component Rules

- Use kebab-case filenames.
- Default to React Server Components for data reads.
- Keep client components small and only for interactivity.
- Add `loading.tsx` and `error.tsx` where routes fetch data.
- Use semantic HTML: `main`, `section`, `form`, `table`, `nav`, `button`, `label`.
- Keep styling simple, readable, and responsive.

## UX Defaults

- Show status clearly as pending, approved, or rejected.
- Disable or hide admin-only actions for non-admin users, but rely on server/RLS for enforcement.
- Show useful empty states.
- Display form validation errors near the relevant fields.
- Avoid decorative complexity; this is an internal workflow prototype.

## Done Criteria

- Employee can create and see own requests.
- Admin can see all requests and approve/reject pending requests.
- Pages do not overflow on mobile.
- Build and lint pass after UI work.
