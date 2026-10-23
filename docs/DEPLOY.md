# Deploying to Vercel (ansai.app)

One-time setup. Follow the steps in order. Steps 3–5 can be done while the first build runs.

## 0. Before the first deploy

- All migrations are applied to the production project: `npx supabase migration list --linked` shows the same versions in the *local* and *remote* columns. (The AI endpoint fails closed with HTTP 503 if `0005_demo_guards.sql` is missing.)
- The demo account exists: `npm run db:seed` has run against production.
- `main` is pushed to GitHub (`git push origin main`).

## 1. Create the Vercel project

1. <https://vercel.com/new> → **Import Git Repository** → `yoelcap/replyo`.
2. Framework preset: **Next.js** (auto-detected). Leave the build command, output directory and install command at their defaults. `.npmrc` is picked up automatically.
3. **Before clicking Deploy**, open *Environment Variables* and add the variables from step 2. `NEXT_PUBLIC_*` values are inlined at build time, so a build without them produces a broken client.

## 2. Environment variables

Project → Settings → Environment Variables. Mark the server-only ones as **Sensitive**.

| Name | Value | Environments | Sensitive |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://ansai.app` | Production | no |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://avumcgrgngotinmibwxw.supabase.co` | Production, Preview | no |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` | Production, Preview | no |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` | Production, Preview | **yes** |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API keys (create a dedicated key for this project) | Production, Preview | **yes** |
| `DEMO_USER_EMAIL` | same as `.env.local` | Production, Preview | **yes** |
| `DEMO_USER_PASSWORD` | same as `.env.local` | Production, Preview | **yes** |
| `AI_DEMO_DAILY_LIMIT` | `20` | Production, Preview | no |

Preview deployments share the production database and AI key. The demo works on them, and the shared daily AI cap still applies. Set a monthly spend limit on the Anthropic key (Console → Limits) as a last line of defence.

Then click **Deploy**.

## 3. Domain

1. Project → Settings → **Domains** → add `ansai.app`, then add `www.ansai.app` and choose *Redirect to ansai.app* (308).
2. At your registrar, create **exactly the DNS records Vercel shows** for each domain. Typically that's an `A` record for `@` and a `CNAME` for `www`; the values are listed on the Domains page.
3. Wait until both show *Valid configuration*. The HTTPS certificate is issued automatically.

## 4. Supabase Auth URLs

Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL:** `https://ansai.app`. Confirmation and password-reset emails link here.
- **Redirect URLs** (add all of them):
  - `https://ansai.app/**`
  - `http://localhost:3000/**`
  - `https://*-<your-vercel-team-slug>.vercel.app/**` (preview deployments; the slug is in any preview URL)

**Email sending:** Supabase's built-in SMTP only delivers to members of the Supabase organisation and is heavily rate limited. Real users would never receive their confirmation email. Configure a custom SMTP provider under **Authentication → Emails → SMTP Settings** (e.g. Resend, Postmark, Brevo), with sender `no-reply@ansai.app` and the provider's SPF/DKIM records added to the `ansai.app` DNS.

## 5. Google OAuth

Google Cloud Console → **APIs & Services**:

1. **Credentials → your OAuth 2.0 Client (Web application)**
   - *Authorized JavaScript origins:* `https://ansai.app`, `http://localhost:3000`
   - *Authorized redirect URIs:* `https://avumcgrgngotinmibwxw.supabase.co/auth/v1/callback`. This is the only one needed: Google redirects to Supabase, and Supabase redirects to the app using the Redirect URLs above.
2. **OAuth consent screen (Branding)**
   - App name *Ansai*, support email, logo (optional).
   - *Application home page:* `https://ansai.app`; *Privacy policy:* `https://ansai.app/privacy`; *Terms of service:* `https://ansai.app/terms`.
   - *Authorized domains:* `ansai.app` and `supabase.co`.
3. **Audience → Publish app** (move it from *Testing* to *In production*). While in *Testing*, only the listed test users can sign in with Google. Basic scopes (email, profile, openid) don't need Google's review.

## 6. Smoke test after the first deploy

| Check | Expected |
|---|---|
| `https://ansai.app` | Landing page loads over HTTPS; `www.ansai.app` redirects to it |
| *Probar demo* on the landing page | Dashboard of *Taberna El Faro* with the demo banner, in under 3 clicks |
| Reviews → *Añadir reseña* (manual review) | The review appears and an AI reply is generated for it (counts towards the demo's daily cap) |
| Sign up with a real email | Confirmation email arrives (needs custom SMTP) and its link lands on `/onboarding` |
| *Continuar con Google* | Returns to `/onboarding` or `/dashboard` |
