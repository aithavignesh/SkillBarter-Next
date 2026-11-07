import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const baseUrl = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const routes = [
  "/",
  "/about",
  "/login",
  "/register",
  "/signup",
  "/forgot-password",
  "/reset-password?token=invalid",
  "/verify-email",
  "/onboarding",
  "/dashboard",
  "/discover",
  "/matches",
  "/exchanges",
  "/exchanges/507f1f77bcf86cd799439011",
  "/messages",
  "/messages/507f1f77bcf86cd799439011",
  "/notifications",
  "/profile/edit",
  "/profile/507f1f77bcf86cd799439011",
  "/skills",
  "/community",
  "/connections",
  "/feed",
  "/monetization",
  "/settings",
  "/safety",
  "/trust",
  "/admin",
  "/feedback",
  "/invite",
  "/support/faq",
  "/support/support",
  "/screens",
  "/screens/ai-matching",
  "/screens/create-workshop",
  "/screens/my-workshops",
  "/workshops/workshops",
  "/workshops/create-workshop",
  "/workshops/my-workshops",
  "/workshops/workshop-details?post=507f1f77bcf86cd799439011"
];

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "desktop", width: 1440, height: 900 }
];
const failures = [];
const browser = await chromium.launch({ headless: true });

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();

  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    const failure = (status, code, message) => ({
      status,
      contentType: "application/json",
      body: JSON.stringify({ success: false, error: { code, message } })
    });
    const success = (data) => ({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data })
    });

    if (path.endsWith("/auth/me")) {
      await route.fulfill(failure(401, "UNAUTHORIZED", "Sign in required"));
      return;
    }
    if (/\/users\/[a-f0-9]{24}$/.test(path) || /\/exchanges\/[a-f0-9]{24}$/.test(path)) {
      await route.fulfill(failure(404, "NOT_FOUND", "The requested record was not found"));
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
    if (path.endsWith("/admin/stats")) {
      await route.fulfill(success({ stats: { totalUsers: 0, totalExchanges: 0, completedExchanges: 0, activeSessions: 0, totalSkills: 0, pendingReports: 0 } }));
      return;
    }
    await route.fulfill(success([]));
  });

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
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        title: document.title
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
          selectors: violation.nodes.slice(0, 3).map((node) => node.target)
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

await browser.close();

if (failures.length) {
  console.error("Browser accessibility smoke failures:");
  for (const failure of failures) console.error(JSON.stringify(failure));
  process.exitCode = 1;
} else {
  console.log("All route, responsive overflow, runtime, and serious/critical axe checks passed.");
}
