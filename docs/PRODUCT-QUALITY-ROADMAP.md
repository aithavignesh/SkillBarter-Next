# SkillBarter Product Quality Roadmap

Updated: 2026-11-07

## Product direction

Build the most dependable place for people to teach one skill and learn another. Optimize for successful, safe, repeatable skill exchanges—not vanity registrations, decorative UI, or feature count.

The current architecture is fixed:
- Frontend: Next.js
- API: Express.js
- Database: MongoDB

This roadmap does not authorize a stack change, production cutover, destructive data migration, or changes to the legacy production system.

## Product principles

1. **Make the first successful exchange obvious.** Reduce onboarding friction, explain what makes a useful skill listing, and guide a new member from profile completion to a relevant reciprocal match and a first exchange.
2. **Make marketplace liquidity visible.** Focus discovery on relevant supply in a useful category, availability, session format, and time zone. Measure whether members find suitable partners, not just how many accounts exist.
3. **Earn trust at every step.** Clearly show what profile details are verified, give members privacy controls, make block/report easy to find, explain exchange states, and provide a fair path to resolve cancellations or disputes. Never imply a member is identity-verified merely because their email or phone is verified.
4. **Keep the experience honest.** No fake reviews, fabricated match scores, misleading availability, dead buttons, or routes that masquerade as implemented features.
5. **Design mobile-first and accessibly.** Meet WCAG 2.2 AA as a target using keyboard and screen-reader checks alongside automation. Ensure reflow, visible focus, clear labels/errors, adequate touch targets, contrast, and reduced-motion support.
6. **Protect member data.** Enforce authorization server-side, validate inputs, rate-limit sensitive flows, minimize personal data exposure, and audit privileged moderation actions.
7. **Ship small, verified increments.** Every change needs tests, reviewable diffs, CI, and staging verification before it is called complete.

## Priority workstreams

### P0 — Release correctness and safety

- Verify the onboarding email-verification fix on the merged development commit, including an unverified test account completing onboarding and then being denied access to a protected feature until verification.
- Verify registration, login, logout, refresh, email verification, password reset, and OTP behavior with controlled test accounts and real delivery evidence.
- Complete a real staging two-member journey: register, complete profiles, list offered/wanted skills, discover a reciprocal match, request and accept an exchange, schedule, message, complete, and review.
- Audit server-side authorization for exchange participants, conversations, reviews, admin endpoints, blocks, and reports.
- Restrict MongoDB network access to verified service egress; do not leave broad public access in place.
- Confirm backups, restore procedure, environment separation, secret handling, rate limits, and operational alerts before any production cutover.
- Keep the legacy production repository and database untouched.

### P1 — Core marketplace experience

- Finish legacy-to-Next.js visual and interaction parity for the landing page, auth, onboarding, dashboard, discover, exchange workspace, messages, profiles, notifications, community, safety, and admin.
- Replace compatibility redirects with real implementations where a route represents a distinct user task. A route returning HTTP 200 is not proof of feature completion.
- Improve skill entry with examples, category guidance, proficiency descriptions, and useful goals.
- Make match explanations transparent: show which offered/wanted skills overlap and why a member is recommended.
- Add complete loading, empty, error, retry, and success states.
- Ensure conversation and exchange status changes are clear, timely, and recoverable.
- Verify mobile navigation and all primary workflows at narrow, medium, and wide viewports.

### P2 — Trust, quality, and retention

- Make email/phone verification status explicit and distinct from identity verification.
- Surface review context (completed exchange, date, and relevant skill) without exposing private conversation content.
- Give members clear privacy settings and control over profile visibility.
- Improve report/block flows with confirmation, status feedback, and moderation auditability.
- Add accessible notifications and consistent support entry points.
- Add account export/deletion workflows only after retention, audit, and legal requirements are defined.

### P3 — Marketplace growth and operations

- Start with a focused set of skills and member cohorts where reciprocal matches can actually happen; avoid spreading early supply too thinly.
- Provide operational tools to identify empty skill categories, slow responses, unaccepted requests, and inactive listings.
- Introduce carefully measured onboarding guidance and lifecycle messaging; avoid spam.
- Consider referrals, group learning, structured learning paths, or paid features only after core exchange completion and trust metrics are healthy.
- Do not introduce payments or escrow until the business model, legal obligations, refunds, disputes, tax, and provider onboarding are explicitly designed.

## Success metrics

Use a cohort-based dashboard and define each event once in the shared analytics contract.

### North-star metric

**Successful completed skill exchanges per active member cohort**, with completion confirmed by both participants where the product rules require it.

### Funnel and marketplace health

- Registration-to-onboarding completion rate.
- Percentage of profiles with at least one meaningful offered skill and one wanted skill.
- Time to first relevant reciprocal match.
- Search/discovery-to-exchange-request conversion.
- Request acceptance rate and median time to response.
- Scheduled-to-completed exchange rate.
- Cancellation and dispute rates, segmented by reason.
- Repeat exchange rate within 30/60 days.
- Member retention by cohort and skill category.

### Trust and quality guardrails

- Reports and blocks per 100 active members, reviewed with context rather than optimized downward blindly.
- Median time to acknowledge and resolve safety reports.
- Unauthorized-access and abuse signals.
- Email/OTP delivery success and verification completion.
- API error rate, latency, availability, and failed background jobs.
- Accessibility defects by severity and workflow.

Do not publish match-quality percentages, trust scores, or conversion claims unless the calculation and source data are documented.

## Definition of done

A feature is complete only when:
- The user-facing task works end-to-end, not just its route.
- Authorization, validation, failure, empty, loading, and success states are covered.
- Responsive behavior is checked on mobile, tablet, and desktop.
- Keyboard navigation, focus visibility, labels, contrast, and status announcements are checked.
- Relevant automated tests pass; high-risk flows also receive manual staging checks.
- Typecheck, lint, production build, and CI pass on the exact merged commit.
- Staging behavior and deployment are verified.
- Documentation and analytics events are updated where relevant.

## External references

- W3C, WCAG 2.2: https://www.w3.org/TR/WCAG22/
- W3C, WCAG 2.2 mobile guidance: https://www.w3.org/TR/wcag2mobile-22/
- GOV.UK Service Manual, understanding WCAG: https://www.gov.uk/service-manual/helping-people-to-use-your-service/understanding-wcag
- Stripe, Two-Sided Marketplace Strategy (2026): https://stripe.com/resources/more/two-sided-marketplace-strategy
- Consumer Reports, Marketplace Safety by Design: https://www.consumerreports.org/safety-by-design/

These are design and operational references, not claims that SkillBarter currently conforms to every recommendation.
