import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./app";

describe("GET /api/health", () => {
  it("returns the API health contract", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.service).toBe("skillbarter-api");
    expect(typeof response.body.timestamp).toBe("string");
  });
});
