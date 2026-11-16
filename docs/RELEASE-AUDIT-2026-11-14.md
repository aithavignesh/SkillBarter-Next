# SkillBarter-Next release evidence audit

Audit date: 2026-11-16  
Audited development commit: `34af94f44d1ffbed4a592efd44e16742e66187e4`

This report separates directly observed evidence from release criteria that remain unverified. A green PR test suite or frontend preview alone is not release sign-off.

## Repository, architecture and branch safety

- New repository: [aithavignesh/SkillBarter-Next](https://github.com/aithavignesh/SkillBarter-Next), default branch `main`.
- Root npm workspaces are `frontend`, `backend`, and `shared`. The frontend is Next.js; the backend is Express.js and uses Mongoose with MongoDB. The required architecture remains Next.js + Express.js + MongoDB.
- New repository `main` remains at `e3c556fbc25df68ff129a3eeca447c8761c0470e`.
- Legacy repository [aithavignesh/SkillBarter](https://github.com/aithavignesh/SkillBarter) `main` remains at `e167793465ab638824d4fd066a70556ad9a1de41`.
- PR [#68](https://github.com/aithavignesh/SkillBarter-Next/pull/68) restored server-side email-verification gates while allowing unverified users to complete onboarding. It was merged into `development` after its exact PR-head checks passed. Merge commit: `34af94f44d1ffbed4a592efd44e16742e66187e4`.
- PR-head CI [43700129335](https://github.com/aithavignesh/SkillBarter-Next/actions/runs/43700129335) passed dependency audit, shared build, typecheck, lint, backend/frontend tests and production build. PR-head browser accessibility smoke [43700129336](https://github.com/aithavignesh/SkillBarter-Next/actions/runs/43700129336) passed.
- New push-triggered CI [43844462945](https://github.com/aithavignesh/SkillBarter-Next/actions/runs/43844462945) and browser accessibility run [43844462875](https://github.com/aithavignesh/SkillBarter-Next/actions/runs/43844462875) were still in progress when this audit was updated. Do not call the merged development SHA green until both finish successfully.
- Branch-protection detail reads for new `main`, new `development`, and legacy `main` returned 403 to this integration. Current required-check protection settings are therefore not independently verified.

## Authentication, onboarding, email and OTP

- The merged auth change sets new accounts to `isEmailVerified=false`, creates an expiring verification token, and attempts verification-email delivery through the configured Resend integration.
- `/api/v1/auth/me` and `/api/v1/users/onboarding` use the onboarding-specific authentication middleware. This permits an unverified member to finish onboarding and read their own session.
- Normal protected APIs continue to require verified email. The onboarding authorization regression test verifies that an unverified member can complete onboarding but receives `EMAIL_NOT_VERIFIED` on matching until verified.
- Admin promotion now rejects an unverified target; automatic platform-owner promotion also requires verified email. Bootstrap-admin remains a separate secret-gated operation.
- Email and 2Factor SMS OTP provider integrations exist in code, including resend cooldowns and challenge expiry/attempt limits. This audit has no actual recipient inbox, handset, provider delivery receipt, or live staging OTP verification evidence.
- Live staging verification of both verified and unverified account flows and admin/non-admin role boundaries remains outstanding.

## UI migration, responsiveness and accessibility

- The development route tree contains 40 Next.js `page.tsx` files. Page count does not establish screen-by-screen implementation or parity.
- [UI-PARITY-PLAN.md](https://github.com/aithavignesh/SkillBarter-Next/blob/development/docs/UI-PARITY-PLAN.md) still has 19 unchecked items and zero checked items.
- The legacy catch-all route [frontend/src/app/[...legacy]/page.tsx](https://github.com/aithavignesh/SkillBarter-Next/blob/development/frontend/src/app/%5B...legacy%5D/page.tsx) redirects several distinct legacy screen identifiers to shared destinations (for example, learning-goals/teaching-skills to `/skills`, advanced-search to `/discover`, AI-matching to `/matches`, and privacy/account-settings to `/settings`). These redirects preserve some deep links but do not prove that each original screen's controls, state and workflow are implemented.
- Automated Playwright/axe smoke checks audit configured routes at mobile, tablet and desktop widths. The browser suite uses mocked API fixtures; it is not live-backend E2E, matched-viewport visual comparison against the legacy app, manual keyboard/screen-reader assessment, or complete WCAG 2.2 AA sign-off.
- Workshop publishing remains disabled pending verified backend entitlement handling.
- Release gate: finish the screen-by-screen parity checklist with matched screenshots and real interaction/state checks, then complete manual accessibility assessment.

## Admin, blocks, reports and privacy

- Backend regression tests cover admin role boundaries, report moderation, block enforcement and profile privacy.
- These tests are not proof of live staging authorization, report handling, block visibility enforcement, or privacy behavior. Real staging accounts and moderation actions have not been demonstrated.
- The development database currently contains no report or block records.

## MongoDB Atlas development database and network security

- Atlas project: `SkillBarter-Next-Development`; cluster: `skillbarter-dev` (FREE, AWS `AP_SOUTH_1`, MongoDB `8.0.37`, state `IDLE`).
- Read-only inspection of development database `skillbarter`: 17 collections.
- Current counts: users 7; skills 39; userSkills 8; connections 1; notifications 1; analyticsEvents 31.
- Current counts are zero for exchanges, exchangeSessions, conversations, messages, reviews, reports, blocks, otpChallenges, communityposts, auditlogs and authcooldowns.
- Atlas user `skillbarter_app` has `readWrite` on only the `skillbarter` database and is scoped to the `skillbarter-dev` cluster.
- Atlas network access still contains `0.0.0.0/0`. This is an open network rule and a release security blocker. Do not narrow it until the actual staging service's supported outbound IPs are confirmed.

## Vercel preview and Render staging

- Vercel project: [skillbarter-next-preview](https://vercel.com/aithavignesh/skillbarter-next-preview); project metadata reports `live: false`.
- The Vercel deployment associated with the audited development SHA `34af94f44d1ffbed4a592efd44e16742e66187e4` is [Th57uqnHagPi8HcLeHvxNncQY3eC](https://vercel.com/aithavignesh/skillbarter-next-preview/Th57uqnHagPi8HcLeHvxNncQY3eC), state `CANCELED`, target `null`. The latest READY development preview is on the earlier SHA `b40fdce6973a19a7254332302d711bd1ce284001`, not the audited commit.
- The checked-in `render.yaml` declares a development-only service, `autoDeployTrigger: checksPass`, and health check `/api/v1/ready`. This manifest alone does not prove that the actual Render service has matching settings or is running.
- Render's service-read path requires a workspace explicitly confirmed by the user. No workspace was confirmed in this non-interactive run, so the actual service configuration, active deployment SHA, health/readiness response, runtime environment, and backend-to-Atlas connectivity were not verified.
- No exact-commit live backend staging deployment is established by the available evidence.

## Real two-user journey

- The automated Alice/Bob lifecycle test uses `MongoMemoryServer`; it is synthetic integration coverage, not real staging evidence.
- The inspected Atlas development database has zero exchanges, exchange sessions, conversations, messages and reviews. No real two-account staging journey has been demonstrated from registration through matching, request/acceptance, scheduling, messaging, completion and reviews.

## Production protection and data migration scope

- The new repository `main` and legacy repository `main` SHAs listed above remain unchanged after the development-only auth merge.
- This audit inspected only the SkillBarter-Next development Atlas project. No production branch, production deployment, legacy production database, or new-repository production database was modified.
- No historical PostgreSQL-to-MongoDB data migration is claimed. Keep the legacy production database untouched; handle any historical import as a separately scoped and reviewed migration.

## Decision

**NOT RELEASE-READY.** Continue reversible development on feature branches and `development`. Do not promote to production until all criteria have direct, current evidence: complete UI parity; green CI on the exact candidate SHA; verified live backend staging on that SHA; actual email/SMS delivery; hardened Atlas networking; live admin, blocks, reports and privacy checks; manual accessibility assessment; and the complete real two-user staging lifecycle.
