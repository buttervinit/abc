# GRC Platform — Cybersecurity / ISMS KPI Module

A Governance, Risk & Compliance (GRC) KPI module for Cybersecurity / ISO 27001
ISMS programs. KPI owners see how each KPI is measured and its target, submit the
underlying data plus supporting evidence, and the platform automatically calculates
compliance. Submissions pass through **two gates** before they count:

1. **AI relevance gate** (Claude API) — rejects evidence/details that aren't relevant
   to how the KPI is calculated, returning **actionable guidance** so the owner can
   correct and resubmit.
2. **GRC admin review gate** — a human admin approves or rejects (with comments).
   Only approved submissions become the official compliance value.

Access is via **SSO (Microsoft Entra ID)**. A **GRC admin assigns each KPI to one or
more owners**, and owners only see/submit the KPIs assigned to them.

## The 5 KPIs

| Code | KPI | Target |
|---|---|---|
| `VULN_REMEDIATION_SLA` | Critical/High vulnerability remediation within SLA | ≥ 95% |
| `TRAINING_COMPLETION` | Security awareness training completion | ≥ 98% |
| `PHISHING_FAILURE` | Phishing simulation failure rate | ≤ 5% (lower better) |
| `MTTR_INCIDENTS` | Mean time to respond to incidents | ≤ 4 hours (lower better) |
| `ACCESS_REVIEW` | Privileged/user access review completion | = 100% |

Each KPI's formula, required inputs, target and direction live in a typed
calculator registry (`src/lib/kpi/`), the single source of truth that both the UI
and the seed derive from.

## Tech stack

Next.js 15 (App Router, TypeScript) · Prisma ORM · PostgreSQL (SQLite fallback) ·
Auth.js v5 (Microsoft Entra ID) · Tailwind CSS · `@anthropic-ai/sdk`.

## Setup

```bash
npm install
cp .env.example .env        # fill in the values (see below)
```

### Database — Option A: PostgreSQL (recommended)

```bash
docker compose up -d db     # Postgres on localhost:5432
# .env -> DATABASE_URL="postgresql://grc:grc@localhost:5432/grc?schema=public"
npx prisma migrate dev --name init
npx prisma db seed
```

### Database — Option B: SQLite (zero infra)

Change `provider` to `"sqlite"` in `prisma/schema.prisma`, then:

```bash
# .env -> DATABASE_URL="file:./dev.db"
npx prisma db push
npx prisma db seed
```

### Run

```bash
npm run dev    # http://localhost:3000
```

## Environment variables

See `.env.example`. Key ones:

- `ANTHROPIC_API_KEY` — enables the AI relevance gate. **Leave blank** to run
  offline; validation is then marked `SKIPPED` and submissions still flow to admin
  review.
- `AUTH_SECRET` — `npx auth secret` or `openssl rand -base64 32`.
- `AUTH_MICROSOFT_ENTRA_ID_ID` / `_SECRET` / `_ISSUER` — Entra app registration.
  Register redirect URI `http://localhost:3000/api/auth/callback/microsoft-entra-id`.
- `ADMIN_EMAILS` — comma-separated emails granted the ADMIN role on sign-in.
- `ALLOW_DEV_LOGIN=true` — enables seeded-user demo login so the MVP runs before
  live Entra is configured. **Disable in production.**

## Demo users (seeded)

| Email | Role |
|---|---|
| grc.admin@godrejinds.com | ADMIN |
| priya.nair@godrejinds.com | OWNER (Vuln Remediation, MTTR) |
| sam.lee@godrejinds.com | OWNER (Training, Phishing, Access Review) |

## How it works

- **Owner** signs in → dashboard shows assigned KPIs → opens a KPI to see its goal &
  formula → submits inputs + narrative + evidence files.
- `submitKpi` (server action) verifies assignment, validates inputs (zod), runs the
  **AI relevance gate**, and on success computes the value, evaluates compliance
  (honoring higher/lower-is-better), and routes the submission to admin review.
  On AI failure it stores the submission as `NEEDS_CORRECTION` with guidance and
  pre-fills the form for resubmission.
- **Admin** reviews the queue at `/admin/reviews` (approve/reject + comment) and
  manages KPI ownership at `/admin/assignments`.
