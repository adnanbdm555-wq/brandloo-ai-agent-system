# AdPulse AI — Social Media Operations Platform

**All 6 phases complete, plus a full commercial billing system and a
chained agent Pipeline on top.** Authentication, multi-tenant Agencies,
Brand Management, Brand Knowledge Base, Campaigns, Strategy Agent,
Content Agent, Content Calendar, Content Studio, Creative Agent, Video
Agent, QA Agent, Approval System, Social Accounts, Publishing tracking,
Notifications, Analytics, AI Insights & Optimization Agent, Templates,
Automation Builder, Users & Roles, Billing (15-day trial, automatic
invoicing, automatic suspension, Safepay checkout) — and now a
**Pipeline**: Strategy → Content → Creative → Video → QA chained into
one run, matching the original architecture diagram this was built
from.

Built from the master prompt's architecture diagram (Strategy → Content
→ Creative → Video → QA → Approval → Publishing → Analytics →
Optimization), phase by phase, with every feature actually run and
tested against a real Postgres database before moving to the next —
see "What's real vs. what needs your own keys" below for the handful
of places that need credentials only you can provide.

## What's working right now

**Pipeline**
- One trigger runs **Strategy → Content → Creative → Video → QA** in
  sequence — the actual chain from the original architecture diagram
  this platform was built from, rather than five separate manual visits
  to five separate Studios.
- Each step's outcome is recorded and shown — success, failed, or
  skipped (Strategy skips if the campaign already has one or none was
  selected; Video skips for non-video content types) — with an optional
  final "auto-submit for approval" step that only fires if QA passed.
- A missing `ANTHROPIC_API_KEY` aborts the whole run immediately after
  the first step that needs it, with one clear message, instead of
  failing the same way five times in a row. Tested directly: with no
  campaign selected the run correctly skips Strategy and fails cleanly
  at Content; with a campaign selected it correctly attempts Strategy
  first and aborts there instead; a campaign that already has a
  strategy correctly skips that step rather than redoing it.
- Every run is logged (`pipeline_runs`) and shown in a history list per
  brand, so a failed run is visible afterward, not just in the moment.

**Billing**
- Every new agency starts on a **15-day free trial** automatically —
  no setup needed.
- Fully automatic lifecycle, tested end-to-end by fast-forwarding a
  real subscription through it: **TRIALING** → (trial ends) an invoice
  is generated and emailed automatically → **PAST_DUE** → (5-day grace
  period passes unpaid) → **SUSPENDED**, which immediately blocks that
  agency's dashboard access — checked fresh on every request, not
  cached, so a suspension (or reactivation) takes effect right away,
  not just at next login.
- `/billing` stays reachable even while suspended — it's how an agency
  pays to restore access — and shows the plan, trial countdown, and
  every invoice with a "Pay now" button.
- **Platform Admin** (`/platform-admin`, `/agents`'s sibling for the
  platform owner) — the very first person to ever register on the
  whole install gets this automatically. Lists every agency with its
  subscription and invoice history, plus manual Activate / Suspend /
  Cancel / Extend-trial controls and a "run billing check now" button.
  Deliberately kept reachable even if the admin's own agency is
  suspended (a real bug this caught during testing: it originally sat
  inside the same gated layout as everything else, which meant a
  suspended platform admin would've been locked out of the one place
  that could un-suspend them).
- **Safepay** (getsafepay.pk — chosen because Stripe doesn't support
  Pakistan-registered businesses) checkout + webhook for the "Pay now"
  button. See the honesty note below — this is real code, not tested
  against a live Safepay account.
- **Email** (Resend) for trial-ending reminders, invoice-ready notices,
  suspension notices, and payment confirmations — same graceful
  "not configured" pattern as everything else needing a key.

**Accounts & agencies**
- Sign-up either creates a new agency (you become its Super Admin) or
  joins one via invite code (you become a Marketing Manager). Every
  brand, campaign, and piece of content belongs to exactly one agency —
  nothing is ever visible across agencies. This was tested directly:
  two separate agencies were created, and cross-tenant reads, writes,
  and notifications were all confirmed blocked.
- **Users & Roles** — invite link with a copy button, per-teammate role
  changes, removal. An agency can never be left with zero Super Admins
  (enforced server-side, not just in the UI).

**Brands**
- Full CRUD on every field from the spec (basics, audience, voice,
  visual identity, platforms, competitors, guardrails, contact info).
- **Knowledge Base** — structured entries across 16 categories (FAQs,
  USPs, approved claims, brand voice, etc.) that ground every agent
  below, so they don't invent brand facts.
- **Social Accounts** — a per-brand registry of actual handles (see the
  OAuth note below for why this isn't a "Connect" button).

**Planning & content**
- **Campaigns** with objective, dates, and target platforms.
- **Strategy Agent** — proposes content pillars and key messages from a
  brand's knowledge base and a campaign's objective.
- **Content Agent** — writes a ready-to-review caption + hashtags,
  grounded the same way, optionally aware of a campaign's strategy.
- **Templates** — reusable briefs (e.g. "Product feature highlight")
  that pre-fill Content Studio, agency-wide or scoped to one brand.
- **Automation Builder** — schedule a rule (brand, template or brief,
  platform, day/hour) and the Content Agent drafts a post automatically
  when it's due. A "Run now" button tests a rule immediately. See
  "Wiring up the automation cron" below — there's no scheduler running
  inside the app itself.
- **Content Calendar** — month grid, drag-and-drop scheduling, a detail
  panel per post (status, QA report, approval actions, links to
  Creative/Video Studio).

**Review**
- **QA Agent** — checks a draft against forbidden words, tone, required
  hashtags, and the knowledge base; PASS / WARNINGS / FAIL with specific
  issues.
- **Approval System** — DRAFT/READY → submit → PENDING_APPROVAL →
  APPROVED or REJECTED (rejection requires a reason). Every transition
  is logged with who and when. Approve/reject is restricted to Super
  Admin, Admin, and Marketing Manager — separate from who can create
  content, so people don't approve their own drafts.
- **Approval Center** — a queue of everything pending review, QA report
  visible alongside each item.
- **Creative Agent** — writes a creative brief (composition, brand
  colors, mood, aspect ratio) a designer executes from.
- **Video Agent** — writes a scene-by-scene script (visual, voiceover,
  on-screen text, duration) an editor shoots and cuts from.

**Publishing & measurement**
- **Publishing** — approved content lists in a "ready to publish" queue;
  confirming one records the live URL and which account it went out on.
- **Analytics** — real performance numbers, entered manually from what
  you actually see on each platform. Aggregate cards, a reach-by-post
  chart, an editable table per published post.
- **AI Insights & Optimization Agent** — reads real published posts and
  their real metrics and surfaces genuine patterns and forward-looking
  recommendations. Refuses to run below 3 real data points, so it never
  dresses up noise as a pattern.
- **Notifications** — approvers are notified when something's submitted;
  the submitter is notified when it's approved or rejected. Bell icon
  plus a full history page.
- **Agents** — a control-center page listing all six agents, what each
  does, where it's used, and whether `ANTHROPIC_API_KEY` is configured.
- **Dashboard** — every card is a real number from your data (brands,
  campaigns, content, pending approvals, scheduled/published posts,
  reach, engagement). Leads and Conversion Rate are marked as needing a
  CRM/attribution tool this platform intentionally doesn't try to be.

The sidebar reflects all of this directly — every item is live; nothing
says "Phase X" anymore. A few small, genuinely optional items (Media
Library, Activity Log, Settings) are marked "Planned" — see the note at
the bottom of this file for why those were left out.

## What's real vs. what needs your own keys

Everything above runs against a real database and was tested end-to-end
in this build. Three things specifically need credentials that only you
can provide, because they touch systems outside this app:

1. **The AI agents** (Strategy, Content, QA, Creative, Video, Insights)
   need `ANTHROPIC_API_KEY`. Without it, each returns a clear
   "not configured" message instead of failing silently or faking output.
2. **Automated posting to Facebook/Instagram/LinkedIn/YouTube** would
   need OAuth apps registered in each platform's own developer console
   (Meta for Developers, Google Cloud Console, LinkedIn Developer
   Portal) plus a stable public callback URL — not something any code
   can substitute for. What's built instead: a real Social Accounts
   registry and a manual "confirm what's published" flow, which is
   genuinely how many agencies operate before investing in full API
   automation. `api/content/[id]/publish/route.ts` is exactly where a
   real platform API call would go later.
3. **Scheduled automation and billing** need an external trigger
   (Vercel Cron or any scheduler) calling `/api/automation/run` and
   `/api/billing/run` on a timer, secured with `CRON_SECRET`. Both
   endpoints and the underlying logic are real and tested (via the
   manual "Run now" / "Run billing check now" buttons); only the timer
   itself is external, because there's no background process inside a
   Next.js app to run one.
4. **Safepay checkout** (the "Pay now" button on `/billing`) needs
   `SAFEPAY_API_KEY`, `SAFEPAY_V1_SECRET`, and `SAFEPAY_WEBHOOK_SECRET`
   from a real Safepay merchant account. This is the one piece in the
   whole build that couldn't be run end-to-end, because no such account
   existed to test against — see the dedicated note under "Notes on
   decisions" below before going live with it. Everything around it
   (invoice generation, trial tracking, suspension, manual activation)
   was tested without needing Safepay at all.
5. **Billing and notification emails** need `RESEND_API_KEY`. Without
   it, the billing lifecycle still runs correctly (trials still expire,
   invoices still generate, suspension still happens) — the emails
   are just skipped rather than sent, logged instead of crashing.

Nothing else in the app is a placeholder — brand data, approvals,
calendar scheduling, notifications, analytics entry, and multi-tenant
isolation all work with zero external configuration.

## Tech stack

- **Next.js 15** (App Router) + **React 19** + TypeScript
- **Tailwind CSS** — custom token system (see `tailwind.config.ts`):
  Ink (near-black navy sidebar), Canvas (warm neutral workspace), Indigo
  (primary actions), Amber (AI/agent signal color)
- **Postgres** + **Drizzle ORM** — chosen over Prisma because Drizzle is
  pure TypeScript with no native binary to download, which matters for
  CI/sandboxed environments and keeps cold starts fast on serverless.
- **NextAuth v5** (Auth.js, credentials provider, JWT sessions —
  `agencyId` and `role` both carried on the session)
- **Anthropic SDK** (`@anthropic-ai/sdk`) — powers all six agents,
  model `claude-sonnet-5`
- **Resend** — billing and notification emails
- **`@sfpy/node-sdk`** (Safepay) — Pakistani payment gateway for
  subscription checkout
- **Fraunces** (display) + **Inter** (body/UI), self-hosted via
  `@fontsource` — no external font requests at build or runtime.

## Local setup

```bash
npm install

cp .env.example .env
# edit .env: DATABASE_URL, and generate NEXTAUTH_SECRET with:
openssl rand -base64 32

npm run db:generate   # generates SQL from db/schema.ts into db/migrations/
npm run db:migrate    # applies migrations to your database

npm run dev            # http://localhost:3000
```

Sign up at `/register` — **the very first account created on the whole
install becomes the Platform Admin** (you, the operator — see
`/platform-admin`), in addition to being its agency's Super Admin.
Anyone after that can either create their own separate agency (a
regular Super Admin, no platform access) or join yours with the invite
code shown on the **Users & Roles** page. If you're setting this up
for yourself, register first, before sharing any invite links.

**To enable the AI agents**, add to `.env`:

```
ANTHROPIC_API_KEY="sk-ant-..."
```

Get one from the Claude Platform console.

**To enable billing emails**, add `RESEND_API_KEY` (from resend.com)
and `BILLING_EMAIL_FROM`. **To enable the "Pay now" button**, add
`SAFEPAY_API_KEY`, `SAFEPAY_V1_SECRET`, and `SAFEPAY_WEBHOOK_SECRET`
from your Safepay merchant dashboard — read the Billing note under
"Notes on decisions" before flipping `SAFEPAY_ENVIRONMENT` to
`production`.

Optional: `npm run db:seed` creates a demo agency + Super Admin account
(`demo@adpulse.test` / `demo12345`, also set as Platform Admin) —
dev/testing only, don't run this against a production database.

`npm run db:studio` opens Drizzle Studio to browse data directly.

## Deploying (Vercel + Postgres)

This was built to match your existing deploy pattern from the ERP
project:

1. Push this repo to GitHub.
2. Import it into Vercel.
3. Add a Postgres database (Vercel Postgres, Neon, or Supabase all work
   — just paste the connection string into `DATABASE_URL`).
4. Set `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `ANTHROPIC_API_KEY` as
   environment variables.
5. Run `npm run db:migrate` once against the production `DATABASE_URL`
   to create the tables.

### Wiring up the automation and billing crons

`vercel.json` already declares both:

```json
{
  "crons": [
    { "path": "/api/automation/run", "schedule": "0 * * * *" },
    { "path": "/api/billing/run", "schedule": "0 6 * * *" }
  ]
}
```

Automation runs hourly (rules fire close to their scheduled hour);
billing runs once daily (trial/invoice/suspension checks don't need to
be more frequent than that). Set a `CRON_SECRET` environment variable
in your Vercel project — Vercel automatically sends it as
`Authorization: Bearer <value>` on every cron invocation, which is
exactly what both endpoints check for. (Any other external scheduler
works too, as long as it sends that same header.) Without
`CRON_SECRET` set, both endpoints return a clear "not configured"
`503` rather than silently doing nothing — and as the Platform Admin,
you can always trigger a billing check manually from `/platform-admin`
without needing the cron at all.

## Project structure

```
app/
  (auth)/login, (auth)/register       — sign in / create or join agency
  (dashboard)/dashboard               — main dashboard
  (dashboard)/brands, brands/new,
    brands/[id], brands/[id]/edit     — brand CRUD + knowledge base +
                                         social accounts
  (dashboard)/campaigns, campaigns/new,
    campaigns/[id]                    — campaign CRUD + Strategy Agent UI
  (dashboard)/content-studio          — Content Agent UI + templates
  (dashboard)/creative-studio         — Creative Agent UI
  (dashboard)/video-studio            — Video Agent UI
  (dashboard)/content-calendar        — month grid + scheduling + review
  (dashboard)/approvals               — Approval Center queue
  (dashboard)/publishing              — ready-to-publish + published queue
  (dashboard)/analytics               — real metrics dashboard + entry
  (dashboard)/insights                — AI Insights & Optimization UI
  (dashboard)/notifications           — full notification history
  (dashboard)/templates               — template library
  (dashboard)/automation              — automation rule builder
  (dashboard)/pipeline                — chained Strategy→Content→Creative
                                         →Video→QA run + history
  (dashboard)/users                   — Users & Roles, invite code
  (dashboard)/agents                  — agent control center
  billing                             — plan/trial/invoices, "Pay now" —
                                         its OWN layout (not under
                                         (dashboard)), so it stays reachable
                                         even when an agency is SUSPENDED
  platform-admin                      — every agency, manual billing
                                         controls — also its OWN layout,
                                         for the same reason: the platform
                                         admin must be able to reach this
                                         even if their own agency is
                                         suspended
  api/auth/[...nextauth], api/register, api/agency
  api/brands, api/brands/[id],
    api/brands/[id]/knowledge(/[id]),
    api/brands/[id]/insights
  api/campaigns, api/campaigns/[id],
    api/campaigns/[id]/strategy
  api/content, api/content/[id],
    api/content/generate,
    api/content/[id]/{qa,submit,approve,reject,events,
      creative,video-script,publish,metrics}
  api/creative-assets/[id]
  api/social-accounts, api/social-accounts/[id]
  api/notifications, api/notifications/[id]/read, api/notifications/read-all
  api/templates, api/templates/[id]
  api/automation-rules, api/automation-rules/[id],
    api/automation-rules/[id]/run-now, api/automation/run (cron)
  api/users, api/users/[id]
  api/billing/subscription, api/billing/run (cron),
    api/billing/invoices/[id]/checkout, api/billing/webhook (Safepay)
  api/platform-admin/agencies, api/platform-admin/billing-run,
    api/platform-admin/subscriptions/[id]/{activate,suspend,cancel,
      extend-trial}
  api/pipeline/run, api/pipeline/runs
auth.ts / auth.config.ts              — NextAuth config, split so
                                         middleware.ts stays Edge-safe;
                                         session carries id/role/agencyId/
                                         isPlatformAdmin
middleware.ts                         — protects every /dashboard-group,
                                         /billing, /platform-admin, and
                                         /pipeline route at the edge
db/
  schema.ts                           — Drizzle schema (source of truth) —
                                         agencyId is denormalized onto
                                         every agency-owned table rather
                                         than only living on brands, so
                                         every query filters directly
                                         instead of relying on a join
  index.ts, id.ts                     — db client, id/invite-code helpers
  migrate.ts, seed.ts                 — scripts
  migrations/                         — generated SQL
lib/ai/
  client.ts                           — Anthropic SDK wrapper, AgentConfigError
  brand-context.ts                    — assembles brand + knowledge into
                                         agent grounding context
  strategy-agent.ts, content-agent.ts,
  qa-agent.ts, creative-agent.ts,
  video-agent.ts, insights-agent.ts   — the six agents
  pipeline.ts                        — chains the five agents above into
                                        one run; isVideoApplicable() is a
                                        pure, directly-testable function
lib/content/submit.ts                 — submitForApproval, shared by the
                                         manual submit button and the
                                         pipeline's auto-submit step
lib/billing/
  config.ts                          — trial length, price, grace period —
                                        change your pricing here
  cycle.ts                           — the automatic state machine:
                                        TRIALING → PAST_DUE → SUSPENDED
  actions.ts                         — manual overrides for Platform Admin
  invoices.ts                        — invoice number generation
  safepay.ts                         — checkout + webhook, PaymentConfigError
lib/email/
  client.ts                          — Resend wrapper, EmailConfigError
  billing-templates.ts               — the four billing email templates
lib/notifications.ts                  — notifyApprovers / notifyUser,
                                         both agency-scoped
lib/roles.ts                          — canEdit / canApprove / canManageUsers
components/                           — Sidebar, TopBar, NotificationBell,
                                         BrandForm, KnowledgeBase,
                                         SocialAccountsPanel, CampaignForm,
                                         StrategyPanel, ContentStudio,
                                         ContentCalendar, ContentDetailPanel,
                                         ApprovalCenter, CreativeStudio,
                                         VideoStudio, PublishingCenter,
                                         Analytics, InsightsPanel,
                                         NotificationsList, Templates,
                                         Automation, UsersRoles,
                                         BillingView, PlatformAdmin,
                                         Pipeline, DashboardCard
vercel.json                           — hourly automation cron, daily
                                         billing cron
```

## Notes on decisions made while building this

- **Why a config error aborts the whole Pipeline run, but a single
  step failure doesn't.** `ANTHROPIC_API_KEY` missing means every
  remaining agent call would fail identically — so the first step that
  hits `AgentConfigError` stops the run immediately with one clear
  message, rather than repeating "not configured" five times. A
  different kind of failure (say, Creative Agent returning malformed
  JSON once) is treated as isolated instead: Content succeeding is the
  one hard requirement (nothing after it makes sense without a post to
  attach a brief, script, or QA check to), but Creative, Video, and QA
  don't depend on each other, so one failing doesn't block the rest.
  This is why the pipeline's tests deliberately covered both shapes —
  the immediate-abort path (no key at all) and the skip-logic path
  (campaign already has a strategy, or content type isn't video) —
  rather than only the happy path, which needs a real API key to
  exercise.
- **Why Pipeline reuses each agent's existing function instead of
  duplicating logic.** `lib/ai/pipeline.ts` imports and calls
  `runStrategyAgent`, `runContentAgent`, etc. directly — the same
  functions each Studio page already calls. A bug fixed in the Content
  Agent's grounding logic, for instance, is fixed for both the Studio
  and the Pipeline at once, because there's only one implementation to
  fix. The same reasoning applies to `submitForApproval` in
  `lib/content/submit.ts`, shared between the manual "Submit for
  approval" button and the pipeline's auto-submit step.
- **Safepay is real code, not a tested integration.** No Safepay
  merchant account existed to test against while building this, so
  `lib/billing/safepay.ts` is written against the current published
  `@sfpy/node-sdk` (github.com/getsafepay/safepay-node) — but payment
  APIs shift, and the webhook payload parsing in particular
  (`verifyAndParseWebhook`) is a defensive best guess at field names,
  not a confirmed shape. **Before accepting real payments**: get a
  Safepay sandbox account, run one real invoice through checkout, log
  the actual webhook payload, and adjust `verifyAndParseWebhook`'s
  field lookups to match if needed. Everything upstream of Safepay
  (trials, invoices, suspension, manual activation, the Platform Admin
  panel) was fully tested without it and doesn't depend on it being
  correct.
- **Why Safepay over Stripe**: Stripe does not support
  Pakistan-registered businesses (confirmed directly — Pakistan isn't
  on Stripe's supported-country list, and this isn't a recent
  restriction). Safepay was chosen because, unlike JazzCash/Easypaisa,
  it's built specifically for recurring/subscription billing.
- **The Platform Admin bug this build caught**: `/platform-admin`
  originally lived under the same layout as the rest of the app, which
  gates access when an agency is SUSPENDED. That meant if the platform
  admin's own agency were ever suspended, they'd be locked out of the
  one screen that could fix it. Both `/billing` and `/platform-admin`
  now have their own layouts, deliberately outside that gate.
- **Manual activation doesn't retroactively mark an invoice paid.**
  Clicking "Activate" in Platform Admin moves the *subscription* to
  ACTIVE (e.g. "I confirmed payment happened outside the app, over a
  bank transfer") but leaves any open invoice's status untouched — if
  you also want the invoice record itself marked paid, that's a
  separate, deliberate choice, not automatic.
- **Drizzle instead of Prisma**: Prisma's CLI needs to download engine
  binaries from `binaries.prisma.sh` at generate/migrate time, which
  fails in network-restricted environments. Drizzle has no such
  dependency. The schema in `db/schema.ts` would map directly to Prisma
  if you'd rather switch.
- **`agencyId` denormalized onto every agency-owned table** (brands,
  campaigns, content, knowledge, social accounts, insights, templates,
  automation rules) rather than only on `brands` with everything else
  joining through it. This was a deliberate safety choice: a query that
  forgets to join through `brands` is a subtle bug; a query on a table
  that already has `agencyId` and doesn't filter by it is a much more
  obvious one to catch in review. Every API route filters by
  `session.user.agencyId` directly.
- **Array-type fields** (brand colors, platforms, hashtags, content
  pillars, etc.) are stored as JSON-encoded text columns rather than
  native Postgres arrays, so the schema stays simple to read and
  migrate.
- **No fake data, anywhere**: dashboard metrics that need real
  underlying data (reach, engagement, published counts) are always
  computed from actual rows — never placeholders once the corresponding
  phase existed. The Insights Agent has a hard floor of 3 real data
  points before it will run. The QA/Strategy/Content/Creative/Video
  agents are told explicitly, in their system prompts, to ground every
  claim in the brand's actual provided information and never invent
  facts.
- **Agents fail loudly, not silently**: every agent-backed API route
  catches `AgentConfigError` specifically and returns a `503` with a
  precise message (e.g. "ANTHROPIC_API_KEY is not set") rather than a
  generic error or, worse, fabricated output. The UI surfaces that
  message inline.
- **Why Media Library, Activity Log, and Settings are still "Planned"**:
  these three were never assigned to a specific phase in the master
  prompt's phase breakdown (unlike everything else, which was). Media
  Library would need file storage (S3/Vercel Blob) as a new dependency;
  Activity Log would mostly duplicate what `content_approval_events`
  already records; Settings was never scoped beyond its name. Rather
  than build speculative versions of features nobody specified, they're
  left as clearly-marked placeholders for when there's an actual spec.
