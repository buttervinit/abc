# Deploying to Vercel (public test URL)

This app is configured to run on **Vercel** with **Vercel Postgres**. Evidence files
are stored as bytes in the database (Vercel's filesystem is ephemeral), and login uses
the seeded **dev-login** dropdown so you can test immediately without Microsoft Entra SSO.

> ⚠️ **Security note:** with `ALLOW_DEV_LOGIN=true`, anyone who has the URL can sign in as
> any seeded user — including the GRC **admin**. This is fine for a private demo/test, but
> do **not** treat it as secure. To lock it down, switch to real Entra SSO (see the bottom).

## One-time setup

1. **Push the branch** (already done): `claude/grc-cybersecurity-kpi-module-pc07n`.

2. **Import the repo into Vercel**
   - https://vercel.com/new → import `buttervinit/abc`.
   - Framework preset: **Next.js** (auto-detected). Leave build settings as-is — the
     `vercel-build` script (`prisma generate && prisma db push && prisma db seed && next build`)
     creates the schema and seeds the 5 KPIs + demo users on every deploy.
   - To deploy *this* branch, either set it as the **Production Branch**
     (Project → Settings → Git → Production Branch), or merge it to `main` first.

3. **Add a Vercel Postgres database**
   - Project → **Storage** → **Create Database** → **Postgres** → connect it to the project.
   - This automatically injects `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`,
     which the Prisma datasource already reads. No manual DB URL needed.

4. **Add environment variables** (Project → Settings → Environment Variables):

   | Name | Value | Required |
   |---|---|---|
   | `AUTH_SECRET` | output of `npx auth secret` (or `openssl rand -base64 32`) | ✅ |
   | `ADMIN_EMAILS` | `grc.admin@godrejinds.com` | ✅ |
   | `ALLOW_DEV_LOGIN` | `true` | ✅ (for dev-login testing) |
   | `ANTHROPIC_API_KEY` | your Claude API key | optional — enables the AI evidence-relevance gate; if unset, that gate is **skipped** |

5. **Deploy.** When the build finishes, open the deployment URL and go to **`/signin`**.

## Logging in
Use the dev-login dropdown:
- **Admin:** `grc.admin@godrejinds.com` → review queue (`/admin/reviews`), assignments (`/admin/assignments`)
- **Owners:** `priya.nair@godrejinds.com` / `sam.lee@godrejinds.com` → submit their assigned KPIs

## Test path
1. Sign in as **Priya** → open an assigned KPI → see goal + how-it's-measured → fill inputs, add narrative + upload a file → **Submit for review**.
2. **Rejection path** (only if `ANTHROPIC_API_KEY` is set): submit with an irrelevant narrative (e.g. "cafeteria menu") → comes back as **Needs correction** with guidance.
3. Sign in as **GRC Admin** → `/admin/reviews` → approve/reject. Approved values become the official compliance status on the dashboard.

## Switching to real Microsoft Entra SSO (optional, later)
1. Register an app in Entra ID; add redirect URI `https://<your-vercel-domain>/api/auth/callback/microsoft-entra-id`.
2. Set `AUTH_MICROSOFT_ENTRA_ID_ID`, `AUTH_MICROSOFT_ENTRA_ID_SECRET`, `AUTH_MICROSOFT_ENTRA_ID_ISSUER`.
3. Remove `ALLOW_DEV_LOGIN` (or set it to `false`) and redeploy. Admins are whoever signs in with an email in `ADMIN_EMAILS` (or has the Entra `admin` app role).

## Local development
Point both `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` at a local Postgres
(`docker compose up -d db` provides one), then:
```
npm install
npx prisma db push
npx prisma db seed
npm run dev   # http://localhost:3000/signin
```
