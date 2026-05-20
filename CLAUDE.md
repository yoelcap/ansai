# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Next.js Turbopack)
npm run build     # Production build + TypeScript check
npm run lint      # ESLint
```

There are no tests yet. TypeScript checking runs as part of `npm run build`.

## Environment

Requires `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only; used by /api/complete-onboarding to bypass RLS
ANTHROPIC_API_KEY=
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Project overview

**Ansai** (branded as Replyo internally) — a SaaS for HoReCa businesses (restaurants, bars, hotels) to manage Google reviews with AI. Supabase Auth is wired up. Stripe is planned but not yet integrated.

## Architecture

### Next.js App Router structure

```
app/
├── page.tsx                   # Landing page
├── demo/page.tsx              # Interactive demo
├── login/page.tsx             # Email/password + Google OAuth login
├── signup/page.tsx            # Registration with email confirmation flow
├── forgot-password/page.tsx   # Sends reset email
├── reset-password/page.tsx    # Sets new password after reset link
├── terms/ privacy/            # Legal pages
├── auth/callback/route.ts     # Server route: exchanges OAuth/email code, checks onboarding
├── dashboard/
│   ├── layout.tsx             # TranslationProvider + AppShell
│   └── page.tsx               # KPIs, pending reviews, chart, alerts
├── reviews/
│   ├── layout.tsx             # TranslationProvider + AppShell
│   └── page.tsx               # Full review list with filters, status badges, slide-over
├── insights/
│   ├── layout.tsx             # TranslationProvider + AppShell
│   └── page.tsx               # Period-aware analytics (rating, stars, language, topics)
├── settings/
│   ├── layout.tsx             # TranslationProvider + AppShell + horizontal tab nav
│   ├── page.tsx               # Redirects to /settings/business
│   ├── business/page.tsx
│   ├── tone/page.tsx
│   ├── integrations/page.tsx
│   ├── team/page.tsx
│   ├── billing/page.tsx
│   └── account/page.tsx
└── dev-login/page.tsx         # Redirects to /login (blocked in production by middleware)
```

Each private section has its own `layout.tsx` with `<TranslationProvider><AppShell>`. The `/settings` layout also includes a horizontal tab bar inside `SettingsInner` (see [app/settings/layout.tsx](app/settings/layout.tsx)).

### Private app component tree

```
AppShell (components/app/AppShell.tsx)
├── Sidebar                 — forest-bg nav with collapsible Settings, mobile drawer
├── AppHeader               — business name, language selector, avatar dropdown
└── main > {children}
```

- Dashboard sub-components: `components/app/dashboard/`
- Insights charts: `components/app/insights/` (`RatingEvolutionChart`, `StarsChart`, `LanguageDonut`)
- Auth page wrapper: `components/auth/AuthLayout.tsx` — used by login/signup/forgot-password/reset-password

### Auth system (Supabase Auth)

Auth is handled by Supabase. Key files:

- **`lib/supabase-client.ts`** — `createBrowserClient` from `@supabase/ssr`. Use in Client Components.
- **`lib/supabase-server.ts`** — `createServerClient` with `cookies()` from `next/headers`. Use in Server Components and Route Handlers.
- **`lib/auth/useAuth.ts`** — Client hook. Returns `{ user, profile, business, loading, login, signup, logout, resetPassword, updatePassword }`.
  - `user` — Supabase `User` object (has `.email`, `.id`, `.user_metadata`)
  - `profile` — row from `public.profiles` (has `full_name`, `onboarded`, `current_business_id`, etc.)
  - `business` — row from `public.businesses` (has `name`, `type`, `city`, etc.). Fetched by `user_id`, not by `current_business_id`. `business.id` is the foreign key to use for all business-scoped DB queries.
  - All auth methods return `Promise<{ error?: string }>` or `Promise<void>`.
  - `lib/supabase-client.ts` uses a **module-level** singleton (not a React-level ref). Calling `createClient()` anywhere in a Client Component always returns the same instance.
- **`middleware.ts`** — Runs on every request. Makes **up to 2 network round-trips per navigation**:
  1. `supabase.auth.getUser()` — always (validates token with Supabase Auth server).
  2. `supabase.from("profiles").select("onboarded")` — only when user is authenticated and on a protected non-onboarding path, or when user is on `/onboarding`. This is a Supabase DB query and is the source of intermittent ~1300ms latency spikes.
  Protects `/dashboard`, `/reviews`, `/insights`, `/settings`, `/onboarding`. Blocks `/dev-login` in production.
- **`app/auth/callback/route.ts`** — Exchanges the PKCE code for a session, then redirects to `/onboarding` or `/dashboard` based on `profile.onboarded`. Respects a `?next=` override (used by password reset to go to `/reset-password`).

**Supabase triggers (already configured, do not touch):**
- `on_auth_user_created` — automatically creates a `public.profiles` row when a user signs up. Do NOT create the profile manually after signup.
- `updated_at` triggers — do NOT manually update `updated_at` on any table.

**AppShell** derives the display name as `business?.name ?? profile?.full_name ?? user.email`. The client guard in `AppShell` (`useEffect` redirect) is a fallback to the middleware, not the primary gate.

### Onboarding flow

`app/onboarding/page.tsx` — simple single-step page shown to new users (middleware redirects here when `profile.onboarded = false`). The only action is a button that calls `POST /api/complete-onboarding`.

`app/api/complete-onboarding/route.ts` — authenticated Route Handler that:
1. Verifies session with `supabase.auth.getUser()`.
2. Creates a default `businesses` row if one doesn't exist (using the **admin client** with `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS).
3. Upserts `profiles` row with `onboarded: true`.

After success the page does `router.push("/dashboard")`, which triggers the middleware profiles query again and lets through because `onboarded` is now `true`.

### AI response generation

`app/api/responses/generate/route.ts` — Route Handler that generates a review reply using Anthropic.

**Model selection:** `claude-opus-4-7` for reviews with rating ≤ 2★ or text > 400 chars; `claude-haiku-4-5-20251001` for everything else.

**Data flow per request:**
1. Fetch review from `reviews` table.
2. Fetch business from `businesses` table (`name`, `type`).
3. Fetch tone config from `tone_configs` table (may not exist — all fields have defaults).
4. Call Anthropic with one retry on failure.
5. Post-process: strip em-dash / en-dash.
6. Upsert into `responses` table (keyed on `review_id`, `onConflict: "review_id"`).

**`tone_configs` table fields:** `formality` (`very_informal | informal | neutral | formal | very_formal`), `response_length` (`short | medium | long`), `response_language` (`auto` or locale code), `signature` (string appended to every reply), `forbidden_phrases` (string[]), `favorite_phrases` (string[]).

**`responses` table fields:** `review_id` (unique), `text`, `status` (`generated | generation_failed`), `model_used`, `tokens_input`, `tokens_output`, `approved_at`.

### PendingCount pattern

`lib/hooks/usePendingCount.ts` — exports `PendingCountContext` and `usePendingCount()`. `AppShell` provides the context with a `refreshPendingCount` callback. Child components (e.g. `ReviewSlideOver`) call `usePendingCount().refreshPendingCount()` after status changes to update the sidebar badge without prop-drilling.

### i18n system

`lib/i18n.tsx` exports a React context (`TranslationProvider`) and `useTranslation()` hook. Every page that uses translations must wrap its content in `<TranslationProvider>` — it is **NOT** in the root layout.

**5 locales:** `es` (default), `en`, `nl`, `fr`, `de` — JSON files in `locales/`.

**Usage pattern:**
```tsx
const { t, locale, setLocale } = useTranslation();
t("app.dashboard.title")  // dot-separated key path
```

Top-level namespaces: `nav`, `hero`, `demo`, `problem`, `how`, `features`, `pricing`, `faq`, `cta`, `footer`, `terms`, `privacy`, `demo_page`, `for_who`, `trust`, `app` (private app UI), `auth` (auth pages).

When adding new strings, add the key to all 5 locale files. If unsure of a translation, use the Spanish string.

### Key UI libraries

- **recharts** — all charts (line, bar, donut). See `components/app/insights/` for usage patterns.
- **lucide-react** — all icons throughout the app. Import named icons: `import { Star, Search } from "lucide-react"`.

### Mock data / type mismatches to know

`lib/mock/dashboardData.ts` exports:
- `getMockDashboardData()` — dashboard KPIs + the 5 most recent pending reviews. Types match future API shape; replace the function body, not the types.
- `getAllMockReviews()` — all 10 mock reviews across all statuses (`pending`, `responded`, `ignored`). Used by `/reviews`.
- `getMockPendingCount()` — pending review count for the sidebar badge.

**`Metric` interface** (defined in `dashboardData.ts`, re-used everywhere including insights):
```ts
{ value: number | string; change: string; trend: "positive" | "negative" | "neutral"; changeContext: string }
```
When constructing real KPI data, build `Metric` objects manually — `change` is a pre-formatted string (e.g. `"+0.2"`), not a raw number.

**Important schema divergences** between the `Review` type and the real DB:

| Field | Mock type | DB schema |
|---|---|---|
| `status` | `"pending" \| "responded" \| "ignored"` | `"pending" \| "approved" \| "rejected" \| "published"` |
| `source` | `"google"` (only) | `"google" \| "facebook" \| "tripadvisor" \| "thefork" \| "manual"` |
| `language` | `"es" \| "en" \| "nl"` | `"es" \| "en" \| "nl" \| "fr" \| "de"` |

When connecting real data, map DB values to the mock type to avoid breaking existing UI. Do NOT change the exported types in `dashboardData.ts`.

`lib/mock/insightsData.ts` exports:
- `getMockInsightsData(period: Period)` — KPIs, rating evolution, star distribution, language share, topics, and critical issues.
- `getRatingDomain(period: Period)` — y-axis domain `[min, max]` for the rating chart.
- `Period` type: `"7d" | "30d" | "90d" | "year"`.

**Insights-specific DB notes:**
- `LanguageBucket.code` — the mock uses uppercase (`"NL"`, `"FR"`); the DB `reviews.language` column stores lowercase (`"nl"`, `"fr"`). Map when constructing real buckets.
- `InsightKPIs.responseRate` and `InsightKPIs.avgResponseTime` — no direct DB columns. `responseRate` can be derived from `COUNT(responses) / COUNT(reviews)`; `avgResponseTime` requires `responses.approved_at - reviews.review_date`. Neither is available if `responses` rows are missing.
- Topics (`InsightsData.topics`) have no NLP pipeline yet — keep as mock or hide the section.

### Utilities

- `lib/utils.ts` — `cn(...inputs)`: `clsx` + `tailwind-merge` helper. Use for all conditional Tailwind class merging.
- `lib/constants.ts` — `CONTACT_EMAIL = "contact@ansai.app"`.
- `lib/hooks/useToast.ts` — `useToast()` hook. `ToastProvider` is in the root layout, so it's available everywhere. Usage: `const { toast } = useToast(); toast.success("msg"); toast.error("msg")`.

## Design system

**Palette** (defined in `tailwind.config.ts`):
- `cream` / `cream-dark` — backgrounds
- `paper` — card / elevated surfaces
- `forest` / `forest-dark` / `forest-light` — primary accent (CTAs, sidebar)
- `terra` / `terra-light` — warm accent, alerts, negative trends
- `gold` — star ratings, premium features
- `ink` / `ink-soft` — body text
- `muted` — secondary text
- `line` — borders, dividers

**Fonts:** `font-serif` (Fraunces) for headings/display, `font-sans` (Inter) for body. Both loaded via `next/font/google` in `app/layout.tsx`.

**Utility classes** (defined in `globals.css`):
- `.container-x` — max-width 1280px centered with responsive padding
- `.btn-primary` — forest pill button
- `.btn-ghost` — transparent text button
- `.section-eyebrow` — small uppercase terra label above section titles
- `.display-serif` — Fraunces with tracking and stylistic set

**Animations** (defined in `tailwind.config.ts`): `animate-slide-up`, `animate-pulse-slow`, `animate-spin-slow`.

**Style rule:** No blue SaaS aesthetics. Use the palette above. Terracota (`terra`) for alerts/negative, forest for positive/primary.

**Chart containers:** Recharts `ResponsiveContainer` requires its parent to have an explicit pixel height (e.g. `h-48` / `h-64` Tailwind class or `style={{ height: 200 }}`). A parent with only `height: 100%` or no height causes the `width(-1) height(-1)` console warning and broken renders.
