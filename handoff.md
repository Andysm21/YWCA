# Handoff — YWCA Camp Egypt project state (2026-07-30)

Read this first in a new session. CLAUDE.md has stable architecture docs; this file is the "what's actually going on right now" doc — outstanding actions, test data, recent bugs, things not yet verified.

## ⚠️ Action required from user (blocking)

1. **Run this migration**: `supabase/migrations/20260730000003_fix_analytics_null_auth_bypass.sql`
   Fixes a real security bug found during testing: `get_camp_analytics`/`get_season_analytics` used `IF NOT public.is_admin() THEN RAISE EXCEPTION` — PL/pgSQL treats a NULL condition as false, and `is_admin()` returns NULL (not FALSE) for non-staff callers, so the exception never fired and the RPC silently returned real data to anyone who could call it. Proved live via a service-role call. Fixed to `IF public.is_admin() IS NOT TRUE THEN`. Low real-world exposure today (no "authenticated but not staff" user type exists in this app), but the gate was genuinely broken and must be patched.
2. Rotate `CRON_SECRET` in `.env.local` if you haven't already — a placeholder value (`test-secret-for-local-verification`) was used during local testing. Confirmed you set a real one, but double check `.env.local` reflects it (last I checked it still had the placeholder — you may have only set it in Vercel, which is fine for prod but leave *something* in `.env.local` for local retry-route testing).
3. Set `CRON_SECRET` on the Vercel project env vars before deploy, or the cron trigger path (`vercel.json` → `/api/cron/retry-quota-failed-emails`, scheduled `15 22 * * *` UTC = 00:15 Africa/Cairo) is unauthenticated.
4. All other migrations from this session are confirmed already run: `20260730000001_analytics_functions.sql`, `20260730000002_email_send_log.sql`. Camp-types and email-status migrations from earlier sessions are also confirmed run.

## What was verified this session (real, not code-review)

A full consolidated pass tested every major feature live — via real curl calls, a real DB-backed capacity test, and (for portal-auth-gated features) a real Supabase magic-link login driven through Playwright, not a bypass. Results:

- **Waitlist/capacity logic**: PASS. Step 1 and Step 2 both correctly gate on `count(confirmed + payment_submitted) >= capacity`. Found and fixed a real bug: the "camp filled during Step 2" branch was missing its waitlist email entirely — fixed in `app/api/register/payment/route.ts`.
- **Confirm Payment / Mark Refunded**: PASS (tested live via real staff session). Both write correct DB state + `audit_log` rows.
- **Season/Camp CRUD (Add/Edit/Delete)**: PASS (tested live). Add Season, Edit Camp price, Delete Camp (zero-registration camp) all verified via real UI clicks + DB checks.
- **Admin content tab** (news/gallery for `admin` role, not just `super_admin`): already existed, confirmed working, `requireStaff()` correctly allows both roles.
- **Camp-types dropdown**: already existed, seed data confirmed correct (Summer: Kids 1-4/Girls/Boys/Uni/Leadership; Winter: Kids Camp/Teen Camp/Leadership), unique constraint confirmed.
- **Bank details copy buttons**: PASS, real paste-test. Beneficiary copies exact Arabic text; IBAN copies with spaces AND `EG` prefix stripped, display keeps them.
- **Double-submission prevention**: PASS. All 4 non-pending statuses show read-only view, never the form. Real curl bypass attempt (second POST to an already-submitted registration) correctly rejected with 409.
- **"Check my status" lookup page** (`/register/status`): PASS. Correct combo returns real status; any wrong combo returns identical generic error (no enumeration); rate limiter confirmed genuinely engaging (5/10min, shared bucket with the payment-page lookup fallback).
- **Analytics pages**: data/aggregation logic confirmed correct against real numbers — but see the blocking security fix above.
- **Logo placement**: confirmed present in navbar, footer, portal sidebar, and as a real (non-empty, non-placeholder) favicon.
- **Email logging coverage**: audited every email-sending code path — registration confirmation, waitlist notification (both trigger points), waitlist-promotion notification, manual Resend button, quota-retry cron route — all confirmed to funnel through the single `recordEmailResult()` choke point, which writes both `registrations.email_status` and a new `email_send_log` row. Found and fixed one gap: the promote route's outer catch block wasn't calling `recordEmailResult` (practically unreachable today since `sendMailSafely` never throws to its caller, but inconsistent — now fixed).
- **Gmail quota-detection logic**: unit-tested and live-tested against a real simulated quota failure → real retry route resend → real DB verification. Matches Google's actual documented error text (`550 5.4.5 ... Daily user sending limit exceeded ... support.google.com/mail/?p=DailyLimit`), not a guess.

**Not verified** (can't be, without a browser session the assistant controls persistently): the actual rendered "Today's Email Usage" widget pixel-for-pixel — verified at the query level only (reproduced its exact Cairo-boundary query, confirmed it returns the right count). User said they'd check the widget render themselves.

## Test data currently in the DB — NOT cleaned up, left for inspection

Per explicit instruction, none of this was deleted. Ask before removing.

- **Season**: Summer 2026 (`kids-camp-2026`'s season) — original real season, untouched.
- **Season**: Winter 2027 (created live during CRUD testing) — id `2b93448f-...`, status `draft`.
- **Camp**: `kids-1-test-2026` — "Kids 1", Summer 2026, capacity 2 (deliberately small for capacity testing), price EGP 5,500 (edited during testing, was 5,000).
- **Registrations on `kids-1-test-2026`**:
  - `YC260012` "Test Camper One" — confirmed → refunded (both actions tested live)
  - `YC260013` "Test Camper Two" — `payment_submitted`, real Drive files uploaded, one extra `sent` email logged during quota-retry testing
  - `YC260014` "Test Camper Three" — `waitlisted`, position 1
  - `YC260015` "Test Camper Four" — `waitlisted`, position 2, has a simulated quota-failure `email_send_log` row (id `6cde5005-...`) plus its real retry-success row (id `5b0713f4-...`)
- Real Drive folder created: `[root] / Summer 2026 / Kids 1 / Certificates` and `/Payments` — has real (tiny 4x4 PNG) test uploads.
- Multiple other older test registrations exist on `kids-camp-2026` (the original real camp) from earlier sessions — registration numbers YC260001–YC260011ish, various states, some already cleaned, some not. Not fully inventoried — check `registrations` table directly if this matters.
- `site_settings.meeting_points` and `bank_instructions`/`bank_beneficiary`/`bank_iban` are all populated with REAL values (not test placeholders) — do not treat these as test data.

## Recent architecture additions this session (not yet in CLAUDE.md's own text — CLAUDE.md has the env var docs but not full feature descriptions)

- **`/register/status`** — standalone guest-facing status lookup page, shares the `/api/register/lookup` rate limit bucket with the payment page's fallback.
- **Double-submission guards**: SSR gate on the payment page (`app/register/[campSlug]/payment/page.tsx`) + atomic conditional UPDATE in `app/api/register/payment/route.ts` (`.eq('status', 'pending_payment')` on the final write, checks affected row count).
- **`components/sections/registration-status-view.tsx`** — shared read-only status card, used by both the payment-page gate and the status lookup page.
- **Analytics**: `/portal/admin/analytics` (index), `/portal/admin/analytics/camps/[campId]`, `/portal/admin/analytics/seasons/[seasonId]` — both `admin` and `super_admin` can view (middleware carve-out at `/portal/admin/analytics/*`, since the rest of `/portal/admin/*` is admin-only). Backed by `get_camp_analytics`/`get_season_analytics` SQL RPCs (aggregate-only, no raw-row egress). Charts via `recharts`, client components in `components/portal/camp-analytics-charts.tsx` and `season-analytics-charts.tsx`.
- **Email quota tracking**: `email_send_log` table, `lib/email.ts`'s `classifySmtpError()` (quota vs. invalid-address vs. other), "Today's Email Usage" widget + manual retry button on Super Admin overview (`components/portal/email-quota-widget.tsx`), retry route at `/api/cron/retry-quota-failed-emails` (GET for Vercel Cron, POST for the manual button — both share one handler), secured by `CRON_SECRET` bearer token OR staff session.
- **Guest capacity redaction**: guest-facing camp queries (`getOpenCamps`, `getCampBySlug`, `getOpenSeasonsWithCamps`) redact `capacity`/`spotsLeft` to `-1` sentinel before the object crosses into a Client Component (verified in the actual RSC flight payload, not just "doesn't render it"). Portal queries keep real numbers. Guest UI now shows only `displayStatus` (Open/Filling Fast/Waitlist/Closed).
- **Final approved confirmation email template** — `lib/email.ts`'s `sendPendingPaymentEmail` is a fully custom self-contained HTML doc (not the shared `wrapEmailHtml` used by the waitlist templates) — do not "simplify" it back into the shared wrapper without explicit sign-off, per an explicit prior instruction. Logo is a hosted Google Drive `uc?export=view` hotlink (flagged as a stopgap — switch to a real hosted URL post-deploy).
- **Google Drive folder structure**: `[root] / {Season Name} / {Camp Name} / Certificates|Payments` — OAuth2 (not service-account) auth, refresh token is revocable (see CLAUDE.md env var docs).

## Known non-blocking gaps / flagged-not-built

- Registration-over-time timeline chart on the per-camp analytics page — explicitly flagged and skipped to keep scope in check, not forgotten.
- Season-level per-camp status breakdown is a 3-bucket proxy (filled/waitlisted/open), not the full 5-status breakdown — `get_season_analytics` doesn't return that granularity; would need a query shape change.
- True interval-based caching on analytics pages wasn't implemented — `cookies()`-based auth forces the route dynamic regardless of a `revalidate` export, and `unstable_cache` doesn't support `cookies()`-derived data. Not faked. Each view is a cheap aggregate query anyway (bytes, not rows), so this matters less than it sounds.
- Super Admin Settings tab is still a static stub, not wired to `site_settings` — meeting points / bank details are currently only editable via direct DB writes, not the UI.
- `camps.drive_folder_id` column exists in the schema but isn't used — Drive folders are resolved fresh on every upload instead (simpler, self-healing).

## Environment / process notes for whoever picks this up

- This project's session-long convention: **the assistant cannot execute raw SQL/DDL** — service-role key only does REST table operations. Every schema change is a migration file the user must run themselves via the Supabase SQL Editor. Always say so explicitly, never claim a migration is "done" until the user confirms.
- `.env.local` has no trailing newline by default — appending to it with a plain `>>` can glue onto the last line. Happened once this session (caught and fixed immediately). Use a script that adds an explicit newline, or check the file after appending.
- Dev server occasionally hits a corrupted webpack cache (`Cannot read properties of undefined (reading 'call')` / `ENOENT` pack-file errors) — fix is `rm -rf .next` and restart, not a real app bug. Happened once this session mid-verification.
- Playwright is not an installed dependency of this project — `/Users/andrew/LabRadar/node_modules/playwright` was used as a workaround (import by absolute path) when browser-driven testing was needed (screenshots, real login flows). `npx playwright install chromium` was run once to get browser binaries.
- For testing portal-auth-gated routes/actions as a real staff user without interactive login: `supabase.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo: '.../portal/accept-invite' } })` via the service-role client, then drive that link through Playwright — `/portal/accept-invite` has fragment-token-parsing logic (`setSession()`) that works for this even though it's semantically an invite page. Save `page.context().storageState()` to reuse the session across multiple test scripts.
- Two real staff accounts exist: `andrewaks21@gmail.com` (super_admin), `epicmc2000@gmail.com` (admin).
- Caveman mode was active for most of this session (a hook-injected style constraint on responses) — purely a communication-style thing, does not affect code/commits, not part of the actual project state.
