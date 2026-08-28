# Wrknode

Next.js (App Router) app serving both the public wrknode.com marketing page
(`/`, lead capture posts to an existing n8n webhook — untouched) and a client
portal: email/password login (Auth.js / NextAuth v4, Credentials provider +
Prisma adapter), a dashboard where a logged-in client sees their own
`ClientRequest` rows, and Stripe Checkout to pay a quoted price.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — a Postgres connection string
   - `NEXTAUTH_SECRET` — random secret, e.g. `openssl rand -base64 32`
   - `NEXTAUTH_URL` — `http://localhost:3000` for local dev

3. Create the database tables:

   ```bash
   npx prisma migrate dev --name init
   ```

4. Run the app:

   ```bash
   npm run dev
   ```

5. Visit `http://localhost:3000`, sign up at `/signup`, and you'll land on
   `/dashboard`.

## Notes

- `password` was added to the `User` model (not part of the standard Auth.js
  adapter shape) to support email/password login. All other Auth.js tables
  (`Account`, `Session`, `VerificationToken`) are untouched, so OAuth
  providers can be added later without a schema change.
- Sessions use the `jwt` strategy — Auth.js requires this when a Credentials
  provider is present.
- `/dashboard` is protected by `src/middleware.ts`; unauthenticated visitors
  are redirected to `/login`.
- New signups always get `role: CLIENT`. To create an admin, update a user's
  `role` directly in the database (e.g. via `npx prisma studio`).
- There's no admin UI yet — quote a request by setting its `status` to
  `QUOTED` and `quotedPrice` (smallest currency unit, e.g. paise/cents)
  directly in the database. The client's dashboard then shows a "Pay now"
  button using Stripe Checkout; a successful payment (via the
  `/api/stripe/webhook` route) sets `paidAt` and moves the request to
  `IN_PROGRESS`.
- The `/` route is the existing wrknode.com marketing page, ported as-is
  (same CSS/animation/copy) into `src/components/landing/`. Its "Get Early
  Access" form still posts straight to the n8n webhook
  (`https://capricornxd.app.n8n.cloud/webhook/wrknode-lead`) — it doesn't
  touch this app's database. Don't edit that URL without updating the n8n
  workflow ("Wrknode Lead Automation") to match.
- `POST /api/requests` (the dashboard's "New request" form) also calls that
  same n8n webhook after saving to the database, with `source:
  "dashboard_quote_request"` so the workflow knows not to treat the sender as
  a brand-new lead. See `notifyLeadAutomation` in
  `src/app/api/requests/route.ts`. A failure to reach n8n never blocks the
  request from being saved — it's logged and swallowed.
- The n8n workflow ("Wrknode Lead Automation") now runs an AI Agent (Google
  Gemini, free tier — credential "Google Gemini(PaLM) Api account") that
  reads the submitted message and writes a tailored reply plus a lead score
  (HOT/WARM/COLD) and a one-line summary for the owner notification email.
  It branches on `source`: `dashboard_quote_request` skips the marketing
  lead Data Table (already stored in this app's own Postgres DB via
  Prisma); anything else (landing page) still gets stored there. GoRouter
  was tried first as the AI provider but its API is blocked by its own
  Cloudflare bot-protection — don't reintroduce it without confirming
  that's fixed.
- `/pricing` is a public page listing active `Plan` rows (Postgres, editable
  without a deploy). Manage plans at `/admin/plans` (ADMIN role required —
  same role field used elsewhere, still set manually via `npx prisma
  studio` until there's a way to promote a user in the UI). Each plan's
  button does one of three things (`ctaType`): `CHECKOUT` starts an instant
  Stripe Checkout (reuses the exact same request/quote/pay model as the
  dashboard — a plan purchase just creates a pre-quoted `ClientRequest`,
  see `src/app/api/plans/[id]/purchase/route.ts`), `SIGNUP` sends the
  visitor to `/signup`, `CONTACT` sends them to the landing page's lead
  form (`/#access`). No new payment integration was added — Stripe
  Checkout itself can offer UPI/netbanking/wallets alongside cards; enable
  those in the Stripe Dashboard under Settings → Payment methods rather
  than integrating any of them separately.
- New schema change (`Plan` model) needs a fresh migration — see step 3
  under Setup; run `npx prisma migrate dev --name add_plans` after pulling
  this. No plans exist until you add some at `/admin/plans/new`.

## Deploying

The Netlify site currently serving wrknode.com was set up via drag-and-drop
(Netlify Drop), not connected to git. To go live with this app instead:

1. In the Netlify dashboard for the wrknode.com site, go to **Project
   configuration → Build & deploy → Continuous deployment** and link it to
   the `SAM-29122000/wrknode-app` GitHub repo (the repo root has a
   `netlify.toml` that sets the base directory to `wrknode/` — Netlify's
   Next.js Runtime handles the rest automatically).
2. Add environment variables in **Project configuration → Environment
   variables**: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (set to
   `https://wrknode.com`), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
3. In Stripe, add a webhook endpoint pointing to
   `https://wrknode.com/api/stripe/webhook` listening for
   `checkout.session.completed`, and use its signing secret for
   `STRIPE_WEBHOOK_SECRET`.
4. Trigger a deploy. The custom domain is already attached to this Netlify
   site, so no DNS changes are needed.
