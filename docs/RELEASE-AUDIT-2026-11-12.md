# SkillBarter-Next release evidence audit

Audit date: 2026-11-12  
Audited working commit: `681248de8ac0af861aba8179779a34f7dfedf04e` on `development`

This document separates verified evidence from release gates that remain unverified. A green CI run or a READY frontend preview is not, by itself, a release sign-off.

## Verified repository and CI evidence

- Repository: [aithavignesh/SkillBarter-Next](https://github.com/aithavignesh/SkillBarter-Next); default branch is `main`.
- `main` head: `e3c556fbc25df68ff129a3eeca447c8761c0470e`.
- `development` head: `681248de8ac0af861aba8179779a34f7dfedf04e`.
- Latest open pull-request query returned no open PRs at audit time.
- CI run [42995318447](https://github.com/aithavignesh/SkillBarter-Next/actions/runs/42995318447) completed successfully on the audited development SHA. Its `verify` job passed. The workflow includes the high/critical npm audit gate, shared package build, typecheck, lint, test suite and production build.
- Browser smoke run [42995318489](https://github.com/aithavignesh/SkillBarter-Next/actions/runs/42995318489) completed successfully on the same SHA. Its `browser-a11y` job passed.
- The browser audit covers the route list in `frontend/tests/a11y-smoke.mjs` at 375px, 768px and 1440px viewports with axe. It installs fixture API responses in the browser; it is not a live backend end-to-end run or a manual WCAG 2.2 AA assessment.
- The repository contains 40 Next.js `page.tsx` files, including the legacy catch-all route and dynamic workshop routes. Page-file count is not proof that all legacy screens are visually and functionally equivalent.

## Verified preview and architecture evidence

- Vercel project: [skillbarter-next-preview](https://vercel.com/aithavignesh/skillbarter-next-preview).
- Latest deployment [3X7WpDx53HV2W3AfvS6GrgMu6fqu](https://vercel.com/aithavignesh/skillbarter-next-preview/3X7WpDx53HV2W3AfvS6GrgMu6fqu) is `READY`, sourced from `development` at the exact audited SHA `681248de8ac0af861aba8179779a34f7dfedf04e`. It is a preview deployment (`target: null`), not a production promotion.
- The development preview has a `BACKEND_API_URL` environment-variable entry configured for the `development` branch. Its encrypted value was not retrieved.
- The checked-in architecture remains Next.js + Express.js + MongoDB: the root npm workspaces are `frontend`, `backend` and `shared`; the backend uses Express and Mongoose.
- `render.yaml` declares a development-only staging service, `autoDeployTrigger: checksPass`, and `/api/v1/ready` as the health check. This manifest does not prove the actual Render service has matching settings or is running the audited SHA.

## Verified development database evidence

Atlas project: `SkillBarter-Next-Development`  
Cluster: `skillbarter-dev` (FREE, AWS `AP_SOUTH_1`, MongoDB 8.0.37, state `IDLE`)

- Database: `skillbarter`; 17 collections and 63 documents in the inspected database snapshot.
- Counts: users 7; skills 38; userSkills 6; analyticsEvents 12.
- Counts: exchanges 0; exchangeSessions 0; conversations 0; messages 0; reviews 0; reports 0; blocks 0; otpChallenges 0; notifications 0; communityPosts 0; connections 0; auditLogs 0; authCooldowns 0.
- Database user `skillbarter_app` is scoped to the `skillbarter-dev` cluster and has `readWrite` on the `skillbarter` database.
- The Atlas access list contains `0.0.0.0/0` with the comment “Render staging backend; restrict to fixed egress IPs when available”. This is an open network rule and remains a release security blocker.

## Release gates not yet verified

1. **UI parity:** Every screen in `docs/UI-PARITY-PLAN.md` remains unchecked. The required matched-viewport screenshots and screen-by-screen interaction evidence have not been recorded. Workshop publishing is explicitly disabled in the current UI until a backend premium-entitlement check exists.
2. **Authentication and onboarding:** Automated backend tests cover unverified-user onboarding completion and verification gates for protected features. Live staging behavior has not been demonstrated.
3. **Email and OTP delivery:** Resend and 2Factor integrations exist in code, but no actual recipient inbox/SMS handset delivery evidence is recorded for staging.
4. **Admin, safety and privacy:** Backend tests cover admin authorization, block enforcement and profile privacy. Live staging role-boundary, report moderation and block/privacy workflows have not been demonstrated.
5. **Render staging:** The Render connector workspace was not selected for this audit, so the actual service configuration, active deploy SHA, health/readiness responses, environment configuration and database connection could not be independently verified. Do not infer these from `render.yaml` or the Vercel preview.
6. **Real two-user lifecycle:** The development database currently has no exchanges, sessions, conversations, messages or reviews. The automated Alice/Bob integration test uses synthetic test accounts; it is not evidence of a real two-account staging journey.
7. **Accessibility:** Automated axe/browser smoke passed, but manual keyboard/screen-reader testing and full WCAG 2.2 AA verification remain outstanding.
8. **Network hardening:** Replace the Atlas `0.0.0.0/0` entry only after the actual staging service's supported outbound IP ranges are verified. Do not guess ranges or risk locking out the backend.
9. **Branch safeguards:** GitHub branch metadata reports `protected: false` for both `main` and `development`. The branch-protection read endpoint was unavailable to this integration. Older progress notes claiming that `main` is protected must not be treated as current evidence.

## Legacy data scope

The existing cutover note states that importing historical PostgreSQL records is a separate scope unless preserving old user/exchange records is explicitly required. This release audit therefore makes no claim that legacy data has been migrated and does not treat historical-data migration as a release gate. Keep the legacy production database untouched; define a separate, reviewed migration plan only if historical records become an explicit requirement.

## Production protection

- New repository `main` remains at `e3c556fbc25df68ff129a3eeca447c8761c0470e`.
- Legacy repository [aithavignesh/SkillBarter](https://github.com/aithavignesh/SkillBarter) `main` remains at `e167793465ab638824d4fd066a70556ad9a1de41`.
- No production branch, production deployment or production database was modified during this audit.

## Decision

**NOT RELEASE-READY.** Keep development work on feature branches and `development`. Do not promote to production until every gate above has direct, current evidence, including the complete real two-user staging journey and hardened Atlas networking.
