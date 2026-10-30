# Security audit

_Date: 2026-10-30 · Scope: the whole repository at `726f851` plus the production Supabase project (`avumcgrgngotinmibwxw`, migrations 0001–0005 applied) · Method: code review, live tests against production through the public REST API, a production build served locally, and an embedded Postgres (PGlite) for migrations not yet applied._

Severity follows impact × likelihood for this app: a public demo, small user base, no payment data. **Critical/High** = data of one tenant reachable by another, auth bypass, or abuse visible to every visitor. **Medium** = needs a precondition or has limited impact. **Low/Info** = hardening or confirmation that something is fine.

## Summary

| ID | Finding | Severity | Status |
|---|---|---|---|
| S-01 | Demo visitors could rename the business, change the tone signature, profile and team, visible to the next visitor | High | Fixed in code + RLS (`0006`, pending approval) |
| S-02 | `next@16.2.6`: Proxy/Middleware bypass (App Router + Turbopack) and 6 more vulnerable packages | Critical | Fixed (`next@16.4.3`, `npm audit`: 0) |
| S-03 | Private routes were protected only by a client-side `useEffect` | High | Fixed (`proxy.ts`) |
| S-04 | Open redirect in `/auth/callback?next=` | High | Fixed (`8a67c69`) |
| S-05 | Open redirect in `/login?redirect=` | Medium | Fixed (`8a67c69`) |
| S-06 | No bot protection on sign-up / login / password reset (disposable-email sign-ups observed) | Medium | Fixed in code (Turnstile); needs dashboard config |
| S-07 | AI endpoint: no input validation, no per-user rate limit, ownership only implied by RLS | Medium | Fixed |
| S-08 | Prompt injection through review text or customer name | Medium | Mitigated + tested |
| S-09 | `/api/complete-onboarding` (service role) copied user-controlled `user_metadata` into `profiles`, bypassing RLS; swallowed errors | Medium | Fixed |
| S-10 | Login CSRF on `/api/demo/login`; no CSRF check on cookie-authenticated POST routes | Medium | Fixed |
| S-11 | No security headers (CSP, framing, HSTS…) and `X-Powered-By` exposed | Medium | Fixed |
| S-12 | CSP still allows `'unsafe-inline'` scripts | Low (residual) | Accepted, documented |
| S-13 | `profiles` writable on every column (`onboarded`, `email`…) | Low | Fixed (`0006`, pending) |
| S-14 | Failed DB writes in the AI route reported as success | Low | Fixed |
| S-15 | Auth endpoints rely on Supabase's built-in rate limits | Low | Config documented |
| S-16 | `/api/demo/login` has no rate limit | Low | Open (mitigation listed) |
| S-17 | Leaked-password protection disabled in Supabase Auth | Low | Dashboard toggle pending |
| S-18 | Demo visitors can still add offensive *manual reviews* (allowed by design) | Low | Open: recommend a daily reset |
| S-19 | `.npmrc` `legacy-peer-deps=true` hides missing peer dependencies | Low | Open (noted) |
| S-20 | SQL injection | Info | None found |
| S-21 | XSS | Info | None found |
| S-22 | Secrets in git history / client bundle | Info | None found |
| S-23 | Cross-tenant isolation (RLS) | Info | Verified, 52/52 |
| S-24 | Service-role usage | Info | Reviewed, justified |

---

## Findings

### S-01 · Demo account could deface shared settings — High
**What:** `/api/demo/login` signs every visitor into the same account. RLS let that account update its own `businesses`, `tone_configs`, `profiles` and `team_members` rows, so a visitor could set the business name to something offensive and the next visitor, typically a recruiter, would see it until the weekly reset.
**How verified:** in production through the REST API as the demo user: `update businesses set name='Renamed by visitor'` returned the updated row (2026-10-30, before the fix).
**Fix:** migration `0006_security.sql`. New helpers `private.is_demo_user()` and `private.writable_business_ids()` (SECURITY DEFINER, fixed `search_path`, not exposed as RPC). Insert/update policies on `profiles`, `businesses`, `tone_configs` and `team_members` exclude the demo account; reviews and responses stay writable, as intended. The UI shows those settings disabled with an explanation (`<fieldset disabled>` + `DemoReadOnlyNote`).
**Tests:** `demo-lock` suite in PGlite (21 checks: the demo is blocked on 6 write paths and can still add, approve and edit reviews and responses; a normal user loses nothing). `npm run test:rls -- --demo` checks the same in production once `0006` is applied.

### S-02 · Vulnerable dependencies, including a proxy bypass in Next.js — Critical
**What:** `npm audit --omit=dev` reported 7 vulnerabilities (1 critical, 5 high). The critical one, a *Middleware/Proxy bypass in App Router applications using Turbopack*, directly undermines S-03. Others: `postcss` (XSS in stringify), `sharp`/libvips, `ws` and `source-map-js` (DoS), `nanoid`.
**Fix:** `npm audit fix` (within semver: `next` 16.2.6 → 16.4.3). The test runner added during this audit was moved to `vitest@5` (v3 had a critical in `tinypool`); `vite` was added explicitly as its peer dependency (see S-19).
**Verified:** `npm audit` reports **0 vulnerabilities** (prod and dev).

### S-03 · No server-side route protection — High
**What:** `middleware.ts` created a Supabase client but never called it, so it neither protected routes nor refreshed sessions. Private pages were guarded only by a `useEffect` in `AppShell`, after their JavaScript had shipped.
**Fix:** `proxy.ts` (Next 16 name for middleware). For `/dashboard`, `/reviews`, `/insights`, `/settings` and `/onboarding` it calls `supabase.auth.getClaims()`, which verifies the JWT signature (refreshing an expired session first; unlike `getSession()`, it doesn't trust the cookie), and redirects to `/login?redirect=<path>` without a valid session. Public pages and API routes skip it. API routes authenticate themselves.
**Verified** on a production build: 5/5 private routes → 307 `/login?redirect=…`; a **forged** `sb-…-auth-token` cookie → 307; a valid session → 200.

### S-04 / S-05 · Open redirects — High / Medium
**What:** `/auth/callback` built `${origin}${next}` from the query string, so `?next=@evil.com` became `https://ansai.app@evil.com`, which browsers resolve to `evil.com`. `/login?redirect=` passed raw input to `router.push`.
**Fix:** `lib/safe-redirect.ts` accepts only internal paths (rejects `//`, `/\`, `\\`, absolute and `javascript:` URLs, control characters, and anything that resolves to another origin).
**Tests:** `tests/unit/safe-redirect.test.ts` (15 cases).

### S-06 · No CAPTCHA on auth forms — Medium
**What:** sign-up, login and password reset call Supabase Auth directly from the browser with no bot protection. Production shows sign-ups that aren't the owner's, one with a disposable-email domain.
**Fix:** Cloudflare Turnstile (`components/auth/Turnstile.tsx`, no extra dependency) on `/signup`, `/login` and `/forgot-password`. The token is passed as `captchaToken` and **verified by Supabase Auth server-side**; tokens are single-use, so the widget regenerates after every attempt. Unused `useAuth` methods that called the same endpoints without a token were removed. The demo login, the reset script and the RLS test use admin-minted tokens and are unaffected.
**Pending:** the Supabase and Cloudflare configuration (see *Manual steps*). Until CAPTCHA is enabled in Supabase, the token is optional.

### S-07 · AI endpoint hardening — Medium
**What:** `/api/responses/generate` read `body.reviewId` unvalidated, returned 404/500 for everything, relied only on RLS for ownership, and had only the shared demo cap.
**Fix:** zod schema (`reviewId` must be a UUID) → 400; no session → 401; review not visible → 404; explicit `businesses.user_id === user.id` check → 403; quota → 429; quota check unavailable → 503 (fails closed); upstream failure / rejected output → 502. Per-user limits in the atomic `claim_ai_generation()` (migration 0005): `AI_USER_MINUTE_LIMIT` (default 5) and `AI_USER_DAILY_LIMIT` (default 100), plus the demo's shared 20/24 h.
**Verified** on a production build: malformed JSON → 400, `"1 or 1=1"` → 400, no session → 401, the demo asking for another tenant's review → 404, a valid request → 200 and one ledger row.

### S-08 · Prompt injection — Medium (mitigated)
**What:** review text and customer names are written by the public and were interpolated straight into the prompt.
**Fix:** prompt construction extracted to `lib/ai/buildPrompt.ts` (pure function):
- untrusted text goes only in the user turn, inside `<review>…</review>`, with any `<review>`/`</review>` variant inside it neutralised;
- a system-prompt section tells the model the block is data, not instructions, and never to reveal the instructions;
- the system prompt carries a canary (`SYSTEM_PROMPT_CANARY`). `leaksSystemPrompt()` rejects any reply that contains it, distinctive headings of the prompt, or the tags. A rejected, empty or `refusal` reply is stored as `generation_failed`, never published.

**Tests:** `tests/unit/build-prompt.test.ts` (13 tests: tag escape, customer-name escape, canary, defaults). `npm run eval:injection` runs 6 hostile reviews through the real models (*ignore instructions*, *print your system prompt*, *fake `</review>` + new system message*, *role-play insults*, *injection in the name*, *translate your instructions*). Result 2026-10-30: **6/6 pass**, ≈$0.015.
**Residual:** in one case (English review with an extraction attempt) the reply came back in Spanish instead of English. That's a quality issue, not a leak; it's tracked for the model upgrade.

### S-09 · Service-role route bypassed RLS with user-controlled data — Medium
**What:** `/api/complete-onboarding` runs with the service role and upserted `profiles.full_name = user.user_metadata.full_name`. Any user, including a demo visitor, can change `user_metadata` through the Auth API, so this was a way around S-01. It also logged and ignored a failed business insert while still marking the user as onboarded (audit A-07).
**Fix:** it now only sets `onboarded = true` on an existing profile (inserting one only for the legacy users created before the signup trigger existed), and returns 500 if the business can't be created.

### S-10 · CSRF / login CSRF — Medium
**What:** any website could auto-submit a form to `/api/demo/login` and sign its visitors into the demo (login CSRF). The other cookie-authenticated POST routes had no origin check either.
**Fix:** `lib/http.ts` `isCrossSiteRequest()` rejects requests whose `Origin` isn't the site's, or with `Sec-Fetch-Site: cross-site`, with 403. Applied to all three POST routes.
**Tests:** `tests/unit/http.test.ts` (5 cases, including look-alike origins and `http://` downgrade). On the production build: evil origin → 403, same origin → 303.

### S-11 / S-12 · Security headers — Medium / Low residual
**Fix** (`next.config.mjs`, all routes): `Content-Security-Policy` (`default-src 'self'`; scripts from self + Turnstile; `connect-src` limited to the Supabase project and Turnstile; `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera, microphone, geolocation, payment, usb off), `Strict-Transport-Security` (2 years, preload), `Cross-Origin-Opener-Policy: same-origin`; `X-Powered-By` removed.
**Residual (S-12):** `script-src` includes `'unsafe-inline'` because Next.js emits inline bootstrap scripts. Removing it requires a per-request nonce, which makes every page dynamically rendered. That's accepted for now. React escaping (S-21) is the primary XSS defence, and the CSP still blocks external script origins, framing, plugins and foreign form targets.

### S-13 · `profiles` column grants — Low
`0006` restricts browser roles to `update (full_name, avatar_url, interface_language, onboarding_step)` and `insert (id, email, full_name)`, so `onboarded` and `email` can only be written by the server.

### S-14 · Silent write failures in the AI route — Low
Every `responses` upsert result is now checked. A failed save returns 500 instead of a reply that disappears on reload.

### S-15 · Rate limits on authentication — Low
Login, sign-up and reset go from the browser straight to Supabase Auth, so the app can't put its own limiter in front of them. Protection comes from Supabase Auth's per-IP rate limits (Dashboard → Authentication → Rate Limits) plus the CAPTCHA (S-06). Recommended values are in *Manual steps*.

### S-16 · `/api/demo/login` rate limit — Low (open)
Each call mints a session for the demo account. Abuse means load and session churn only (no data exposure, no AI spend: generation has its own cap). Mitigation if needed: a Vercel Firewall rate-limit rule on `POST /api/demo/login` (e.g. 10/min per IP).

### S-17 · Leaked-password protection — Low
The only remaining Supabase security advisor warning. Dashboard → Authentication → Attack Protection → *Prevent use of leaked passwords*.

### S-18 · Offensive content through demo reviews — Low (open)
By design the demo can add manual reviews. These are visible to later visitors until the reset (Mondays). Recommendation: run `reset-demo.yml` daily (change the cron to `0 4 * * *`).

### S-19 · `legacy-peer-deps` — Low (open)
`.npmrc` disables peer-dependency installation and conflict errors. It already hid `vite` missing for `vitest@5`. Removing it is tracked in the repo cleanup.

### S-20 · SQL injection — none found
- No SQL is built from strings anywhere in the app: all access goes through supabase-js with `.eq()` / `.in()` and bound values. There's no `.or()`, `.filter()`, `.ilike()` or `.textSearch()` with user text (the review search filters in memory).
- SQL functions (`handle_new_user`, `set_updated_at`, `reset_demo_data`, `claim_ai_generation`, `private.*`) contain only static SQL with parameters, `search_path = ''`, and `EXECUTE` revoked from `anon`/`authenticated` where they are SECURITY DEFINER or service-only.
- The only dynamic `EXECUTE` (in `0003`) drops policies by name using `format('%I', …)` over `pg_policies`. It runs only during the migration.
- The `.rpc('claim_ai_generation', …)` call passes typed parameters (UUIDs from the session and an RLS-filtered row, integers from env).

### S-21 · XSS — none found
No `dangerouslySetInnerHTML`, `innerHTML`, `eval` or `new Function`. Review text, AI replies and user-entered fields render as React text nodes (escaped). User-supplied URLs (business website) are never rendered as `href`.

### S-22 · Secrets — none found
- `git log --all -p` over 62 commits: no `sk-ant-…`, no JWT (`eyJ…`), no `sb_secret_…`, and the only `.env*` file ever committed is `.env.local.example`.
- Production build: the values of `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `DEMO_USER_EMAIL` and `DEMO_USER_PASSWORD` don't appear in any of the 50 files under `.next/static`, nor do their variable names. Only `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` do, as intended. `lib/supabase-admin.ts` and `lib/demo.ts` import `server-only`, so a client import fails the build.

### S-23 · Cross-tenant isolation — verified
`npm run test:rls` creates two real users with a business, review, response, tone config, team member, integration and metrics row each, signs in as A with the **anon key through PostgREST**, and checks every table: A can't read, update, delete or insert into B's rows, can't move its own row into B's business, can't call the server-only functions, and can't read OAuth tokens (not even its own). Anonymous clients read nothing. B's data is verified intact, and both users are deleted afterwards. **Production, 2026-10-30: 52/52 pass.**

### S-24 · Service-role usage — reviewed

| Where | What it does with the service role | Why the caller can't aim it at someone else's data |
|---|---|---|
| `app/api/complete-onboarding/route.ts` | Creates the caller's business if missing; sets `onboarded` | User id comes from `supabase.auth.getUser()` (validated session); the request has no body; it writes no user-controlled fields (S-09) |
| `app/api/demo/login/route.ts` | Mints a magic-link token for the demo user | No parameters are accepted. The user is resolved from the business flagged `is_demo`, which browser roles can't set (0005 column grants), and never from input. It returns only a redirect; no credential or token is exposed. Same-origin only (S-10). |
| `app/api/responses/generate/route.ts` | Calls `claim_ai_generation()` | `p_user_id` comes from the validated session; `p_business_id` comes from a review row read **with the user's own client** (RLS) and cross-checked against `businesses.user_id`. The function reads `is_demo` from the database, not from the caller. |
| `scripts/reset-demo.ts` | Recreates the demo data | CLI / GitHub Action only. `reset_demo_data()` refuses any business not flagged `is_demo`. |
| `scripts/security-rls-check.ts` | Creates and deletes the two temporary test users | CLI only |

---

## Manual steps (owner)

1. **Approve and apply `0006_security.sql`**, then run `npm run test:rls -- --demo`.
2. **Cloudflare Turnstile** (dash.cloudflare.com → Turnstile → *Add widget*): hostnames `ansai.app`, `localhost` (plus your Vercel preview domain if you use previews); mode *Managed*. Copy the **site key** and **secret key**.
3. **Vercel / `.env.local`:** `NEXT_PUBLIC_TURNSTILE_SITE_KEY=<site key>`. **Deploy first**, then step 4. If CAPTCHA is enabled in Supabase before the widget is live, nobody can sign in or sign up.
4. **Supabase → Authentication → Attack Protection:** *Enable CAPTCHA protection* → provider **Turnstile** → paste the **secret key**. In the same screen, enable *Prevent use of leaked passwords* (S-17).
5. **Supabase → Authentication → Rate Limits** (S-15): e.g. sign-ups and sign-ins 30 per 5 min per IP, token verifications 30 per 5 min, emails 30 per hour (with custom SMTP).
6. Optional: Vercel Firewall rule for `POST /api/demo/login` (S-16); daily demo reset (S-18).

## How to re-run the checks

| Command | What | Cost |
|---|---|---|
| `npm test` | Unit tests (redirects, prompt, CSRF) | free |
| `npm run test:rls` / `-- --demo` | Cross-tenant RLS through the REST API on the project in `.env.local` (creates and deletes 2 users) | free |
| `npm run eval:injection` | 6 live prompt-injection attempts | ≈ $0.02 |
| `npm audit` | Dependency vulnerabilities | free |
| `npx supabase db advisors --linked --type security` | Supabase security advisors | free |
