# SkillBarter UI parity plan

Date: 2026-10-31

## Goal

Carry the already-developed SkillBarter UI into SkillBarter-Next without asking the team to redesign or repeat completed UI work. Treat the legacy app as the visual and interaction reference; adapt implementation details only where Next.js or the new Express/MongoDB backend requires it.

## Repositories and safety

- Reference only: `aithavignesh/SkillBarter`, branch `main`.
- Migration target: `aithavignesh/SkillBarter-Next`, branch `development`.
- Do not commit changes to the legacy repository or promote to production as part of this parity work.
- Reuse design and interactions, not legacy backend/data access or authentication implementation.

## Initial source inspection

- Legacy app router composes `LandingPage`, `DiscoverPage`, `FeedPage`, `ExchangesPage`, `ExchangeWorkspacePage`, `MessagesPage`, `CommunityPage`, profile pages, and other existing screens.
- Legacy shared navigation includes expandable sidebar groups, active route state, search, notification dropdown, profile menu, theme switching, and mobile navigation. Preserve these established interactions where present.
- Legacy landing page contains a three-step explainer, feature cards, exchange-type cards, and FAQs.
- The Next app currently has its own landing page, a top horizontal navbar, and separately implemented dashboard/discover pages. This is not proof of visual parity; these screens must be reconciled against the legacy reference rather than redesigned from scratch.

## Parity checklist

### Shared shell and navigation
- [ ] Match legacy logo/brand treatment, spacing, typography, colors, and content widths.
- [ ] Reuse the established authenticated sidebar/navigation hierarchy and expandable groups where it is the legacy app's signed-in shell.
- [ ] Preserve whole-row expand/collapse, accurate chevron state, active-item highlight, and restrained hover feedback.
- [ ] Preserve notification, profile, theme, logout, mobile-menu, and responsive navigation behavior where supported.
- [ ] Ensure keyboard focus and accessible labels remain usable.

### Screen-by-screen comparison
- [ ] Public landing page: sections, copy hierarchy, CTAs, feature cards, FAQs, and responsive behavior.
- [ ] Login, registration, email verification, forgot/reset password: match existing UI while using the new auth API.
- [ ] Onboarding: same step sequence, progress feedback, field layout, validation and mobile behavior.
- [ ] Dashboard/feed: same page shell, spacing, cards, empty/loading/error states.
- [ ] Discover/matching: search, category/filter controls, grid/map behavior where present, match cards and proposal modal.
- [ ] Exchanges/workspace: statuses, details, schedule/session interactions, completion and reviews.
- [ ] Messages/conversations: list/detail layout, loading/empty states and mobile behavior.
- [ ] Profiles, skills, notifications, community, safety/report/block and admin screens.
- [ ] Settings, theme behavior, footer and responsive breakpoints.

### Integration and regression
- [ ] Replace legacy service calls with typed SkillBarter-Next API calls without changing the intended user-facing flow.
- [ ] Verify loading, empty, error, validation and success states on every migrated screen.
- [ ] Check no broken links, dead buttons, console errors or horizontal overflow at mobile/tablet/desktop sizes.
- [ ] Run lint, typecheck, tests and production build after each parity batch.
- [ ] Use screenshots from both apps at matching viewport sizes for visual comparison before declaring a screen matched.

## Implementation order

1. Shared shell/navigation and global typography/spacing.
2. Public landing page and authentication screens.
3. Onboarding and dashboard.
4. Discover/matching and exchange flow.
5. Messaging, profiles, notifications, community, safety and admin.
6. Responsive and accessibility regression.

## Release note

This is a parity checklist, not a claim that parity has already been achieved. Do not mark a screen complete solely because a route exists. Mark it complete after visual comparison and interaction checks. Backend deployment, email delivery and two-account end-to-end verification remain separate release gates.
