import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const baseUrl = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const routes = [
  "/", "/about", "/login", "/register", "/signup", "/forgot-password",
  "/reset-password?token=invalid", "/verify-email", "/onboarding", "/dashboard",
  "/discover", "/matches", "/exchanges", "/exchanges/507f1f77bcf86cd799439011",
  "/messages", "/messages/507f1f77bcf86cd799439011", "/notifications",
  "/profile/edit", "/profile/507f1f77bcf86cd799439011", "/skills", "/community",
  "/connections", "/feed", "/monetization", "/settings", "/safety", "/trust",
  "/admin", "/feedback", "/invite", "/support/faq", "/support/support",
  "/screens", "/screens/ai-matching", "/screens/create-workshop",
  "/screens/my-workshops", "/workshops/workshops", "/workshops/create-workshop",
  "/workshops/my-workshops",
  "/workshops/workshop-details?post=507f1f77bcf86cd799439011"
];
const viewports = [
  { name: "mobile", width: 375, height: 812 },
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

async function installAuthenticatedApi(page) {
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;

    if (path.endsWith("/auth/me")) {
      await route.fulfill(success({ user: member() }));
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
    if (path.endsWith("/exchanges")) {
      await route.fulfill(success({ exchanges: [] }));
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
    if (path.endsWith("/exchanges/507f1f77bcf86cd799439011/sessions")) {
      await route.fulfill(success({ sessions: [] }));
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

  for (const routePath of routes) {
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
      if (pageState.horizontalOverflow) {
        failures.push({ route: routePath, viewport: viewport.name, type: "responsive-overflow", detail: "Document exceeds viewport width" });
      }
      if (pageErrors.length) {
        failures.push({ route: routePath, viewport: viewport.name, type: "runtime", detail: pageErrors.slice(0, 3) });
      }

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
