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
