import { describe, expect, it } from "vitest";
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
    expect(setCookie?.some((cookie) => cookie.startsWith("accessToken=") && /Expires=Thu, 01 Jan 1970 00:00:00 GMT/i.test(cookie))).toBe(true);
    expect(setCookie?.some((cookie) => cookie.startsWith("refreshToken=") && /Expires=Thu, 01 Jan 1970 00:00:00 GMT/i.test(cookie))).toBe(true);
  });

  it("redirects email verification links to the frontend without consuming the token on GET", async () => {
    const token = "verification-token-with-special-chars&next=/admin";
    const response = await request(app).get("/api/v1/auth/verify-email/link").query({ token });
    expect(response.status).toBe(303);
    expect(response.headers.location).toContain("/verify-email?token=");
    expect(response.headers.location).toContain(encodeURIComponent(token));
  });
});
