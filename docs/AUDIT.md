# Ansai — Codebase & Database Audit

_Date: 2026-10-16 · Scope: full repository at commit `ee14377` + live Supabase project `avumcgrgngotinmibwxw` (read-only inspection)._

This document records the state of the project **before** the hardening work. Every finding has an ID (`A-xx`) so that later commits, `docs/TEST-PLAN.md` and the bug list can reference it.

Baseline: `npx tsc --noEmit` passes. `npm run lint` is broken. There are no tests.

---

## 1. Database schema

The schema exists in the live project but **not in the repo** (no `supabase/` folder, no migrations). Below is the real schema, compared with what the code uses.

### 1.1 Tables

| Table | Columns (type, default) | Constraints | Used by code |
|---|---|---|---|
| `profiles` | `id uuid` PK → `auth.users` cascade · `email text NOT NULL` · `full_name text` · `avatar_url text` · `interface_language text ='es'` · `onboarded bool =false` · `onboarding_step int =1` · `current_business_id uuid` → `businesses` set null · `created_at`, `updated_at` | `interface_language IN (es,en,nl,fr,de)` | `useAuth`, `auth/callback`, `login`, `complete-onboarding`, `settings/account` |
| `businesses` | `id uuid` PK · `user_id uuid NOT NULL` → `auth.users` cascade · `name text NOT NULL` · `type text NOT NULL` · `city`, `country ='BE'`, `address`, `phone`, `email`, `website` · `opening_hours jsonb ='{}'` · `created_at`, `updated_at` | `type IN (restaurant,bar,cafe,hotel,other)` | `useAuth`, `complete-onboarding`, `settings/business`, `generate` |
| `reviews` | `id uuid` PK · `business_id` → `businesses` cascade · `customer_name text NOT NULL` · `rating int NOT NULL` · `text text NOT NULL` · `language text ='es'` · `source text ='manual'` · `source_url`, `source_review_id` · `review_date timestamptz NOT NULL =now()` · `status text ='pending'` · `created_at`, `updated_at` | `rating 1..5` · `language IN (es,en,nl,fr,de)` · `source IN (google,facebook,tripadvisor,thefork,manual)` · `status IN (pending,approved,rejected,published)` | dashboard, reviews, insights, AppShell, generate |
| `responses` | `id uuid` PK · `review_id` UNIQUE → `reviews` cascade · `text text NOT NULL` · `status text ='generated'` · `model_used text` · `tokens_input`, `tokens_output int =0` · `edited_text text` · `created_at` · `approved_at` · `published_at` | `status IN (generated,edited,approved,rejected,published,generation_failed)` · `model_used = ANY(['claude-haiku-4-5','claude-opus-4-7',NULL])` (broken, see A-02) | reviews, dashboard, insights, generate |
| `tone_configs` | `id uuid` PK · `business_id` UNIQUE → `businesses` cascade · `formality ='neutral'` · `response_length ='medium'` · `response_language ='auto'` · `signature =''` · `forbidden_phrases text[]`, `favorite_phrases text[]` · `updated_at` | `formality IN (very_informal..very_formal)` · `response_length IN (short,medium,long)` · `response_language IN (auto,es,en,nl,fr,de)` | settings/tone, generate |
| `integrations` | `id` · `business_id` → cascade · `provider` · `status ='disconnected'` · `external_account_id/name` · **`access_token`, `refresh_token`** · `token_expires_at` · `scopes text[]` · `last_sync_at`, `last_error`, `connected_at`, `created_at` | UNIQUE(`business_id`,`provider`) · `provider IN (google,facebook,tripadvisor,thefork)` · `status IN (disconnected,connected,error,expired)` | settings/integrations (`select *`) |
| `team_members` | `id` · `business_id` → cascade · `user_id` → `auth.users` · `email NOT NULL` · `role ='viewer'` · `invited_at`, `invited_by` → `auth.users`, `accepted_at`, `last_access_at` | UNIQUE(`business_id`,`email`) · `role IN (owner,admin,editor,viewer)` | settings/team (read only) |
| `daily_metrics` | aggregates per business/day (`total_reviews`, `average_rating`, distributions, `top_topics jsonb`…) | UNIQUE(`business_id`,`date`) | **Not used anywhere** |

### 1.2 Triggers and functions

- `on_auth_user_created` (AFTER INSERT on `auth.users`) → `public.handle_new_user()` (SECURITY DEFINER): inserts `profiles(id, email, full_name)`.
- `trigger_*_updated_at` (BEFORE UPDATE) → `public.set_updated_at()` on `profiles`, `businesses`, `tone_configs`, `reviews`. (`responses`, `integrations` and `team_members` have no `updated_at` column.)

### 1.3 RLS

RLS is **enabled on all 8 tables**. Policies scope everything to `businesses.user_id = auth.uid()`; `profiles` is scoped to `id = auth.uid()`.

Gaps:
- `responses`: no DELETE policy (fine: cascades from `reviews`).
- `daily_metrics`: SELECT only (fine: unused).
- `team_members`: two overlapping permissive SELECT policies (`ALL` + `SELECT`).
- All policies call `auth.uid()` directly instead of `(select auth.uid())`. Postgres re-evaluates it per row (21 performance advisor warnings).

### 1.4 Advisor warnings (live project)

- **Security:** `handle_new_user` and `set_updated_at` have a mutable `search_path`. `handle_new_user` is SECURITY DEFINER and executable by `anon` and `authenticated` via `/rest/v1/rpc/handle_new_user`. Leaked-password protection is disabled in Auth.
- **Performance:** RLS init-plan warnings (above). FKs without an index (`profiles.current_business_id`, `team_members.invited_by`). No composite index for the app's real access pattern `reviews(business_id, status)` / `reviews(business_id, review_date)`.

### 1.5 Live data snapshot

4 auth users, 1 business, 15 reviews, 15 responses (13 approved/approved, 1 pending/edited, 1 rejected/generated). Models stored: `claude-haiku-4-5-20251001` (12), `claude-opus-4-7` (3).

### 1.6 Enum values the code actually uses

| Field | Values written or read by code | Matches DB? |
|---|---|---|
| `reviews.status` | `pending`, `approved`, `rejected` (UI maps to `pending/responded/ignored`) | ✅ (`published` never written) |
| `responses.status` | `generated`, `generation_failed`, `edited`, `approved`; UI-only `generating` | ✅ (CLAUDE.md is out of date: it only lists two) |
| `responses.edited_text` | read and written | ✅ exists |
| `responses.model_used` | `claude-opus-4-7`, `claude-haiku-4-5-20251001` | ⚠️ the CHECK lists `claude-haiku-4-5`, but the CHECK is ineffective (A-02) |
| `reviews.source` | form offers `manual/google/facebook/tripadvisor` | ✅ (`thefork` allowed but not offered) |
| `integrations.status` | `disconnected/connected/error/expired` | ✅ |

---

## 2. Findings

Severity: **High** = broken behaviour, data loss, security, or something a recruiter would notice in the first minute. **Medium** = wrong data, inconsistency, a visible but contained defect. **Low** = polish, hygiene.

### 2.1 Infrastructure and auth

| ID | Sev | Finding | Where |
|---|---|---|---|
| A-01 | High | Schema, RLS, triggers and seed are not in the repo. The project can't be rebuilt if Supabase pauses or is deleted again (this already happened once). | — |
| A-02 | Medium | `responses_model_used_check` uses `= ANY(ARRAY[..., NULL])`. A non-matching value evaluates to `NULL`, not `false`, so the CHECK **never rejects anything**. That's why `claude-haiku-4-5-20251001` is stored even though it's "not allowed". | DB |
| A-03 | High | `middleware.ts` only refreshes cookies; it doesn't protect any route. Private pages are guarded only by a client `useEffect` in `AppShell`, so the page JS ships and runs before the redirect. CLAUDE.md describes a protecting middleware that no longer exists. In Next 16, `middleware.ts` is also deprecated in favour of `proxy.ts`. | `middleware.ts` |
| A-04 | High | `useAuth()` is a plain hook with local state, not a context. Every component that calls it (AppShell, AppHeader, each page, `useInsightsData`) opens its **own** `onAuthStateChange` listener and runs its **own** `profiles` + `businesses` fetch. That's 3–4 duplicate round-trips per page load, and it's the root cause of the race conditions that recent commits keep patching (`isFetchingRef`, the visibilitychange refetch). | `lib/auth/useAuth.ts` |
| A-05 | High | **Open redirect** in `/auth/callback`: `NextResponse.redirect(\`${origin}${next}\`)` with user-controlled `next`. `?next=@evil.com` yields `https://ansai.app@evil.com`. | `app/auth/callback/route.ts:14` |
| A-06 | Medium | Open redirect in `/login?redirect=` (passed straight to `router.push`). | `app/login/page.tsx:22,56` |
| A-07 | High | `complete-onboarding` logs but ignores a failed business insert and still sets `onboarded=true`. The user then lands in an app where every page says "no business" with no way out. | `app/api/complete-onboarding/route.ts:37` |
| A-08 | Medium | If the profile fetch fails (network/RLS), `AppShell` shows the spinner forever (`profile === null`), with no error and no retry. | `components/app/AppShell.tsx:64` |
| A-09 | Low | `/dev-login` only redirects to `/login` or `/dashboard`. It adds nothing and is blocked in production. | `app/dev-login/page.tsx` |
| A-10 | Medium | `integrations` exposes `access_token`/`refresh_token` to the browser: RLS allows SELECT and the page does `select("*")`. No tokens are stored today, but once Google is connected they would be. | `settings/integrations/page.tsx:151` |
| A-11 | Low | `handle_new_user` security advisor findings (search_path, RPC-callable). Leaked-password protection is off. | DB |

### 2.2 Broken or misleading functionality

| ID | Sev | Finding | Where |
|---|---|---|---|
| A-12 | High | **Dashboard approve/reject doesn't persist.** `PendingReviews` only removes the item from local state, so it reappears on reload. The dashboard slide-over also has no edit or retry. | `components/app/dashboard/PendingReviews.tsx:26-34` |
| A-13 | High | Reviews: approve/reject ignore Supabase errors and always show a success toast. Approve also sets `responses.status='approved'` even when no response exists, and reject leaves the response as `generated`. | `reviews/page.tsx:407-424` |
| A-14 | High | Reviews: the manual-review insert error is swallowed (`if (error) return;`). The modal stays open with no message. | `reviews/page.tsx:171` |
| A-15 | High | `/api/responses/generate` ignores the result of every `responses` upsert. If the write fails, the client gets 200 + text but nothing is saved, so the text disappears on reload. | `generate/route.ts:188,214,237` |
| A-16 | High | Billing is entirely fake: "Pro €75/mes", "Visa •••• 4242", four invoices, "renews 11 Jun 2026", all hardcoded and shown as if real. | `settings/billing/page.tsx:9-20` |
| A-17 | High | Landing waitlist (Hero + FinalCTA) writes the email to **`localStorage`** and shows "success". Leads are silently lost. | `components/landing/FinalCTA.tsx:12` |
| A-18 | High | No "Try the demo" path. `/demo` is a `setTimeout(2000)` that returns one of 10 canned texts regardless of input. The canned texts contain em-dashes, the exact "AI tell" the real endpoint strips. | `app/demo/page.tsx` |
| A-19 | Medium | "Coming soon" actions look functional: Google "Connect" (primary button), Team "Invite" (full modal, then a toast), Billing "Change plan / Change card / Download / Cancel". | integrations, team, billing |
| A-20 | Medium | Sidebar links to `/help`, which doesn't exist (404). The sidebar's Settings submenu omits Team. The mobile drawer doesn't close after navigating. | `components/app/Sidebar.tsx:168,62` |
| A-21 | Medium | Header menu "Profile" and "Settings" items do nothing (they only close the menu). | `components/app/AppHeader.tsx:113-126` |
| A-22 | Medium | The slide-over shows `editedText \|\| draftText`. Approving doesn't persist an unsaved draft, and `PendingReviews` keeps `useState(initialReviews)`, so it never resyncs with its props. | `ReviewSlideOver.tsx:88`, `PendingReviews.tsx:24` |

### 2.3 Wrong or inconsistent data

| ID | Sev | Finding | Where |
|---|---|---|---|
| A-23 | High | The dashboard computes "this month", the 30-day trend and the chart from `created_at`. Insights uses `review_date`. A manual review entered today for a visit last month counts as "this month" on the dashboard but not in Insights. Any seed with historical `review_date` would show every review as "this month". | `dashboard/page.tsx:96-200` |
| A-24 | Medium | The Insights "response rate" counts **any** `responses` row, including `generation_failed`, still-`generated` and rejected ones. Live data shows 100% while 2 of 15 reviews aren't answered. | `useInsightsData.ts:207` |
| A-25 | Medium | The Insights "avg response time" is always "—", although the dashboard computes it. | `useInsightsData.ts:240` |
| A-26 | Medium | Chart labels hardcode `"es"`/`"es-ES"` month names. The Rating tooltip label `"Rating"` and the critical issues `"Reseña 1 ★"` are hardcoded. | `dashboard/page.tsx:213`, `useInsightsData.ts:80`, `RatingChart.tsx:90`, `useInsightsData.ts:150` |
| A-27 | Medium | The 90-day bucketing uses `ceil(day/7)` within the month (week 5 = 1–3 days), so points are uneven. | `useInsightsData.ts:72` |
| A-28 | Medium | Topics: no pipeline. The section always shows the empty state. | `insights/page.tsx` |

### 2.4 Mocks and types

| ID | Sev | Finding | Where |
|---|---|---|---|
| A-29 | Medium | `lib/mock/*` data functions (`getMockDashboardData`, `getAllMockReviews`, `getMockPendingCount`, `getMockInsightsData`, `getRatingDomain`) are **dead code**. Nothing calls them. Only their **types** are imported (11 imports across dashboard, insights, KPICard, charts, slide-over), so production types live in a "mock" folder. | `lib/mock/` |
| A-30 | Medium | The `Review` type diverges from the DB (`status`, `source`, `language`). Components work around it with `Omit<…>` + `string` and untyped `any` row mappers duplicated in dashboard and reviews (`mapRow`, `mapDbReviewToCard`, `formatRelativeTime` ×2). | `ReviewSlideOver.tsx:22`, `reviews/page.tsx:42`, `dashboard/page.tsx:78` |
| A-31 | Low | Model IDs are hardcoded in two places (route and slide-over label mapping). | `generate/route.ts:113`, `ReviewSlideOver.tsx:63` |

### 2.5 i18n (hardcoded text)

The 5 locale files have identical key sets (502 keys each). The problem is text that never goes through `t()`.

| ID | Sev | Finding |
|---|---|---|
| A-32 | High | **All auth pages are Spanish-only** and don't mount `TranslationProvider`: `login`, `signup`, `forgot-password`, `reset-password`, `onboarding` (titles, labels, buttons, "Continuar con Google", "Redirigiendo...", errors, success screens). |
| A-33 | Medium | Raw Supabase error messages (English) are shown to the user on signup, forgot-password and reset-password. "User already registered" and "weak password" aren't mapped. |
| A-34 | Medium | Private app: `"URL no válida"` (business), `"miembro/miembros"` and the empty-state sentence (team), `"¿Seguro?"`, `"No, mantener"`, `"— activo"`, `"/mes"` (billing), the delete-account paragraph (account), `aria-label="Abrir menú"/"Cerrar menú"`, the "Manual" source option, and the tone preview's sample review and reply (Spanish regardless of locale). |
| A-35 | Low | `html lang="es"` is fixed. The profile's `interface_language` is saved but never applied at login (the locale comes only from `localStorage`). The storage key is `replyo-locale`. |

### 2.6 AI endpoint

| ID | Sev | Finding |
|---|---|---|
| A-36 | High | No rate limit and no per-user quota. Any authenticated user can loop `POST /api/responses/generate` and burn Anthropic credits. This is critical once a public demo account exists. |
| A-37 | Medium | No body validation, and every failure returns 404/500 (no 401/403/429). Ownership is enforced only implicitly by RLS. |
| A-38 | Medium | The prompt is built inline (≈80 lines) inside the handler, so it's untestable. The review text is interpolated without delimiting, so a malicious review can try to steer the reply (prompt injection). |
| A-39 | Low | Model IDs aren't configurable via env (see A-31). |

### 2.7 Repo hygiene, SEO, tooling

| ID | Sev | Finding |
|---|---|---|
| A-40 | High | `npm run lint` is broken: `next lint` was removed in Next 16. `eslint-config-next@15.0.3` doesn't match `next@16.2.4`, and there's no ESLint config file. |
| A-41 | Medium | `README.md` is out of date: it says Next 15 and lists Italian instead of German, and it has no setup, demo or architecture. |
| A-42 | Medium | `SETUP-AUTH.md` holds stale ZIP install instructions with Windows paths. |
| A-43 | Medium | `tsconfig.tsbuildinfo` and `.claude/settings.local.json` (local permission allowlist) are committed. |
| A-44 | Medium | `.env.local.example` lacks `SUPABASE_SERVICE_ROLE_KEY` (required by onboarding) and has no comments. |
| A-45 | Medium | SEO: there's no `public/` folder at all (no favicon, no OG image), and no `robots.txt` or `sitemap.xml`. `metadata.alternates` advertises `/es`, `/en`, `/nl`… routes that 404. The canonical is `ansaii.vercel.app`. There's no per-page metadata, and no custom 404 page. |
| A-46 | Low | "Replyo" remains in `CLAUDE.md`, `SETUP-AUTH.md`, `localStorage` keys (`replyo-locale`, `replyo-waitlist`) and `.claude/settings.local.json`. |
| A-47 | Low | Dead or empty files: `components/auth/LogoutButton.tsx` (unused), `components/ui/index.ts` (never imported), pass-through `layout.tsx` files in `(private)/dashboard`, `reviews`, `insights` and `onboarding`. `daily_metrics` table unused. |
| A-48 | Low | `.npmrc` has `legacy-peer-deps=true`, which hides peer-dependency conflicts. `react`/`react-dom` are pinned to `19.0.0`. |
| A-49 | Low | `CLAUDE.md` is out of date: protecting middleware, two response statuses, "mock data in use", the `useAuth` description. |
| A-50 | Low | No tests, no CI, no Prettier. |

---

## 3. Prioritised fix plan

| Priority | Items | Phase |
|---|---|---|
| **High** | A-01 schema in repo + seed | 1 |
| | A-18 public demo + A-36 AI quota | 2 / 6 |
| | A-03 server-side route protection, A-05/A-06 open redirects, A-07 onboarding, A-32/A-33 auth i18n + error mapping | 4 |
| | A-04 shared auth context (removes duplicate fetches) | 4 |
| | A-12/A-13/A-14/A-15 actions that don't persist or fail silently | 5 / 6 |
| | A-16 fake billing, A-17 fake waitlist, A-23 date-field inconsistency | 5 |
| | A-40 lint | 7 |
| **Medium** | A-02 broken CHECK, A-10 token exposure, RLS `(select auth.uid())` + indexes | 1 |
| | A-08 spinner, A-19 coming-soon affordance, A-20/A-21 dead links, A-22 slide-over state, A-24..A-28 insights data, A-29/A-30 types, A-34 hardcoded text | 5 |
| | A-37/A-38 validation, status codes, `buildPrompt` | 6 |
| | A-41..A-45 docs, env, SEO | 5 / 7 |
| **Low** | A-09, A-11, A-31, A-35, A-39, A-46..A-50 | 1 / 4 / 6 / 7 / 8 |

Decisions to confirm during each phase are listed in the final summary.
