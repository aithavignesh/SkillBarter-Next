import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const baseUrl = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const routes = [
  "/", "/about", "/login", "/register", "/signup", "/forgot-password",
  "/reset-password?token=invalid", "/verify-email", "/onboarding", "/dashboard",
  "/discover", "/matches", "/matches/507f1f77bcf86cd799439033", "/matches/507f1f77bcf86cd799439033", "/exchanges", "/exchanges?view=incoming", "/exchanges?view=sent", "/exchanges?status=ACTIVE", "/exchanges?status=COMPLETED", "/exchanges/507f1f77bcf86cd799439011", "/exchanges/507f1f77bcf86cd799439013", "/exchanges/active-exchange",
  "/exchanges/exchange-history", "/exchanges/exchange-rating", "/exchanges/schedule", "/exchanges/calendar",
  "/messages", "/messages/507f1f77bcf86cd799439011", "/messages/chat-details", "/notifications",
  "/profile", "/profile/edit", "/profile/507f1f77bcf86cd799439011", "/profile/edit-profile",
  "/profile/public-profile", "/profile/skills", "/profile/add-skill", "/skills", "/community", "/community/posts/507f1f77bcf86cd799439029",
  "/connections", "/feed", "/monetization", "/settings", "/safety", "/trust",
  "/admin", "/feedback", "/invite", "/support/faq", "/support/support",
  "/screens",
  "/screens/dashboard",
  "/screens/edit-profile",
  "/screens/public-profile",
  "/screens/skills",
  "/screens/add-skill",
  "/screens/learning-goals",
  "/screens/teaching-skills",
  "/screens/search",
  "/screens/advanced-search",
  "/screens/recommended",
  "/screens/ai-matching",
  "/screens/match-details",
  "/screens/match-details/507f1f77bcf86cd799439033",
  "/screens/match-details/507f1f77bcf86cd799439033",
  "/screens/send-request",
  "/screens/incoming-requests",
  "/screens/sent-requests",
  "/screens/request-details",
  "/screens/request-details/507f1f77bcf86cd799439013",
  "/screens/active-exchange",
  "/screens/active-exchange/507f1f77bcf86cd799439013",
  "/screens/exchange-rating/507f1f77bcf86cd799439025",
  "/screens/public-profile/507f1f77bcf86cd799439014",
  "/screens/chat-details/507f1f77bcf86cd799439015",
  "/screens/workshop-details/507f1f77bcf86cd799439016",
  "/screens/exchange-history",
  "/screens/exchange-rating",
  "/screens/schedule",
  "/screens/calendar",
  "/screens/notifications",
  "/screens/notification-settings",
  "/screens/chat-details",
  "/screens/create-post",
  "/screens/post-details",
  "/screens/post-details/507f1f77bcf86cd799439029",
  "/screens/groups",
  "/screens/group-details",
  "/screens/workshops",
  "/screens/create-workshop",
  "/screens/workshop-details",
  "/screens/my-workshops",
  "/screens/credits",
  "/screens/premium",
  "/screens/verification",
  "/screens/support",
  "/screens/faq",
  "/screens/privacy",
  "/screens/account-settings",
  "/screens/activity",
  "/workshops/workshops",
  "/workshops/create-workshop",
  "/workshops/my-workshops",
  "/workshops/workshop-details?post=507f1f77bcf86cd799439011",
];
const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 }
];
const failures = [];
const browser = await chromium.launch({ headless: true });

function member(overrides = {}) {
  return {
    id: "507f1f77bcf86cd799439011",
    email: "a11y-member@example.com",
    displayName: "A11y Test Member",
    role: "owner",
    isEmailVerified: true,
    onboardingCompleted: true,
    reputationScore: 5,
    completedExchangesCount: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    bio: "A test profile used only by the browser audit.",
    location: "Remote",
    availability: "Flexible",
    preferredSessionFormat: "video",
    ...overrides
  };
}

function failure(status, code, message) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify({ success: false, error: { code, message } })
  };
}

function success(data, meta) {
  const payload = { success: true, data };
  if (meta) payload.meta = meta;
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(payload)
  };
}

const testExchangeId = "507f1f77bcf86cd799439013";
const testSessionStart = new Date();
testSessionStart.setHours(12, 0, 0, 0);
const testSessionEnd = new Date(testSessionStart.getTime() + 60 * 60 * 1000);
const testExchange = {
  id: testExchangeId,
  requesterId: "507f1f77bcf86cd799439011",
  requesterName: "A11y Test Member",
  recipientId: "507f1f77bcf86cd799439014",
  recipientName: "A11y Test Partner",
  offeredSkillId: "507f1f77bcf86cd799439016",
  offeredSkillName: "TypeScript",
  wantedSkillId: "507f1f77bcf86cd799439017",
  wantedSkillName: "Python",
  status: "ACCEPTED",
  proposalDescription: "A browser-test exchange for calendar rendering.",
  completionStatus: { requesterConfirmed: false, recipientConfirmed: false },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};
const testSession = {
  id: "507f1f77bcf86cd799439015",
  exchangeId: testExchangeId,
  proposedById: "507f1f77bcf86cd799439011",
  title: "Browser test session",
  startTime: testSessionStart.toISOString(),
  endTime: testSessionEnd.toISOString(),
  status: "CONFIRMED",
  notes: "A session fixture used only by the browser smoke test.",
  meetingLink: "https://example.com/meeting",
  createdAt: "2026-01-01T00:00:00.000Z"
};

const incomingExchange = {
  id: "507f1f77bcf86cd799439018",
  requesterId: "507f1f77bcf86cd799439019",
  requesterName: "Incoming Requester",
  recipientId: "507f1f77bcf86cd799439011",
  recipientName: "A11y Test Member",
  offeredSkillId: "507f1f77bcf86cd799439021",
  offeredSkillName: "JavaScript",
  wantedSkillId: "507f1f77bcf86cd799439022",
  wantedSkillName: "React",
  status: "PENDING",
  proposalDescription: "An incoming request fixture for inbox filtering.",
  completionStatus: { requesterConfirmed: false, recipientConfirmed: false },
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z"
};
const sentExchange = {
  id: "507f1f77bcf86cd799439020",
  requesterId: "507f1f77bcf86cd799439011",
  requesterName: "A11y Test Member",
  recipientId: "507f1f77bcf86cd799439021",
  recipientName: "Sent Request Recipient",
  offeredSkillId: "507f1f77bcf86cd799439023",
  offeredSkillName: "Python",
  wantedSkillId: "507f1f77bcf86cd799439024",
  wantedSkillName: "Data Science",
  status: "PENDING",
  proposalDescription: "A sent request fixture for inbox filtering.",
  completionStatus: { requesterConfirmed: false, recipientConfirmed: false },
  createdAt: "2026-11-02T10:00:00.000Z",
  updatedAt: "2026-11-02T10:00:00.000Z"
};
const completedExchange = {
  id: "507f1f77bcf86cd799439025",
  requesterId: "507f1f77bcf86cd799439011",
  requesterName: "A11y Test Member",
  recipientId: "507f1f77bcf86cd799439026",
  recipientName: "Completed Exchange Partner",
  offeredSkillId: "507f1f77bcf86cd799439027",
  offeredSkillName: "Python",
  wantedSkillId: "507f1f77bcf86cd799439028",
  wantedSkillName: "Data Science",
  status: "COMPLETED",
  proposalDescription: "A completed exchange fixture for history filtering.",
  completionStatus: { requesterConfirmed: true, recipientConfirmed: true },
  createdAt: "2026-10-20T10:00:00.000Z",
  updatedAt: "2026-10-21T10:00:00.000Z"
};
const testPost = {
  id: "507f1f77bcf86cd799439029",
  authorId: "507f1f77bcf86cd799439011",
  authorName: "A11y Test Member",
  authorAvatar: null,
  title: "A11y Test Post",
  content: "A community post fixture used to verify the dedicated post detail page.",
  tags: ["testing", "skills"],
  likesCount: 2,
  likedByMe: false,
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z"
};
const testMatch = {
  user: {
    id: "507f1f77bcf86cd799439033",
    displayName: "Match Detail Member",
    bio: "Happy to exchange practical skills.",
    avatarUrl: "",
    location: "Hyderabad",
    preferredSessionFormat: "video",
    availability: "Weekends",
    reputationScore: 4.6,
    completedExchangesCount: 2
  },
  compatibilityScore: 92,
  explanation: "Your React experience complements this member's Python teaching skills.",
  reciprocalMatch: true,
  theyTeachYouLearn: [
    { skillId: "507f1f77bcf86cd799439041", name: "Python", proficiency: "Advanced" }
  ],
  youTeachTheyLearn: [
    { skillId: "507f1f77bcf86cd799439042", name: "React", proficiency: "Intermediate" }
  ]
};
const testMatch = {
  user: {
    id: "507f1f77bcf86cd799439033",
    displayName: "Match Detail Member",
    bio: "Happy to exchange practical skills.",
    avatarUrl: "",
    location: "Hyderabad",
    preferredSessionFormat: "video",
    availability: "Weekends",
    reputationScore: 4.6,
    completedExchangesCount: 2
  },
  compatibilityScore: 92,
  explanation: "Your React experience complements this member's Python teaching skills.",
  reciprocalMatch: true,
  theyTeachYouLearn: [
    { skillId: "507f1f77bcf86cd799439041", name: "Python", proficiency: "Advanced" }
  ],
  youTeachTheyLearn: [
    { skillId: "507f1f77bcf86cd799439042", name: "React", proficiency: "Intermediate" }
  ]
};
const testExchanges = [testExchange, incomingExchange, sentExchange, completedExchange];

async function installAuthenticatedApi(page) {
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;

    if (path.endsWith("/auth/me")) {
      await route.fulfill(success({ user: member() }));
      return;
    }
    if (path === "/api/v1/community/posts/" + testPost.id) {
      await route.fulfill(success({ post: testPost }));
      return;
    }
    if (path === "/api/v1/matches/" + testMatch.user.id) {
      await route.fulfill(success({ match: testMatch }));
      return;
    }
    if (path === "/api/v1/matches/recommendations") {
      await route.fulfill(success([testMatch]));
      return;
    }
    if (path === "/api/v1/matches/" + testMatch.user.id) {
      await route.fulfill(success({ match: testMatch }));
      return;
    }
    if (path === "/api/v1/matches/recommendations") {
      await route.fulfill(success([testMatch]));
      return;
    }
    if (path === "/api/v1/exchanges/" + testExchangeId) {
      await route.fulfill(success({ exchange: testExchange }));
      return;
    }
    if (path === "/api/v1/exchanges/" + completedExchange.id) {
      await route.fulfill(success({ exchange: completedExchange }));
      return;
    }
    if (/\/users\/[a-f0-9]{24}$/.test(path) || /\/exchanges\/[a-f0-9]{24}$/.test(path)) {
      await route.fulfill(failure(404, "NOT_FOUND", "The requested record was not found"));
      return;
    }
    if (path.endsWith("/skills/user")) {
      await route.fulfill(success({ skills: [] }));
      return;
    }
    if (path.endsWith("/community/connections")) {
      await route.fulfill(success({ connections: [] }));
      return;
    }
    if (path.endsWith("/safety/blocked")) {
      await route.fulfill(success({ blockedUsers: [] }));
      return;
    }
    if (path.endsWith("/messages/conversations")) {
      await route.fulfill(success({ conversations: [] }));
      return;
    }
    if (path.includes("/reviews/user/")) {
      await route.fulfill(success({ reviews: [] }));
      return;
    }
    if (path.endsWith("/exchanges/" + testExchangeId + "/sessions")) {
      await route.fulfill(success({ sessions: [testSession] }));
      return;
    }
    if (path.endsWith("/exchanges/" + completedExchange.id + "/sessions")) {
      await route.fulfill(success({ sessions: [] }));
      return;
    }
    if (path.endsWith("/exchanges")) {
      await route.fulfill(success({ exchanges: testExchanges }));
      return;
    }
    if (path.endsWith("/notifications/unread-count")) {
      await route.fulfill(success({ unreadCount: 0 }));
      return;
    }
    if (path.endsWith("/admin/stats")) {
      await route.fulfill(success({
        stats: {
          totalUsers: 0,
          totalExchanges: 0,
          completedExchanges: 0,
          activeSessions: 0,
          totalSkills: 0,
          pendingReports: 0
        }
      }));
      return;
    }
    if (
      path.startsWith("/api/v1/admin/users") ||
      path.startsWith("/api/v1/admin/reports") ||
      path.startsWith("/api/v1/admin/audit-logs")
    ) {
      await route.fulfill(success([], { page: 1, limit: 20, total: 0, totalPages: 0 }));
      return;
    }
    
    await route.fulfill(success([]));
  });
}

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height }
  });
  const page = await context.newPage();
  await installAuthenticatedApi(page);

  const tabletCoreRoutes = new Set([
    "/", "/login", "/register", "/onboarding", "/dashboard", "/discover", "/matches", "/matches/507f1f77bcf86cd799439033", "/screens/match-details/507f1f77bcf86cd799439033",
    "/exchanges", "/exchanges/507f1f77bcf86cd799439013", "/screens/exchange-rating/507f1f77bcf86cd799439025", "/exchanges/calendar", "/screens/calendar", "/screens/schedule",
    "/messages", "/community/posts/507f1f77bcf86cd799439029", "/screens/post-details/507f1f77bcf86cd799439029", "/profile/edit", "/settings", "/safety", "/admin"
  ]);
  const routesForViewport = viewport.name === "tablet"
    ? routes.filter((routePath) => tabletCoreRoutes.has(routePath))
    : routes;

  for (const routePath of routesForViewport) {
    const pageErrors = [];
    const onPageError = (error) => pageErrors.push(error.message);
    page.on("pageerror", onPageError);

    try {
      const response = await page.goto(baseUrl + routePath, {
        waitUntil: "domcontentloaded",
        timeout: 30000
      });
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

      const pageState = await page.evaluate(() => ({
        textLength: document.body?.innerText?.trim().length || 0,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1
      }));

      if (response && response.status() >= 500) {
        failures.push({ route: routePath, viewport: viewport.name, type: "http", detail: "HTTP " + response.status() });
      }
      if (pageState.textLength === 0) {
        failures.push({ route: routePath, viewport: viewport.name, type: "empty-page", detail: "No visible page text" });
      }
      if (routePath === "/exchanges/507f1f77bcf86cd799439013") {
        const detailHeading = await page.getByRole("heading", { name: "Exchange with A11y Test Partner" }).count();
        const conversationHref = await page.getByRole("link", { name: /Open Conversation/ }).getAttribute("href");
        if (detailHeading !== 1 || conversationHref !== "/messages?partner=507f1f77bcf86cd799439014") {
          failures.push({ route: routePath, viewport: viewport.name, type: "exchange-conversation-link", detail: "Exchange details must open a conversation with the other participant" });
        }
      }

      if (routePath === "/exchanges?status=ACTIVE" || routePath === "/screens/active-exchange") {
        const activeVisible = await page.getByRole("heading", { name: "With A11y Test Partner" }).count();
        const completedHidden = await page.getByRole("heading", { name: "With Completed Exchange Partner" }).count();
        if (activeVisible !== 1 || completedHidden !== 0 || !page.url().includes("status=ACTIVE")) {
          failures.push({ route: routePath, viewport: viewport.name, type: "active-exchange-view", detail: "Active exchange deep link did not isolate accepted/scheduled exchanges" });
        }
      }

      if (routePath === "/exchanges?status=COMPLETED" || routePath === "/screens/exchange-history" || routePath === "/screens/exchange-rating") {
        const completedVisible = await page.getByRole("heading", { name: "With Completed Exchange Partner" }).count();
        const activeHidden = await page.getByRole("heading", { name: "With A11y Test Partner" }).count();
        if (completedVisible !== 1 || activeHidden !== 0 || !page.url().includes("status=COMPLETED")) {
          failures.push({ route: routePath, viewport: viewport.name, type: "completed-exchange-view", detail: "History/rating deep link did not isolate completed exchanges" });
        }
      }

      const legacyIdDestinations = {
        "/screens/request-details/507f1f77bcf86cd799439013": "/exchanges/507f1f77bcf86cd799439013",
        "/screens/active-exchange/507f1f77bcf86cd799439013": "/exchanges/507f1f77bcf86cd799439013",
        "/screens/exchange-rating/507f1f77bcf86cd799439025": "/exchanges/507f1f77bcf86cd799439025?review=1",
        "/screens/public-profile/507f1f77bcf86cd799439014": "/profile/507f1f77bcf86cd799439014",
        "/screens/chat-details/507f1f77bcf86cd799439015": "/messages/507f1f77bcf86cd799439015",
        "/screens/workshop-details/507f1f77bcf86cd799439016": "/workshops/workshop-details?post=507f1f77bcf86cd799439016",
        "/screens/post-details/507f1f77bcf86cd799439029": "/community/posts/507f1f77bcf86cd799439029",
        "/screens/match-details/507f1f77bcf86cd799439033": "/matches/507f1f77bcf86cd799439033",
        "/screens/match-details/507f1f77bcf86cd799439033": "/matches/507f1f77bcf86cd799439033"
      };
      const expectedLegacyDestination = legacyIdDestinations[routePath];
      if (expectedLegacyDestination && !page.url().includes(expectedLegacyDestination)) {
        failures.push({ route: routePath, viewport: viewport.name, type: "legacy-resource-id", detail: "Legacy deep link did not preserve its resource ID: " + page.url() });
      }

      if (routePath === "/screens/exchange-rating/507f1f77bcf86cd799439025") {
        await page.getByRole("dialog").waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
        const reviewDialog = page.getByRole("dialog");
        const reviewHeading = await reviewDialog.getByRole("heading", { name: "Review Completed Exchange Partner" }).count();
        if (await reviewDialog.count() !== 1 || reviewHeading !== 1) {
          failures.push({ route: routePath, viewport: viewport.name, type: "exchange-rating-deep-link", detail: "Completed exchange rating deep link did not open the review dialog" });
        }
      }

      if (routePath === "/matches") {
        const detailsLinkCount = await page.getByRole("link", { name: "Match details" }).count();
        if (detailsLinkCount !== 1) {
          failures.push({ route: routePath, viewport: viewport.name, type: "match-list-detail-link", detail: "Match list did not expose the member detail link" });
        }
      }
      if (routePath === "/matches/507f1f77bcf86cd799439033" || routePath === "/screens/match-details/507f1f77bcf86cd799439033") {
        const memberHeading = await page.getByRole("heading", { name: "Match Detail Member" }).count();
        const score = await page.getByText("92%", { exact: true }).count();
        const teachHeading = await page.getByRole("heading", { name: "They can teach you" }).count();
        if (memberHeading !== 1 || score !== 1 || teachHeading !== 1) {
          failures.push({ route: routePath, viewport: viewport.name, type: "match-details-content", detail: "Match profile, compatibility score, or skill details were not rendered" });
        }
        await page.getByRole("button", { name: "Propose exchange" }).click();
        const offeredSkill = await page.getByLabel("Skill you will teach").count();
        const wantedSkill = await page.getByLabel("Skill you want to learn").count();
        if (offeredSkill !== 1 || wantedSkill !== 1) {
          failures.push({ route: routePath, viewport: viewport.name, type: "match-proposal-form", detail: "Match proposal form did not expose both skill selections" });
        }
      }

      if (routePath === "/matches") {
        const detailsLinkCount = await page.getByRole("link", { name: "Match details" }).count();
        if (detailsLinkCount !== 1) {
          failures.push({ route: routePath, viewport: viewport.name, type: "match-list-detail-link", detail: "Match list did not expose the member detail link" });
        }
      }
      if (routePath === "/matches/507f1f77bcf86cd799439033" || routePath === "/screens/match-details/507f1f77bcf86cd799439033") {
        const memberHeading = await page.getByRole("heading", { name: "Match Detail Member" }).count();
        const score = await page.getByText("92%", { exact: true }).count();
        const teachHeading = await page.getByRole("heading", { name: "They can teach you" }).count();
        if (memberHeading !== 1 || score !== 1 || teachHeading !== 1) {
          failures.push({ route: routePath, viewport: viewport.name, type: "match-details-content", detail: "Match profile, compatibility score, or skill details were not rendered" });
        }
        await page.getByRole("button", { name: "Propose exchange" }).click();
        const offeredSkill = await page.getByLabel("Skill you will teach").count();
        const wantedSkill = await page.getByLabel("Skill you want to learn").count();
        if (offeredSkill !== 1 || wantedSkill !== 1) {
          failures.push({ route: routePath, viewport: viewport.name, type: "match-proposal-form", detail: "Match proposal form did not expose both skill selections" });
        }
      }

      if (routePath === "/community/posts/507f1f77bcf86cd799439029" || routePath === "/screens/post-details/507f1f77bcf86cd799439029") {
        const postHeading = await page.getByRole("heading", { name: "A11y Test Post" }).count();
        const authorLink = await page.getByRole("link", { name: "A11y Test Member" }).count();
        const likeButton = await page.getByRole("button", { name: "Like 2" }).count();
        if (postHeading !== 1 || authorLink !== 1 || likeButton !== 1) {
          failures.push({ route: routePath, viewport: viewport.name, type: "community-post-detail", detail: "Post detail content or like action was not rendered" });
        }
      }

      if (routePath === "/screens/workshop-details" && !page.url().endsWith("/workshops/workshops")) {
        failures.push({ route: routePath, viewport: viewport.name, type: "workshop-list-fallback", detail: "Workshop details without an ID should return to the workshop list" });
      }

      if (routePath === "/exchanges/calendar" || routePath === "/screens/calendar" || routePath === "/screens/schedule") {
        const calendarHeading = await page.getByRole("heading", { name: "Exchange Calendar" }).count();
        const previousMonthControl = await page.getByRole("button", { name: "Previous month" }).count();
        if (calendarHeading !== 1 || previousMonthControl !== 1) {
          failures.push({ route: routePath, viewport: viewport.name, type: "calendar-page", detail: "Expected a dedicated calendar heading and month navigation controls" });
        } else {
          const sessionCard = await page.getByRole("heading", { name: "Browser test session" }).count();
          if (sessionCard !== 1) {
            failures.push({ route: routePath, viewport: viewport.name, type: "calendar-data", detail: "Calendar did not render the session returned by the exchange API" });
          }
          const monthHeading = page.locator("#calendar-month-title");
          const beforeMonth = (await monthHeading.textContent())?.trim();
          await page.getByRole("button", { name: "Next month" }).click();
          const afterMonth = (await monthHeading.textContent())?.trim();
          if (!beforeMonth || !afterMonth || beforeMonth === afterMonth) {
            failures.push({ route: routePath, viewport: viewport.name, type: "calendar-interaction", detail: "Next month control did not change the visible month" });
          }
          await page.getByRole("button", { name: "Previous month" }).click();
        }
        if (routePath.startsWith("/screens/") && !page.url().endsWith("/exchanges/calendar")) {
          failures.push({ route: routePath, viewport: viewport.name, type: "legacy-calendar-destination", detail: "Legacy schedule route did not resolve to the functional exchange calendar" });
        }
      }
      if (routePath === "/exchanges") {
        await page.getByRole("button", { name: /Incoming requests/ }).click();
        await page.getByRole("heading", { name: "With Incoming Requester" }).waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
        const incomingVisible = await page.getByRole("heading", { name: "With Incoming Requester" }).count();
        const sentHidden = await page.getByRole("heading", { name: "With Sent Request Recipient" }).count();
        if (incomingVisible !== 1 || sentHidden !== 0 || !page.url().includes("view=incoming")) {
          failures.push({ route: routePath, viewport: viewport.name, type: "incoming-request-filter", detail: "Incoming view did not isolate requests addressed to the signed-in member" });
        }

        await page.getByRole("button", { name: /Sent requests/ }).click();
        await page.getByRole("heading", { name: "With Sent Request Recipient" }).waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
        const sentVisible = await page.getByRole("heading", { name: "With Sent Request Recipient" }).count();
        const incomingHidden = await page.getByRole("heading", { name: "With Incoming Requester" }).count();
        if (sentVisible !== 1 || incomingHidden !== 0 || !page.url().includes("view=sent")) {
          failures.push({ route: routePath, viewport: viewport.name, type: "sent-request-filter", detail: "Sent view did not isolate requests created by the signed-in member" });
        }

        await page.getByRole("button", { name: "All exchanges" }).click();
        const allRequestsVisible =
          await page.getByRole("heading", { name: "With Incoming Requester" }).count() === 1 &&
          await page.getByRole("heading", { name: "With Sent Request Recipient" }).count() === 1;
        if (!allRequestsVisible) {
          failures.push({ route: routePath, viewport: viewport.name, type: "all-exchanges-filter", detail: "All exchanges view did not restore both request directions" });
        }
      }

      if (routePath === "/screens/incoming-requests" || routePath === "/exchanges?view=incoming") {
        const incomingVisible = await page.getByRole("heading", { name: "With Incoming Requester" }).count();
        const sentHidden = await page.getByRole("heading", { name: "With Sent Request Recipient" }).count();
        if (incomingVisible !== 1 || sentHidden !== 0 || !page.url().includes("view=incoming")) {
          failures.push({ route: routePath, viewport: viewport.name, type: "incoming-route", detail: "Incoming request deep link did not open its filtered inbox" });
        }
      }

      if (routePath === "/screens/sent-requests" || routePath === "/exchanges?view=sent") {
        const sentVisible = await page.getByRole("heading", { name: "With Sent Request Recipient" }).count();
        const incomingHidden = await page.getByRole("heading", { name: "With Incoming Requester" }).count();
        if (sentVisible !== 1 || incomingHidden !== 0 || !page.url().includes("view=sent")) {
          failures.push({ route: routePath, viewport: viewport.name, type: "sent-route", detail: "Sent request deep link did not open its filtered inbox" });
        }
      }

      if (pageState.horizontalOverflow) {
        failures.push({ route: routePath, viewport: viewport.name, type: "responsive-overflow", detail: "Document exceeds viewport width" });
      }
      if (pageErrors.length) {
        failures.push({ route: routePath, viewport: viewport.name, type: "runtime", detail: pageErrors.slice(0, 3) });
      }

      await page.addStyleTag({
        content: "*, *::before, *::after { transition-duration: 0s !important; animation-duration: 0s !important; }"
      });
      await page.waitForTimeout(200);

      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      const blockingViolations = audit.violations.filter(
        (violation) => violation.impact === "critical" || violation.impact === "serious"
      );

      for (const violation of blockingViolations) {
        failures.push({
          route: routePath,
          viewport: viewport.name,
          type: "accessibility",
          id: violation.id,
          impact: violation.impact,
          detail: violation.help,
          nodes: violation.nodes.slice(0, 3).map((node) => ({
            target: node.target,
            html: node.html.slice(0, 240),
            failureSummary: node.failureSummary
          }))
        });
      }

      console.log(
        "AUDIT " + viewport.name + " " + routePath +
        " http=" + (response ? response.status() : "n/a") +
        " axe=" + audit.violations.length +
        " blocking=" + blockingViolations.length
      );
    } catch (error) {
      failures.push({
        route: routePath,
        viewport: viewport.name,
        type: "navigation-or-audit",
        detail: error instanceof Error ? error.message : String(error)
      });
    } finally {
      page.off("pageerror", onPageError);
    }
  }

  await context.close();
}

// Verify the client-side access gates independently of the authenticated page audit.
const guestPage = await browser.newPage({ viewport: { width: 375, height: 812 } });
await guestPage.route("**/api/v1/**", async (route) => {
  const path = new URL(route.request().url()).pathname;
  if (path.endsWith("/auth/me")) {
    await route.fulfill(failure(401, "UNAUTHORIZED", "Sign in required"));
  } else {
    await route.fulfill(success([]));
  }
});
await guestPage.goto(baseUrl + "/safety", { waitUntil: "domcontentloaded" });
const guestHeading = await guestPage.locator("h1").first().textContent().catch(() => "");
if (!guestHeading?.toLowerCase().includes("sign in")) {
  failures.push({ route: "/safety", viewport: "guest", type: "auth-gate", detail: guestHeading || "No gate heading" });
}
await guestPage.close();

const incompletePage = await browser.newPage({ viewport: { width: 375, height: 812 } });
await incompletePage.route("**/api/v1/**", async (route) => {
  const path = new URL(route.request().url()).pathname;
  if (path.endsWith("/auth/me")) {
    await route.fulfill(success({ user: member({ isEmailVerified: false, onboardingCompleted: false }) }));
  } else {
    await route.fulfill(success([]));
  }
});
await incompletePage.goto(baseUrl + "/dashboard", { waitUntil: "domcontentloaded" });
const onboardingGate = await incompletePage.locator("h1").first().textContent().catch(() => "");
if (!onboardingGate?.toLowerCase().includes("complete your learning profile")) {
  failures.push({ route: "/dashboard", viewport: "unverified-incomplete", type: "onboarding-gate", detail: onboardingGate || "No gate heading" });
}
await incompletePage.goto(baseUrl + "/onboarding", { waitUntil: "domcontentloaded" });
const onboardingHeading = await incompletePage.locator("h1").first().textContent().catch(() => "");
if (!onboardingHeading || onboardingHeading.toLowerCase().includes("complete your learning profile")) {
  failures.push({ route: "/onboarding", viewport: "unverified-incomplete", type: "onboarding-access", detail: onboardingHeading || "Onboarding did not render" });
}
await incompletePage.close();

const unverifiedPage = await browser.newPage({ viewport: { width: 375, height: 812 } });
await unverifiedPage.route("**/api/v1/**", async (route) => {
  const path = new URL(route.request().url()).pathname;
  if (path.endsWith("/auth/me")) {
    await route.fulfill(success({ user: member({ isEmailVerified: false, onboardingCompleted: true }) }));
  } else {
    await route.fulfill(success([]));
  }
});
await unverifiedPage.goto(baseUrl + "/dashboard", { waitUntil: "domcontentloaded" });
const verificationGate = await unverifiedPage.locator("h1").first().textContent().catch(() => "");
if (!verificationGate?.toLowerCase().includes("verify your email")) {
  failures.push({ route: "/dashboard", viewport: "unverified-complete", type: "verification-gate", detail: verificationGate || "No gate heading" });
}
await unverifiedPage.close();

await browser.close();

if (failures.length) {
  console.error("Browser accessibility smoke failures:");
  for (const item of failures) console.error(JSON.stringify(item));
  process.exitCode = 1;
} else {
  console.log("All route, responsive overflow, runtime, access-gate, and serious/critical axe checks passed.");
}
