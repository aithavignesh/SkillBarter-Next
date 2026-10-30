import { describe, expect, it } from "vitest";
import { env } from "./env";

describe("environment configuration", () => {
  it("uses a local development database by default", () => {
    expect(env.MONGODB_URI).toContain("skillbarter_next");
  });
});
