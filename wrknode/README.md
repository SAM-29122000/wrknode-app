# Wrknode

Next.js (App Router) app serving both the public wrknode.com marketing page
(`/`, lead capture posts to this app's own `/api/leads`, which stores the
lead in Postgres and notifies the n8n AI workflow) and a client portal:
email/password login (Auth.js / NextAuth v4, Credentials provider +
Prisma adapter), a dashboard where a logged-in client sees their own
`ClientRequest` rows, and Razorpay Checkout to pay a quoted price. (Stripe
was tried first, but Stripe requires an invite to sign up for accounts based
in India, so this switched to Razorpay, which doesn't.)

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
- There's no admin UI for requests yet (there is one for `Plan`s, see
  below) — quote a request by setting its `status` to `QUOTED` and
  `quotedPrice` (smallest currency unit, e.g. paise/cents) directly in the
  database. The client's dashboard then shows a "Pay now" button, which
  creates a Razorpay order (`src/lib/razorpay.ts`) and opens Razorpay's
  Checkout modal client-side (`src/lib/razorpayCheckout.ts` — Razorpay's
  flow is a JS widget, not a hosted redirect page like Stripe's). The
  **webhook** (`/api/razorpay/webhook`, listening for `payment.captured`)
  is what actually sets `paidAt` and moves the request to `IN_PROGRESS` —
  never the browser callback, which only drives the redirect. Razorpay's
  `key_id` is safe to expose client-side (unlike Stripe's secret key);
  `key_secret` and the webhook secret stay server-only.
- **International (USD) payments on Razorpay require separate approval**
  from Razorpay before they'll actually work — this wasn't verified while
  building this, only that the API call shape is correct. Confirm
  international payments are enabled on the Razorpay account before relying
  on `INTERNATIONAL`-region checkout in production.
- The `/` route is the existing wrknode.com marketing page, ported as-is
  (same CSS/animation/copy) into `src/components/landing/`. Its "Get Early
  Access" form posts to this app's own `POST /api/leads`
  (`src/app/api/leads/route.ts`) — not directly to n8n anymore (Phase-2:
  see below). That route validates input, skips creating a duplicate if the
  same email submitted again within 10 minutes, caps a single email to 5
  submissions/day (a basic abuse guard — not real IP-based rate limiting,
  which would need external state this app doesn't have), writes a `Lead`
  row, then calls `notifyLeadAutomation` (`src/lib/notifyLeadAutomation.ts`,
  shared with `/api/requests`) to trigger the n8n AI workflow. A failure to
  reach n8n never blocks the lead from being saved — it's logged and
  swallowed.
- **`Lead` (Postgres) is now the single source of truth for marketing
  leads** — n8n's own internal Data Table ("Store Lead" node in the
  "Wrknode Lead Automation" workflow) is disabled, not deleted, since it
  became redundant with this. n8n passes a disabled node's input through
  unchanged, so nothing else in that workflow needed to change. View leads
  at `/admin/leads` (ADMIN role required, same as `/admin/plans`).
- `POST /api/requests` (the dashboard's "New request" form) also calls the
  n8n webhook after saving to the database, with `source:
  "dashboard_quote_request"` so the workflow knows not to treat the sender
  as a brand-new lead (it does **not** write a `Lead` row — that's for
  anonymous landing-page submissions specifically; a dashboard request is
  already a `ClientRequest` tied to a real account).
- The n8n workflow ("Wrknode Lead Automation") runs an AI Agent (Google
  Gemini, free tier — credential "Google Gemini(PaLM) Api account") that
  reads the submitted message and writes a tailored reply plus a lead score
  (HOT/WARM/COLD) and a one-line summary for the owner notification email.
  That score/summary currently only reaches you via that notification
  email — it isn't written back to `Lead` in Postgres yet, so `/admin/leads`
  shows raw submissions only, no AI scoring. Reporting it back would need a
  new step in the n8n workflow (an HTTP call to a new endpoint in this app)
  — a natural next Phase-2 increment, not done yet. GoRouter was tried
  first as the AI provider but its API is blocked by its own Cloudflare
  bot-protection — don't reintroduce it without confirming that's fixed.
- `/pricing` is a public page listing active `Plan` rows (Postgres, editable
  without a deploy). Manage plans at `/admin/plans` (ADMIN role required —
  same role field used elsewhere, still set manually via `npx prisma
  studio` until there's a way to promote a user in the UI). Each plan's
  button does one of three things (`ctaType`): `CHECKOUT` starts an instant
  Razorpay Checkout (reuses the exact same request/quote/pay model as the
  dashboard — a plan purchase just creates a pre-quoted `ClientRequest`,
  see `src/app/api/plans/[id]/purchase/route.ts`), `SIGNUP` sends the
  visitor to `/signup`, `CONTACT` sends them to the landing page's lead
  form (`/#access`). Razorpay Checkout can offer UPI/netbanking/wallets
  alongside cards without any extra integration work — enable whichever you
  want in the Razorpay Dashboard.
- New schema change (`Plan` model): for **local dev**, run `npx prisma
  migrate dev` after pulling this to apply it to your local database. For
  **production**, it applies itself automatically — see the migration note
  under Deploying below. No plans exist until you add some at
  `/admin/plans/new`.

## Job application agent

A personal automation for the account owner's own job search — separate
from the wrknode business (marketing site, client portal, payments) above,
but built on the same Next.js app, Postgres database, and Netlify
deployment rather than a standalone n8n workflow. It replaces an earlier
n8n + Google Sheets design (kept for reference in
`Desktop/Private/*.json`, no longer used) with the same behavior in plain
Next.js API routes.

**Design constraints, and why:**
- It never logs into or automates LinkedIn/Naukri/Indeed/Glassdoor —
  all of those prohibit bot-submitted applications and detect/ban for it.
  Jobs are sourced from Adzuna and Jooble's public search **APIs** instead
  (`src/lib/jobAgent/jobSources.ts`).
- The AI matching/drafting prompts (`src/lib/jobAgent/ai.ts`) are
  explicitly instructed to never invent or exaggerate experience — only to
  re-emphasize real, existing skills differently per job. The candidate
  summary they're given (`src/lib/jobAgent/resumeProfile.ts`) is the
  Purchase Executive / Bauhaus / SAP international sourcing role, as
  confirmed by the candidate on 2026-09-21 — **keep this file and the
  resume PDFs in `Desktop/Private/resume-variants/` in sync; they must
  never contradict each other in front of an employer.**
- Nothing is ever emailed without a human reply. `POST
  /api/job-agent/discover` (run on a schedule — see below) scores each new
  listing, and for anything scoring ≥ 70 drafts an email, saves a
  `JobLead` row, and messages WhatsApp asking `APPLY-<id>` or `SKIP-<id>`.
  Only that WhatsApp reply (`POST /api/job-agent/whatsapp-inbound`, the
  Twilio webhook target) triggers a send. **This threshold is intentionally
  not bypassable** — re-emphasizing real skills per job is the point;
  applying to roles that genuinely don't fit by disguising the resume is
  not something this system will do, regardless of volume goals.
- Adzuna/Jooble listings don't include a direct applicant email address
  (only a URL to the original posting) — so `APPLY` only auto-sends via
  Gmail when `JobLead.applyEmail` happens to be set (nothing currently
  sets it). Otherwise it replies on WhatsApp with the apply link and the
  drafted email text to paste in yourself. This is a real limitation of
  the free job-board APIs, not a bug — don't "fix" it by inventing a
  placeholder email address to send to.
- Adzuna and Jooble's search fields are **AND/phrase matches, not boolean
  OR** — `"purchase engineer OR procurement"` actually narrows results
  (it looks for postings containing all those words) rather than
  broadening them. `JOB_AGENT_SEARCH_TERMS` is therefore a **comma-separated
  list of phrases**, each queried separately per country and merged/deduped
  in code (`jobSources.ts`) — never join them with " OR " in one string.
- `POST /api/job-agent/check-replies` polls the inbox (Gmail API,
  `newer_than:1d -from:me`) every run. Since that query keeps returning the
  same messages, every message's Gmail id is checked against `JobReplyLog`
  (unique) before being classified/notified — without this it would
  re-notify WhatsApp for the same reply on every single poll, all day.
- `POST /api/job-agent/discover` only actually searches/drafts between
  `JOB_AGENT_WINDOW_START_HOUR` and `JOB_AGENT_WINDOW_END_HOUR` (IST,
  default 8am-12pm) — a cron ping outside that window is a no-op. This
  doesn't apply to `check-replies` or `daily-summary`, which should run
  all day. An admin manually clicking "Run discovery now" in
  `/admin/job-agent` bypasses the window, for testing.
- `POST /api/job-agent/daily-summary` reports, via one WhatsApp message:
  how many listings were found (by platform), how many were applied to
  (with timestamps and company names), how many are still pending your
  reply, how many were skipped, and how many genuine replies came in
  today. Meant to be pinged once, e.g. at 12:05pm after the discovery
  window closes.

**Setup:**
1. Get free API keys: Adzuna (developer.adzuna.com) and Jooble
   (jooble.org/api/about).
2. Create a Twilio account, activate the WhatsApp Sandbox (Messaging → Try
   it out → Send a WhatsApp message), and from the phone in
   `JOB_AGENT_WHATSAPP_TO` send the shown join code to the sandbox number.
   Note the sandbox needs re-joining every 72 hours; a real WhatsApp
   Business number (a few days' approval through Twilio) removes that.
3. Create a free Gemini API key at aistudio.google.com/apikey (no billing
   needed — this is why Gemini was used instead of OpenAI, which requires
   prepaid credits even for light usage). `GEMINI_MODEL` defaults to an
   alias (`gemini-flash-lite-latest`) rather than a pinned version, since
   Google deprecated two specific dated model names while this was being
   built ("no longer available to new users") — aliases don't break that
   way.
4. Create a Google Cloud OAuth client (Desktop app type is simplest, no
   consent-screen review needed for personal use), then mint a refresh
   token once via
   [developers.google.com/oauthplayground](https://developers.google.com/oauthplayground)
   using your own client ID/secret with the `gmail.send` and
   `gmail.readonly` scopes.
5. Fill in every var in the "Job application agent" section of
   `.env.example`, including `JOB_AGENT_CRON_SECRET` (any random string
   you make up).
6. In Twilio's WhatsApp Sandbox settings, set "WHEN A MESSAGE COMES IN" to
   `https://wrknode.com/api/job-agent/whatsapp-inbound`.
7. Since Netlify doesn't run arbitrary code on a timer by itself, use a
   free external scheduler (e.g. cron-job.org) to `POST` to, each with
   header `x-cron-secret: <your JOB_AGENT_CRON_SECRET>`:
   - `https://wrknode.com/api/job-agent/discover` every 15-30 minutes,
     all day (it no-ops itself outside the 8am-12pm window)
   - `https://wrknode.com/api/job-agent/check-replies` every 10-15
     minutes, all day
   - `https://wrknode.com/api/job-agent/daily-summary` once, around
     12:05pm
8. Test `/api/job-agent/discover` manually first (e.g. from a REST client,
   with that header, or the "Run discovery now" button on
   `/admin/job-agent`) and confirm a WhatsApp message arrives before
   relying on the scheduler.

**Realistic volume:** Adzuna/Jooble typically surface 10-40 genuinely new,
relevant postings a day for one role/location combination — the system
won't fabricate matches to hit a higher number. Broaden
`JOB_AGENT_SEARCH_TERMS` (and `ADZUNA_COUNTRY`/`JOOBLE_LOCATION`) for more
volume; that's the honest lever, not lowering the match threshold or the
honesty constraints in the AI prompts.

**Not built yet:** a resume-variant picker (multiple tailored resume PDFs,
auto-selected per job), and a dashboard beyond WhatsApp + raw `JobLead`
rows (`npx prisma studio`) for reviewing history.

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
   `https://wrknode.com`), `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
   `RAZORPAY_WEBHOOK_SECRET`, and — only if you want the job application
   agent running — every var in that section's part of `.env.example`.
3. In Razorpay, add a webhook endpoint pointing to
   `https://wrknode.com/api/razorpay/webhook`, subscribed to
   `payment.captured`, and use its signing secret for
   `RAZORPAY_WEBHOOK_SECRET` (this is separate from `RAZORPAY_KEY_SECRET`).
4. Trigger a deploy. The custom domain is already attached to this Netlify
   site, so no DNS changes are needed.

**Database migrations on deploy:** `netlify.toml`'s build command runs
`npx prisma migrate deploy` before `next build`, so any pending migration
(like `Plan`) applies to the production database automatically on every
deploy — no manual step needed. `migrate deploy` only applies migrations
that haven't run yet, so it's safe to run on every build.
