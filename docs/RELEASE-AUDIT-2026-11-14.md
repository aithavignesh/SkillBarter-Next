# SkillBarter-Next release evidence audit

Audit date: 2026-11-14  
Audited development commit: `884867d83cc99020da2f23a844cbe6d100faa915`

This report separates current, directly observed evidence from release criteria that remain unverified. A green test suite or frontend preview alone is not release sign-off.

## Repository, branches and pull requests

- Target repository: [aithavignesh/SkillBarter-Next](https://github.com/aithavignesh/SkillBarter-Next), default branch `main`.
- New repository `main`: `e3c556fbc25df68ff129a3eeca447c8761c0470e` (unchanged during this audit).
- Current `development`: `884867d83cc99020da2f23a844cbe6d100faa915`.
- PR [#66](https://github.com/aithavignesh/SkillBarter-Next/pull/66), documentation-only release evidence refresh, was merged to `development` after its PR-head CI run [43407348649](https://github.com/aithavignesh/SkillBarter-Next/actions/runs/43407348649) and browser audit [43407348640](https://github.com/aithavignesh/SkillBarter-Next/actions/runs/43407348640) both passed on head SHA `8c5a8082239429d6b53aaa3d4a5d2278d18250ed`.
- The merge triggered current-commit CI run [43581092490](https://github.com/aithavignesh/SkillBarter-Next/actions/runs/43581092490) and browser audit [43581092497](https://github.com/aithavignesh/SkillBarter-Next/actions/runs/43581092497). Both were still `in_progress` when this report was written; do not claim current-commit green status until they complete successfully.
- Previous development commit `72759d407b401b43dc5a125936034db1f4656ef1` had successful CI [43405810009](https://github.com/aithavignesh/SkillBarter-Next/actions/runs/43405810009) and responsive axe/browser smoke [43405810206](https://github.com/aithavignesh/SkillBarter-Next/actions/runs/43405810206).
- GitHub branch metadata reports `protected: false` for new-repository `main` and `development`; repository rulesets returned an empty list. Branch-protection detail reads returned 403 to this integration. Required branch safeguards are not evidenced.
- Legacy repository [aithavignesh/SkillBarter](https://github.com/aithavignesh/SkillBarter) `main` remains `e167793465ab638824d4fd066a70556ad9a1de41` and reports `protected: false`.

## Architecture and automated checks

- Root npm workspaces are `frontend`, `backend`, and `shared`. The frontend package is Next.js; the backend package depends on Express and Mongoose. The requested Next.js + Express.js + MongoDB architecture remains intact.
- The last fully green development CI run on SHA `72759d407b401b43dc5a125936034db1f4656ef1` covered dependency audit, shared build, typecheck, lint, tests and production build.
- The current merged development SHA `884867d83cc99020da2f23a844cbe6d100faa915` has new CI and browser runs in progress, not yet verified green.
- Browser smoke uses Playwright/axe and configured routes at 375px, 768px and 1440px. It uses mocked API fixtures; it is not a live-backend E2E run, manual keyboard/screen-reader assessment, or complete WCAG 2.2 AA sign-off.

## UI migration and parity

- The current route tree contains 40 Next.js `page.tsx` files. Page count does not prove screen-by-screen implementation or parity.
- [UI-PARITY-PLAN.md](https://github.com/aithavignesh/SkillBarter-Next/blob/development/docs/UI-PARITY-PLAN.md) still has 19 unchecked items and zero checked items. Matched-viewport screenshots and screen-by-screen interaction evidence against the legacy application have not been recorded.
- The legacy catch-all route [frontend/src/app/[...legacy]/page.tsx](https://github.com/aithavignesh/SkillBarter-Next/blob/development/frontend/src/app/%5B...legacy%5D/page.tsx) maps multiple old screen identifiers to shared destinations (for example, learning-goals/teaching-skills to `/skills`, advanced-search to `/discover`, AI-matching to `/matches`, and privacy/account-settings to `/settings`). These mappings preserve some deep links but do not by themselves prove each distinct legacy screen's controls and state are implemented.
- Workshop paths are handled by the dynamic `frontend/src/app/workshops/[id]/page.tsx` component: it provides workshop listing, member-specific listing, and an explicitly disabled create/publish state. Workshop publishing remains disabled until a backend premium-entitlement check is verified. The detail view is separately implemented at `/workshops/workshop-details`.
- Release gate: complete visual comparison and real interaction checks for every migrated screen, including loading, empty, error and success states, plus proof that aliases resolve to meaningful supported views rather than silently collapsing required workflows.

## Authentication, messaging, safety and administration

- Backend tests cover unverified-user onboarding completion while keeping protected features locked until email verification, and cover admin role boundaries, block enforcement and profile privacy.
- The two-user lifecycle test in `backend/tests/integration.test.ts` exercises registration, unverified onboarding, verification, matching, exchange request/acceptance, scheduling, messaging, completion, reviews, report/block behavior and admin access.
- Test setup in `backend/tests/setup.ts` starts `MongoMemoryServer`; therefore the lifecycle test uses isolated in-memory MongoDB, not live staging accounts or the staging Atlas database.
- Resend email and 2Factor SMS provider integrations exist in code. This audit has no actual recipient inbox/SMS handset delivery evidence, no provider delivery receipt, and no live staging OTP verification. Atlas currently has zero OTP challenge records.
- Live staging verification of verified/unverified onboarding gates, admin/non-admin authorization, moderation/report handling, blocks and profile privacy remains outstanding.

## Atlas development database and network security

- Atlas project: `SkillBarter-Next-Development`; cluster: `skillbarter-dev` (FREE, AWS `AP_SOUTH_1`, MongoDB `8.0.37`, state `IDLE`).
- Database inspected read-only: `skillbarter`; 17 collections.
- Current collection counts: users 7; skills 38; userSkills 6; analyticsEvents 12.
- Current counts are zero for exchanges, exchangeSessions, conversations, messages, reviews, reports, blocks, otpChallenges, notifications, communityposts, connections, auditlogs and authcooldowns.
- Database user `skillbarter_app` has `readWrite` on only the `skillbarter` database and is scoped to `skillbarter-dev`.
- Atlas network access still includes `0.0.0.0/0` (comment: “Render staging backend; restrict to fixed egress IPs when available”). This is an open network rule and a release security blocker. Do not narrow it until the actual staging service's supported outbound IPs are confirmed.

## Deployment and staging

- Vercel project [skillbarter-next-preview](https://vercel.com/aithavignesh/skillbarter-next-preview) reports `live: false`.
- Latest READY development preview [AqLfbPqis3FXwqd5CmhRq2K6dC3H](https://vercel.com/aithavignesh/skillbarter-next-preview/AqLfbPqis3FXwqd5CmhRq2K6dC3H) is sourced from `development` SHA `72759d407b401b43dc5a125936034db1f4656ef1`, not the current merged development SHA `884867d83cc99020da2f23a844cbe6d100faa915`. It is a preview (`target: null`), not backend staging or production.
- `render.yaml` declares a development-only service named `skillbarter-next-api-staging`, deploy trigger `checksPass`, and health check `/api/v1/ready`. This manifest is not evidence of the actual service configuration or active deployment.
- The Render account's workspace list returned a workspace named `My Workspace`. The Render integration requires the user to select/confirm a workspace before service reads; no workspace was selected in this non-interactive audit. Therefore the actual Render service, active deploy SHA, health response, runtime environment and backend-to-Atlas connectivity were not verified.
- Release gate: verify a live backend staging deployment on the exact audited SHA and confirm its readiness endpoint reports database connectivity and matching commit metadata.

## Real two-user journey

- The synthetic Alice/Bob lifecycle is automated, but it runs against the in-memory test database.
- The inspected Atlas development database has zero exchanges, sessions, conversations, messages and reviews. No real two-account staging journey has been demonstrated from registration through matching, request/acceptance, scheduling, messaging, completion and reviews.

## Production protection and data migration scope

- New repository `main` remains at `e3c556fbc25df68ff129a3eeca447c8761c0470e`.
- Legacy repository `main` remains at `e167793465ab638824d4fd066a70556ad9a1de41`.
- This audit inspected only the SkillBarter-Next development Atlas project. No production branch, production deployment, legacy production database, or new-repository production database was modified.
- No historical PostgreSQL-to-MongoDB data migration is claimed. Keep the legacy production database untouched; handle any historical import as a separately scoped and reviewed migration.

## Decision

**NOT RELEASE-READY.** Continue reversible development on feature branches and `development`. Do not promote to production until every release gate above has direct, current evidence, including full UI parity, green checks on the exact candidate SHA, verified live backend staging, actual email/SMS delivery, hardened Atlas networking, manual accessibility assessment, and a real two-user staging lifecycle.
