# Setup

How to run Ansai from scratch, either fully local (Supabase in Docker) or against a hosted Supabase project.

**Requirements:** Node.js 20+, npm. For the local stack you also need Docker Desktop, running.

```bash
git clone <repo> ansai && cd ansai
npm install
cp .env.local.example .env.local
```

---

## Option A: fully local (recommended for development)

```bash
npm run db:start      # starts Postgres, Auth, Studio… in Docker (first run downloads images)
npm run db:reset      # applies supabase/migrations/* and supabase/seed.sql
```

`db:start` prints the local `API URL`, `anon key` and `service_role key`. Copy them into `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). Add your `ANTHROPIC_API_KEY`, then:

```bash
npm run dev           # http://localhost:3000
```

The seed creates the demo account (`demo@ansai.local` / `ansai-demo-local`) with the business **Taberna El Faro**: 40 reviews in 5 languages over the last 12 months. Local auth settings (redirect URLs, 8-character minimum password, no email confirmation) live in `supabase/config.toml`. Emails sent by local Auth show up in Inbucket at <http://127.0.0.1:54324>.

## Option B: hosted Supabase project

### 1. Create the project and apply the schema

1. Create a project at <https://supabase.com/dashboard> (region close to your users, e.g. `eu-west-1`). Save the database password in your password manager.
2. Link the CLI and push the migrations:
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>     # may ask for the DB password
   npm run db:push                                   # applies 0001 → latest
   ```
3. Copy **Project Settings → API**: the URL, the `anon` key and the `service_role` key go into `.env.local`.
4. Set `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD` (use a long random password), then create the demo account:
   ```bash
   npm run db:seed
   ```
   This is the only seeding that ever runs against a hosted project. It creates or updates the demo user and resets **only** the business flagged `is_demo`. Other users' data is never touched.

> **Existing project (`avumcgrgngotinmibwxw`).** Its schema predates the migrations folder, so `0001_initial_schema.sql` is already applied there. Before the first push, record it as applied so the CLI doesn't try to recreate the tables:
> ```bash
> npx supabase migration repair --status applied 0001
> npm run db:push            # applies 0002+ only
> ```

### 2. Configure Auth (Dashboard → Authentication)

| Setting | Value |
|---|---|
| **URL Configuration → Site URL** | `https://ansai.app` (or `http://localhost:3000` for a dev-only project) |
| **URL Configuration → Redirect URLs** | `http://localhost:3000/**` and `https://ansai.app/**`. Add `https://*-<vercel-team>.vercel.app/**` if you use Vercel preview deployments. |
| **Sign In / Providers → Email** | Enabled · *Confirm email* ON · minimum password length **8** (matches the app's validation) |
| **Attack Protection → Leaked password protection** | ON |
| **Sign In / Providers → Google** | See below |

**Google OAuth**
1. Google Cloud Console → *APIs & Services → Credentials → Create credentials → OAuth client ID* → type **Web application**.
2. *Authorized JavaScript origins*: `https://ansai.app`, `http://localhost:3000`.
3. *Authorized redirect URIs*: `https://<project-ref>.supabase.co/auth/v1/callback` (shown in Supabase on the Google provider page).
4. Paste the Client ID and Client secret into Supabase → Providers → Google → Enable.

### 3. Run

```bash
npm run dev
```

---

## Scheduled jobs (GitHub Actions)

| Workflow | Schedule | What it does |
|---|---|---|
| `.github/workflows/keepalive.yml` | every 3 days, 06:17 UTC | Runs one tiny read query (anon key) so the free-tier project is never paused for inactivity again. |
| `.github/workflows/reset-demo.yml` | Mondays 04:00 UTC | Runs `npm run db:seed`: restores the demo data and the demo credentials. |

Both can also be started by hand: **Actions → workflow → Run workflow**.

Create these in **GitHub → Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value | Used by |
|---|---|---|
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` | both |
| `SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` key | keepalive |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` key | reset-demo |
| `DEMO_USER_EMAIL` | same value as in `.env.local` | reset-demo |
| `DEMO_USER_PASSWORD` | same value as in `.env.local` | reset-demo |

> GitHub **disables scheduled workflows after 60 days without commits** to the repository (it emails the owner first). If that happens, re-enable them in the Actions tab; the keepalive is otherwise useless during that window.

---

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build + type check |
| `npm run db:start` | Start the local Supabase stack (Docker) |
| `npm run db:reset` | Recreate the **local** database from migrations + `supabase/seed.sql` |
| `npm run db:push` | Apply pending migrations to the **linked** hosted project |
| `npm run db:seed` | Create/reset the demo account on whichever project `.env.local` points to |

## Database layout

```
supabase/
├── config.toml                  # local stack config (auth URLs, password policy…)
├── migrations/
│   ├── 0001_initial_schema.sql  # baseline exported from production (incl. its known defects)
│   ├── 0002_fixes.sql           # CHECK fix, function hardening, token column grants, indexes
│   ├── 0003_rls.sql             # all RLS policies rewritten
│   ├── 0004_demo.sql            # businesses.is_demo + reset_demo_data()
│   └── 0005_demo_guards.sql     # demo business protections + AI quota ledger
└── seed.sql                     # local only: demo user + business
```

Never edit an applied migration. Add a new numbered file instead.
