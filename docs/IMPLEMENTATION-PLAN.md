# Implementation plan

## Milestone 0 — Foundation
- [x] Initialize repository documentation and development branch.
- [x] Establish npm workspace layout and shared Zod contracts.
- [x] Add Express health endpoint and Next.js landing page.
- [ ] Install dependencies and run typecheck, lint, tests, and production builds locally.
- [ ] Verify local MongoDB connection and health/readiness behavior.

## Milestone 1 — Identity
- [ ] User model and account lifecycle.
- [ ] Signup and login with secure password hashing.
- [ ] Short-lived access tokens and rotated refresh sessions.
- [ ] Email verification and password reset provider integration.
- [ ] Optional phone verification provider integration.
- [ ] Rate limiting, lockout strategy, audit events, and auth tests.

## Milestone 2 — Profiles and skills
- [ ] Profile and privacy settings.
- [ ] Avatar storage provider abstraction.
- [ ] Offered/wanted skills and categories.
- [ ] Search, filters, and pagination.

## Milestone 3 — Matching and exchanges
- [ ] Matching rules and discovery.
- [ ] Exchange request, accept, decline, cancel.
- [ ] Scheduling and lifecycle transitions.
- [ ] Completion and review workflow.

## Milestone 4 — Communication and trust
- [ ] Conversations and messages.
- [ ] Notifications.
- [ ] Reviews, trust/reliability metrics, badges.
- [ ] Connections and community features.

## Milestone 5 — Safety and operations
- [ ] Report/block/moderation.
- [ ] Admin RBAC and audit logs.
- [ ] Analytics events and dashboards.
- [ ] Security and abuse testing.

## Milestone 6 — Release readiness
- [ ] CI checks and full integration tests.
- [ ] Staging deployment and smoke tests.
- [ ] Data migration plan and reconciliation, if approved.
- [ ] Backup, rollback, monitoring, and production cutover review.
