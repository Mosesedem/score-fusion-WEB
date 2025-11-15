# Betting Prediction App — Complete Working Map (Revised)

This document is the implementation-ready specification for the betting prediction platform across Web (Next.js) and Mobile (Flutter), emphasizing backend-first control (>60%), realtime live scores and analytics, a sharp, modern UI in black + yellow-600, and a full admin suite.

- Theme: Black (#000000) base, Primary Yellow (#CA8A04, Tailwind `yellow-600`), Accent Dark Gray (#1E1E1E)
- UI: No gradients. Border radius = 0 (sharp edges) across all components.
- Typography: Inter or Poppins.
- Target: >60% backend control of content, UI modules, and logic.

---

## 1) High-level Architecture

Textual diagram of the system and data flows.

```
+-------------------------+           +------------------+         +------------------+
|  Flutter App (iOS/And)  |  HTTPS    |  Next.js (Web)   |  RSC    |  Next Route API  |
|  - UI (dark + yellow)   |<--------->|  - App Router    |<------->|  Handlers        |
|  - SSE/WebSocket client |           |  - Admin Panel   |         |  (serverless)    |
+-------------------------+           +------------------+         +---------+--------+
                                                                             |
                                                                             | Prisma
                                                                      +------v-----------+
                                                                      |   PostgreSQL     |
                                                                      |  (Primary DB)    |
                                                                      +------+-----------+
                                                                             |
                                                     +-----------------------+----------------------+
                                                     |                                              |
                                              +------v-------+                                  +---v----------------+
                                              |   Redis      |<--- Pub/Sub / Streams -----------| Realtime Workers   |
                                              |  (Cache,     |                                  | (cron, ingestion)  |
                                              |   sessions,  |                                  | - Live scores API  |
                                              |   rate-limit)|                                  | - Analytics flush  |
                                              +------+-------+                                  +---+----------------+
                                                     |                                              |
                                            +--------v---------+                         +----------v-----------+
                                            | Stripe (Billing) |<-- webhooks ------------|  Webhook Route       |
                                            +------------------+                         |  /api/webhooks/stripe |
                                                                                        +----------------------+

                                            +-------------------+
                                            | Firebase (FCM)    |<-- push to devices
                                            +-------------------+
```

Key points

- Next.js Route Handlers provide the unified HTTP API for both Web and Mobile.
- Realtime via Redis (pub/sub) with SSE endpoints for clients; workers ingest live scores and push updates.
- Stripe for subscriptions and one-time VIP via tokens; webhook reconciles state.
- Firebase Cloud Messaging (FCM) for push notifications.
- Prisma as ORM for PostgreSQL; Redis for cache, ephemeral analytics, sessions, and rate limiting.

Deployment notes

- Web: Vercel (or similar) for Next.js with Vercel Cron for scheduled workers; alternative: standalone Node worker/Cloud Run.
- Mobile: Flutter app consuming the same API and SSE endpoints.

---

## 2) Web App Structure (Next.js App Router)

Planned routes and pages. Items marked (exists) match current `/app` or `/app/api` structure and should be expanded; (new) indicates new pages or handlers to add.

Public site

- `/` Landing page: realtime feed (latest tips, top wins), featured tips, live scores section (SSE snapshot with hydration) (new)
- `/about` (new)
- `/terms` (new)
- `/privacy` (new)
- `/contact` (new)
- `/tips` Free tips listing (exists api: `/api/tips`)
- `/tips/[id]` Free tip detail (exists api: `/api/tips/[id]`)
- `/vip` VIP teaser/promo page (new)
- Auth: `/login` (exists), `/signup` (exists), `/guest` lightweight access (exists api `/api/auth/guest`)

Authenticated user area

- `/dashboard` Personalized dashboard: user stats, live matches, free + VIP tips (new)
- `/vip/area` VIP content listing/detail, locked behind subscription or token (new)
- `/history` Betting history (uses `/api/bets`) (new page)
- `/notifications` Inbox of pushes / in-app notifications (new)
- `/profile` Edit details, subscription, responsible gaming (cooldown/limits) (new)
- `/settings` Theme toggle, push settings, devices (new)
- `/account/delete` Compliance (new page + API)

Admin area

- `/admin` Overview dashboard with realtime analytics (exists api: `/api/admin/dashboard`)
- `/admin/tips` Management CRUD (exists api: `/api/admin/tips`)
- `/admin/users` Manage users (ban, delete, limits) (exists api: `/api/admin/users`)
- `/admin/vip-tokens` Generate/revoke (exists api: `/api/vip/tokens/redeem` + admin endpoints) (new page)
- `/admin/payments` Subscriptions & payments (exists webhook; add admin views) (new)
- `/admin/notifications` Broadcast pushes (new)
- `/admin/audit-logs` View/audit actions (new)
- `/admin/feature-flags` Flags & A/B testing (new)

API (route handlers)

- Auth: `/api/auth/signup` (exists), `/api/auth/login` (exists), `/api/auth/logout` (exists), `/api/auth/me` (exists), `/api/auth/guest` (exists)
- Tips: `/api/tips` (exists), `/api/tips/[id]` (exists), Admin CRUD `/api/admin/tips` (exists)
- VIP: `/api/vip/tokens/redeem` (exists), `/api/vip/status` (new), `/api/vip/access` (new)
- Bets & Earnings: `/api/bets` (exists), `/api/earnings` (exists)
- Live scores: `/api/livescores/matches` (exists), SSE channel `/api/realtime/subscribe` (exists) + `/api/livescores/subscribe` (new alias with filters)
- Payments: `/api/pay/checkout` (exists), webhooks `/api/webhooks/stripe` (exists), `/api/subscriptions/manage` (new)
- Profile & settings: `/api/users/me` (alias to auth/me) (new), `/api/users/delete` (new), `/api/notifications/prefs` (new)
- Admin: `/api/admin/dashboard` (exists), `/api/admin/users` (exists), `/api/admin/analytics` (exists), `/api/admin/config` (exists), `/api/admin/flags` (new), `/api/admin/broadcast` (new), `/api/admin/audit-logs` (new), `/api/admin/tokens` (new)
- Realtime analytics SSE: `/api/realtime/analytics` (new)

---

## 3) Mobile App (Flutter) Overview

- UI Kit mirrors web theme (black + yellow-600; no gradients; sharp edges).
- Auth flows: login/signup/guest; token stored securely (Keychain/Keystore); HttpOnly cookie via webview or token-based fallback.
- Screens: Home (feed + live scores), Tips, Tip Detail, VIP, Notifications, History, Profile, Settings.
- Realtime: SSE client via `http` streaming or `eventsource` library; channels `livescores`, `analytics:user:{id}`.
- Push: Firebase Messaging; topics: `vip`, `breaking-tip`, user-scoped tokens.

---

## 4) Data Model (Prisma-style)

Note: These are additive to your existing `prisma/schema.prisma`; adjust naming if collisions exist. Types abbreviated for brevity; use UUIDs or cuid.

```prisma
model User {
  id              String   @id @default(cuid())
  email           String   @unique
  passwordHash    String
  role            Role     @default(USER)
  status          UserStatus @default(ACTIVE)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  profile         Profile?
  tips            Tip[]             @relation("TipAuthor")
  bets            Bet[]
  notifications   Notification[]
  subscription    Subscription?
  vipTokens       VipTokenRedemption[]
  auditLogs       AuditLog[]
}

enum Role { USER ADMIN }

enum UserStatus { ACTIVE BANNED DELETED }

model Profile {
  id           String  @id @default(cuid())
  userId       String  @unique
  displayName  String?
  avatarUrl    String?
  responsibleGamingLimit Int?   // max bets per day or cooldown in hours
  user         User    @relation(fields: [userId], references: [id])
}

model Tip {
  id          String   @id @default(cuid())
  title       String
  content     String
  sport       String
  league      String?
  matchId     String?  // FK to Match
  odds        Float
  status      TipStatus @default(PENDING)
  isVip       Boolean   @default(false)
  authorId    String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  author      User     @relation("TipAuthor", fields: [authorId], references: [id])
  results     TipResult?
}

enum TipStatus { PENDING WON LOST VOID }

model TipResult {
  id        String  @id @default(cuid())
  tipId     String  @unique
  settledAt DateTime
  outcome   TipStatus
  payout    Float?
  tip       Tip     @relation(fields: [tipId], references: [id])
}

model Bet {
  id        String   @id @default(cuid())
  userId    String
  tipId     String
  stake     Float
  potential Float
  status    BetStatus @default(OPEN)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  user      User @relation(fields: [userId], references: [id])
  tip       Tip  @relation(fields: [tipId], references: [id])
}

enum BetStatus { OPEN WON LOST CASHED_OUT }

model Earning {  // summary per user or platform
  id        String   @id @default(cuid())
  userId    String?
  amount    Float
  source    String    // subscription, token, affiliate
  createdAt DateTime  @default(now())
  user      User?     @relation(fields: [userId], references: [id])
}

model Match {
  id          String   @id  // external provider id or cuid
  sport       String
  league      String?
  homeTeam    String
  awayTeam    String
  startTime   DateTime
  status      MatchStatus @default(SCHEDULED)
  homeScore   Int? @default(0)
  awayScore   Int? @default(0)
  updatedAt   DateTime @updatedAt

  events      MatchEvent[]
}

enum MatchStatus { SCHEDULED LIVE FINISHED POSTPONED }

model MatchEvent {
  id        String @id @default(cuid())
  matchId   String
  kind      String   // goal, card, break, etc.
  minute    Int?
  payload   Json
  createdAt DateTime @default(now())
  match     Match @relation(fields: [matchId], references: [id])
}

model Subscription {
  id              String   @id @default(cuid())
  userId          String   @unique
  stripeCustomerId String  @unique
  stripeSubId     String?  @unique
  status          SubStatus @default(INACTIVE)
  currentPeriodEnd DateTime?
  plan            String?
  user            User     @relation(fields: [userId], references: [id])
}

enum SubStatus { INACTIVE ACTIVE PAST_DUE CANCELED }

model VipToken {
  id        String  @id @default(cuid())
  code      String  @unique
  expiresAt DateTime?
  isRevoked Boolean  @default(false)
  createdAt DateTime @default(now())
  createdBy String   // adminId
}

model VipTokenRedemption {
  id        String  @id @default(cuid())
  userId    String
  tokenId   String
  redeemedAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  token     VipToken @relation(fields: [tokenId], references: [id])
}

model Payment {
  id           String   @id @default(cuid())
  userId       String
  stripeId     String   @unique
  amount       Int
  currency     String
  status       String
  createdAt    DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id])
}

model Notification {
  id        String   @id @default(cuid())
  userId    String?
  title     String
  body      String
  topic     String?
  sentAt    DateTime?
  createdAt DateTime @default(now())
  user      User?    @relation(fields: [userId], references: [id])
}

model AuditLog {
  id        String   @id @default(cuid())
  actorId   String?
  action    String
  entity    String?
  entityId  String?
  payload   Json?
  createdAt DateTime @default(now())
  actor     User?    @relation(fields: [actorId], references: [id])
}

model FeatureFlag {
  id        String   @id @default(cuid())
  key       String   @unique
  enabled   Boolean  @default(false)
  variant   String?
  updatedAt DateTime  @updatedAt
}
```

---

## 5) API Endpoint Map

Auth

- POST `/api/auth/signup` — email, password; creates user; returns session token.
- POST `/api/auth/login` — email, password; sets HttpOnly cookie.
- POST `/api/auth/logout`
- GET `/api/auth/me` — profile and roles.
- POST `/api/auth/guest` — returns guest session with limited scope.

Users & Profile

- GET `/api/users/me` — alias of `auth/me` with profile populated.
- PATCH `/api/users/me` — update displayName, avatarUrl, limits.
- POST `/api/users/delete` — account deletion (anonymize, status=DELETED), requires re-auth.
- GET/PUT `/api/notifications/prefs` — enable topics and device tokens.

Tips

- GET `/api/tips` — list public tips, filters.
- GET `/api/tips/[id]` — tip detail.
- Admin: POST `/api/admin/tips` — create; PATCH/DELETE `/api/admin/tips/[id]`; GET `/api/admin/tips`.

VIP & Access

- GET `/api/vip/status` — subscription active or valid token redemption.
- POST `/api/vip/access` — assert access for a resource (tipId or section).
- POST `/api/vip/tokens/redeem` — redeem token (exists).
- Admin: POST `/api/admin/tokens` — create tokens; PATCH `/api/admin/tokens/[id]` revoke.

Bets & Earnings

- GET/POST `/api/bets` — list/create bets per user.
- GET `/api/earnings` — aggregate earnings for user/admin.

Live Scores

- GET `/api/livescores/matches` — live & scheduled matches (exists).
- GET `/api/realtime/subscribe` — SSE multiplexed channel (exists). Query: `topic=livescores|analytics|user:{id}|match:{id}`.
- GET `/api/livescores/subscribe` — SSE filtered by sport/league/match (new alias).

Payments & Subscriptions

- POST `/api/pay/checkout` — Stripe Checkout session (exists).
- POST `/api/subscriptions/manage` — create/cancel/portal link.
- POST `/api/webhooks/stripe` — reconcile subscription/payment events (exists).

Admin & Analytics

- GET `/api/admin/dashboard` — KPIs, counts, recent activity (exists).
- GET `/api/admin/analytics` — time series and aggregates (exists).
- GET `/api/admin/users` — list; PATCH `/api/admin/users/[id]` — ban/delete/exclude (exists).
- GET `/api/admin/config` — server-configurable UI modules (exists).
- GET/POST `/api/admin/flags` — feature flags and variants (new).
- POST `/api/admin/broadcast` — push notification broadcast (new).
- GET `/api/admin/audit-logs` — list audit events (new).

Compliance

- GET `/terms`, `/privacy`, `/about` — static pages (new pages).
- POST `/api/users/delete` — account deletion.

Contract examples (shapes)

- SSE event data: `{ type: "match_update" | "analytics" | "tip_update", topic: string, data: any, ts: number }`
- API error: `{ error: string, code?: string }` with appropriate HTTP status.

---

## 6) Realtime Implementation Plan

Live scores

- Ingestion worker pulls from sports API (vendor-agnostic adapter) every 5–15s for live matches; schedules future matches hourly.
- Normalize into `Match` and `MatchEvent` tables; update scores and events.
- Push updates to Redis pub/sub topics: `livescores`, `match:{id}`, and `sport:{name}`.
- SSE endpoints subscribe to requested topics and stream deltas to clients. Web and Flutter consume the same.

Realtime analytics

- Track events: `user_online`, `signup`, `tip_view`, `bet_create`, `tip_result`.
- Emit to Redis Streams (or lists) with lightweight payloads; periodically aggregate to Postgres for durability.
- Admin dashboard subscribes to `/api/realtime/analytics` to show live counts; historical charts read from Postgres materialized tables.

Reliability & scale

- Use server heartbeats to expire stale sessions; employ backpressure by sampling events if load spikes.
- Backoff logic on clients for SSE reconnect; idempotent handlers using event ids.

---

## 7) Backend-Controlled Components (>60%)

Back-end managed modules

- Tips content and status (100%)
- VIP access gates and tokens (100%)
- Live scores and event feeds (100%)
- Admin-config flags: feature toggles, module visibility, layout blocks (header banners, featured carousels) (100%)
- Analytics widgets: metrics definitions, time windows, leaderboards (100%)
- Notifications broadcasts and targeting (100%)
- Payments and subscription state (100%)
- Navigation items sourced from config for some sections (read-only fallback if unavailable) (50–100%)
- Theming constants (colors, typography) fixed in code; content colors for banners sourced from Admin Config (50%)

Estimated control coverage

- Content & data sources: ~45%
- Access & monetization logic: ~20%
- Realtime streams & analytics widgets: ~15%
- Admin-configurable UI modules (layout blocks, flags): ~10%
- Notifications & experiments: ~5%
  Total backend-controlled surface: ~95% of critical functionality, exceeding the 60% target.

---

## 8) Design & Styling Guide (No gradients, sharp edges)

Theme

- Colors: primary `#CA8A04` (yellow-600), background `#000000`, surface `#1E1E1E`, text `#FFFFFF` or `#E5E7EB`.
- Typography: Inter or Poppins, bold headings, clear hierarchy.
- Spacing: modular scale, 4px grid. Borders minimal, no radii.

Tailwind and components

- Tailwind config: set `borderRadius: { none: '0px' }`, ensure components use `rounded-none` or omit rounded.\* classes.
- Replace any `rounded-*` with `rounded-none` across `components/ui`.
- Remove gradient utilities; prefer solid backgrounds.
- Buttons: solid yellow-600 on black; hover: darker yellow `#a16207`; text black on yellow for contrast.
- Cards: background `#1E1E1E`, border `#262626`, no elevation or subtle shadow only.
- Navbar/footer: black background, thin bottom border `#262626`.

Accessibility

- Maintain contrast ratios; consider `focus:outline` styles visible in yellow.

---

## 9) Admin Dashboard Specification

Widgets

- Realtime: active users, current live matches, tip performance in last 60 mins (SSE-driven).
- KPIs: MRR, subscribers, churn, token redemptions, top tips.
- Management tables: tips, users, payments, tokens, notifications queue, audit logs.
- Feature flags editor with variants and rollout percentages.

Actions & permissions

- Role-based access (ADMIN only). Audit log every change.
- Bulk operations: ban users, revoke tokens, publish/broadcast notifications.

---

## 10) Compliance & Security

- Account deletion: anonymize personal data, mark User.status=DELETED; revoke sessions.
- Privacy/Terms pages publicly accessible; link in footer.
- Responsible gaming: per-user limits (bets/day) and cooldown windows.
- Rate limiting via Redis (per-IP and per-user) on auth and write-heavy endpoints.
- Webhooks verified via Stripe signatures; idempotency keys for payment mutations.
- Secrets management via environment variables.

---

## 11) MVP Roadmap (Milestone-based)

1. Foundations
   - Prisma schema baseline, Postgres setup, Redis integration, auth/session model, rate limiting.
   - Tailwind theme hardening: black/yellow-600, remove gradients, rounded-none globally.
2. Tips & Public Site
   - Tips listing/detail, landing modules, about/terms/privacy/contact pages.
3. Auth & Profile
   - Signup/login/guest; profile update; responsible gaming limits.
4. VIP & Payments
   - Stripe subscription flow, webhook; VIP token redemption; access guards; VIP area pages.
5. Realtime
   - SSE infra, Redis pub/sub; live scores ingestion + feeds; realtime analytics endpoint.
6. Admin Suite
   - Admin dashboard, tips/users CRUD, tokens, payments view, broadcast, flags, audit logs.
7. Compliance & Notifications
   - Account deletion flow; FCM push; notification preferences.
8. Mobile (Flutter)
   - Implement main screens, auth, tips, SSE client; push notifications; VIP access.

---

## 12) Implementation Hints (Repo-aligned)

- Use existing route handlers under `app/api/*`; add new ones where noted.
- Use `lib/redis.ts` for Redis pub/sub; channels: `livescores`, `analytics`, `user:{id}`, `match:{id}`.
- Realtime endpoints should implement SSE with proper `Cache-Control: no-transform` and heartbeat pings.
- Extend `prisma/schema.prisma` with models above; run migrations; backfill admin account.
- Stripe: ensure `/api/webhooks/stripe` updates `Subscription` and `Payment` records; expose `/api/subscriptions/manage` for portal.
- UI: update `components/ui/*` to remove any rounded classes and gradients; enforce `rounded-none`.
- Navbar (`components/layout/navbar.tsx`): black background, thin border, yellow-600 accents for active links.

---

## 13) Folder Additions (to create)

- `app/(public)/about/page.tsx`, `terms`, `privacy`, `contact`
- `app/(auth)/dashboard/page.tsx`, `vip/area/page.tsx`, `history/page.tsx`, `notifications/page.tsx`, `profile/page.tsx`, `settings/page.tsx`, `account/delete/page.tsx`
- `app/admin/(pages)/index/page.tsx`, `tips/page.tsx`, `users/page.tsx`, `vip-tokens/page.tsx`, `payments/page.tsx`, `notifications/page.tsx`, `audit-logs/page.tsx`, `feature-flags/page.tsx`
- `app/api/vip/status/route.ts`, `app/api/vip/access/route.ts`, `app/api/subscriptions/manage/route.ts`, `app/api/users/delete/route.ts`, `app/api/notifications/prefs/route.ts`, `app/api/admin/flags/route.ts`, `app/api/admin/broadcast/route.ts`, `app/api/admin/audit-logs/route.ts`
- `workers/live-scores.ts` (or serverless cron handler)

---

## 14) Testing & Quality Gates

- Unit tests for tip access logic, subscription state transitions, token redemption.
- Integration tests for Stripe webhook idempotency and SSE endpoints (connection + heartbeat + event delivery).
- Lint/typecheck on every change; CI enforces build, lint, and minimal test suite.

Success criteria

- All MVP milestones verifiably functional.
- Admin can control tips, users, tokens, payments, analytics, flags.
- Realtime feeds visible on landing and admin dashboard.
- UI matches black/yellow theme, sharp edges, no gradients.

---

Appendix: Event Taxonomy

- `match_update`, `match_event`, `analytics`, `tip_created`, `tip_result`, `notification` with standard envelope:
  `{ type, topic, data, ts }`
