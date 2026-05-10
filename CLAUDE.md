# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Next.js Turbopack)
npm run build     # Production build + TypeScript check
npm run lint      # ESLint
```

There are no tests yet. TypeScript checking runs as part of `npm run build`.

## Project overview

**Ansai** (branded as Replyo internally) — a SaaS for HoReCa businesses (restaurants, bars, hotels) to manage Google reviews with AI. Currently the public landing page and a private dashboard are built. Supabase integration and Stripe are planned but not yet wired up.

## Architecture

### Next.js App Router structure

```
app/
├── page.tsx               # Landing page
├── demo/page.tsx          # Interactive demo
├── login/page.tsx         # Login UI (placeholder — not wired to Supabase yet)
├── signup/page.tsx        # Signup UI (placeholder — not wired to Supabase yet)
├── forgot-password/       # Placeholder
├── terms/ privacy/        # Legal pages
├── auth/callback/         # Supabase OAuth callback route (scaffolded)
├── dashboard/
│   ├── layout.tsx         # Private app layout (TranslationProvider + AppShell)
│   └── page.tsx           # Dashboard with KPIs, pending reviews, chart, alerts
└── dev-login/page.tsx     # Fake auth login (dev only)
```

**Future refactor:** When adding `/reviews`, `/insights`, `/settings`, create `app/(app)/` route group and move `app/dashboard/` inside it. The layout at `app/dashboard/layout.tsx` becomes `app/(app)/layout.tsx`.

### Private app component tree

```
AppShell (components/app/AppShell.tsx)
├── Sidebar                 — forest-bg nav with collapsible Settings, mobile drawer
├── AppHeader               — business name, language selector, avatar dropdown
└── main > {children}
```

Dashboard sub-components live in `components/app/dashboard/`.

### Auth system (temporary — fake auth)

All auth is currently faked via localStorage + a cookie (`replyo_fake_user`). Search `// TODO: reemplazar por Supabase Auth` to find every replacement point.

- **Hook:** `lib/auth/useAuth.ts` — `login(user)` writes to localStorage + sets cookie; `logout()` clears both.
- **Middleware:** `middleware.ts` reads the cookie to protect `/dashboard`, `/reviews`, `/insights`, `/settings`, `/onboarding`. Redirects unauthenticated users to `/dev-login`.
- **Client guard:** `AppShell` also does a `useEffect` redirect as a second layer.
- **Dev login:** `app/dev-login/page.tsx` sets a hardcoded demo user and redirects to `/dashboard`.

Supabase clients are scaffolded at `lib/supabase-client.ts` (browser) and `lib/supabase-server.ts` (server/RSC). They require `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars — these are intentionally absent until auth is wired up.

### i18n system

`lib/i18n.tsx` exports a React context (`TranslationProvider`) and `useTranslation()` hook. Every page that uses translations must wrap its content in `<TranslationProvider>` (see `app/page.tsx` and `app/dashboard/layout.tsx` as examples — it is NOT in the root layout).

**5 locales:** `es` (default), `en`, `nl`, `fr`, `de` — JSON files in `locales/`.

**Usage pattern:**
```tsx
const { t, locale, setLocale } = useTranslation();
t("app.dashboard.title")  // dot-separated key path
```

Key namespaces in the locale files: `nav`, `hero`, `demo`, `problem`, `how`, `features`, `pricing`, `faq`, `cta`, `footer`, `terms`, `privacy`, `demo_page`, `for_who`, `trust`, `app` (private app UI).

When adding new strings, add the key to all 5 locale files. If unsure of a translation, use the Spanish string and leave a `// TODO: traducir` comment.

### Mock data

`lib/mock/dashboardData.ts` exports `getMockDashboardData()`. Types are designed to match a future real API shape — replace the function body when wiring up the backend, not the types.

### Utilities

`lib/utils.ts` exports `cn(...inputs)` — a `clsx` + `tailwind-merge` helper for conditional class merging. Use it whenever combining Tailwind classes conditionally.

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
