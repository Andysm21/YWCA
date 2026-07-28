# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — Next.js ESLint (note: build itself ignores lint errors via `eslint.ignoreDuringBuilds` in next.config.js)
- `npm run typecheck` — `tsc --noEmit`

No test runner is configured in this project.

## Architecture

Next.js 13 (App Router) marketing + registration site for a YWCA summer/winter camp program, deployed to Netlify (`@netlify/plugin-nextjs`).

**Route groups** in `app/`:
- `app/(public)/` — public marketing site (home, camps list/detail, calendar, gallery, news, about, contact, packing list, registration form). Shares `app/(public)/layout.tsx`.
- `app/portal/` — internal admin portal (`login`, `admin`, `super-admin`), wrapped by `app/portal/layout.tsx` which renders `PortalSidebar` for all routes except `/portal/login`.

**Data layer**: All camp/content data (`seasons`, `allCamps`, `newsItems`, `leaders`, `faqItems`, `packingCategories`, `historyTimeline`, `mockRegistrations`) is hardcoded in `lib/camp-data.ts` as static TypeScript objects/arrays — this is the source of truth for pages/components, not a CMS. It also exports shared formatters (`formatDateRange`, `formatDate`, `formatPrice`, `getStatusLabel`) used across camp/registration UI. Real persistence only exists for registrations, via Supabase (`lib/supabase-client.ts`, table defined in `supabase/migrations/`) — the `registrations` table has RLS enabled but allows public (anon) CRUD, since the registration form has no auth.

**Role/auth model**: `components/role-context.tsx` provides a client-side `RoleProvider`/`useRole()` context (`'guest' | 'admin' | 'super-admin'`, plus `authed`) gating the portal UI. This is in-memory only — no real auth/session backend; role state resets on reload.

**Component structure**:
- `components/sections/` — page-level content components, one per public route (e.g. `camps-content.tsx`, `register-content.tsx`), imported into the corresponding `app/(public)/**/page.tsx`.
- `components/portal/` — portal page content + `portal-sidebar.tsx` nav.
- `components/shared/` — reusable domain widgets shared across sections (e.g. `camp-card`, `camp-calendar`, `admin-data-table`, `status-pill`, `stat-card`).
- `components/ui/` — shadcn/ui primitives (Radix-based), configured via `components.json` (aliases: `@/components`, `@/lib/utils`, `@/hooks`).

Path alias `@/*` maps to repo root (see `tsconfig.json`).

Styling: Tailwind CSS with a custom theme in `tailwind.config.ts` (camp brand accent colors: orange/teal/gold, referenced throughout `lib/camp-data.ts` and section components).

Env vars required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env`).


# YWCA Camp Website — Project Context

## What this is
Rebuilding ywcacampegypt.com as a Next.js app. Current folder is FE-only,
generated in Bolt.new from a v0-style prompt. No backend/DB yet.

## Roles
- Guest: browse camps, register
- Admin: /portal/admin — VIEW ONLY dashboard of registrations
- Super Admin: /portal/super-admin — full CRUD on seasons, camps, content, registrations
- Admin/Super Admin routes are NOT linked in public nav — reachable only by
  direct URL, and will need real auth (not just hidden routes)

## Core data model (not yet implemented)
- Season: year (e.g. 2026), type (Summer/Winter), status (open/closed)
- Camp: belongs to a Season — name, date range, age range, capacity, price,
  description, cover photo
  - Winter camps: Kids Camp, Teen Camp
  - Summer camps: Kids 1, Kids 2, Kids 3, Kids 4, Girls, Uni, Boys, Leadership
- Registration: belongs to a Camp — camper info, guardian info, payment status,
  2-step submission flow
- User: role (guest/admin/super_admin)

## Planned stack
- Frontend: Next.js 14 App Router, Tailwind, shadcn/ui (already scaffolded)
- Backend/DB: Supabase (Postgres + Auth + Storage) — not yet connected
- Hosting: leaning Vercel; Bluehost was original ask but isn't Next.js-compatible
  on standard shared hosting

## Project plan / current step
1. Design FE — DONE (this codebase)
2. Design entities/schemas — NEXT
3. Implement FE+BE, connect DB
4. Secure everything (real auth on /portal/*, RLS, rate limiting)
5. Test + improvements
6. Deploy

## Notes
- All content should be specific to YWCA Camp (Ras Sedr, Egypt), not generic
- Brand colors: sun-orange, sea-teal, sand-beige