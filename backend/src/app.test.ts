import { describe, expect, it } from "vitest";
import { createSessionSchema } from "@skillbarter/shared";

import request from "supertest";
import { app } from "./app";

describe("Health and Readiness API", () => {
  it("GET /api/v1/health returns ok status", async () => {
    const response = await request(app).get("/api/v1/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.service).toBe("skillbarter-api");
    expect(typeof response.body.timestamp).toBe("string");
  });

  it("GET /api/health (alias) returns ok status", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("GET /api/v1/ready returns ready status when connected", async () => {
    const response = await request(app).get("/api/v1/ready");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ready");
    expect(response.body.database).toBe("connected");
  });

  it("exposes the current Render commit and branch on health probes", async () => {
    const originalCommit = process.env.RENDER_GIT_COMMIT;
    const originalBranch = process.env.RENDER_GIT_BRANCH;
    process.env.RENDER_GIT_COMMIT = "a".repeat(40);
    process.env.RENDER_GIT_BRANCH = "development";

    try {
      const [health, ready] = await Promise.all([
        request(app).get("/api/v1/health"),
        request(app).get("/api/v1/ready"),
      ]);
      expect(health.body.commit).toBe("a".repeat(40));
      expect(health.body.branch).toBe("development");
      expect(ready.body.commit).toBe("a".repeat(40));
      expect(ready.body.branch).toBe("development");
    } finally {
      if (originalCommit === undefined) delete process.env.RENDER_GIT_COMMIT;
      else process.env.RENDER_GIT_COMMIT = originalCommit;
      if (originalBranch === undefined) delete process.env.RENDER_GIT_BRANCH;
      else process.env.RENDER_GIT_BRANCH = originalBranch;
    }
  });
});

describe("Security middleware and admin access", () => {
  it("does not expose the Express powered-by header", async () => {
    const response = await request(app).get("/api/v1/health");
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });

  it("rejects access to protected admin endpoints without authentication", async () => {
    const response = await request(app).get("/api/v1/admin/stats");
    expect(response.status).toBe(401);
  });

  it("rejects admin bootstrap requests with missing required parameters", async () => {
    const response = await request(app).post("/api/v1/admin/bootstrap").send({});
    expect(response.status).toBe(400);
  });

  it("rejects admin bootstrap requests with an invalid secret", async () => {
    const response = await request(app).post("/api/v1/admin/bootstrap").send({
      secretKey: "definitely-not-the-bootstrap-secret",
      email: "bootstrap-test@example.com",
      password: "A-long-test-password-123!",
      displayName: "Bootstrap Test",
    });
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("clears both authentication cookies on logout", async () => {
    const response = await request(app).post("/api/v1/auth/logout");
    expect(response.status).toBe(200);
    const setCookie = response.headers["set-cookie"] as string[] | undefined;
    expect(setCookie).toBeDefined();
    expect(setCookie?.some((cookie) => cookie.startsWith("accessToken=;"))).toBe(true);
    expect(setCookie?.some((cookie) => cookie.startsWith("refreshToken=;"))).toBe(true);
  });

  it("rejects profile updates without an authenticated session", async () => {
    const response = await request(app).patch("/api/v1/users/profile").send({
      displayName: "Unauthenticated Update",
      bio: "This request must not be applied.",
    });
    expect(response.status).toBe(401);
  });

  it("rejects onboarding completion without an authenticated session", async () => {
    const response = await request(app).post("/api/v1/users/onboarding").send({});
    expect(response.status).toBe(401);
  });

  it("rejects notification listing without an authenticated session", async () => {
    const response = await request(app).get("/api/v1/notifications");
    expect(response.status).toBe(401);
  });

  it("rejects user blocking without an authenticated session", async () => {
    const response = await request(app).post("/api/v1/safety/block").send({ userId: "target-user-id" });
    expect(response.status).toBe(401);
  });

  it("rejects report creation without an authenticated session", async () => {
    const response = await request(app).post("/api/v1/safety/report").send({
      reportedUserId: "target-user-id",
      reason: "spam",
    });
    expect(response.status).toBe(401);
  });

  it("rejects analytics summary access without an authenticated admin session", async () => {
    const response = await request(app).get("/api/v1/analytics/summary");
    expect(response.status).toBe(401);
  });

  it("rejects conversation access without an authenticated session", async () => {
    const response = await request(app).get("/api/v1/messages/conversations");
    expect(response.status).toBe(401);
  });

  it("rejects exchange listing without an authenticated session", async () => {
    const response = await request(app).get("/api/v1/exchanges");
    expect(response.status).toBe(401);
  });

  it("rejects password changes without an authenticated session", async () => {
    const response = await request(app).post("/api/v1/auth/change-password").send({
      currentPassword: "Old-password-123!",
      newPassword: "New-password-456!",
    });
    expect(response.status).toBe(401);
  });

  it("rejects refresh requests without a refresh token", async () => {
    const response = await request(app).post("/api/v1/auth/refresh");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("REFRESH_TOKEN_REQUIRED");
  });

  it("rejects an invalid refresh token without creating a session", async () => {
    const response = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: "not-a-valid-refresh-token" });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_TOKEN");
  });

  it("redirects email verification links to the frontend without consuming the token on GET", async () => {
    const token = "verification-token-with-special-chars&next=/admin";
    const response = await request(app).get("/api/v1/auth/verify-email/link").query({ token });
    expect(response.status).toBe(303);
    expect(response.headers.location).toContain("/verify-email?token=");
    expect(response.headers.location).toContain(encodeURIComponent(token));
  });
});


describe("Shared session request validation", () => {
  const makeInput = (overrides: Record<string, string> = {}) => {
    const startTime = new Date(Date.now() + 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    return {
      exchangeId: "exchange-test-id",
      title: "Skill exchange session",
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      ...overrides,
    };
  };

  it("accepts a session scheduled in the future", () => {
    expect(createSessionSchema.safeParse(makeInput()).success).toBe(true);
  });

  it("rejects a session whose start time is in the past", () => {
    const startTime = new Date(Date.now() - 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
    const result = createSessionSchema.safeParse({
      ...makeInput(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("startTime"))).toBe(true);
    }
  });

  it("rejects an end time that is not after the start time", () => {
    const startTime = new Date(Date.now() + 60 * 60 * 1000);
    const result = createSessionSchema.safeParse({
      ...makeInput(),
      startTime: startTime.toISOString(),
      endTime: startTime.toISOString(),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("endTime"))).toBe(true);
    }
  });
});
