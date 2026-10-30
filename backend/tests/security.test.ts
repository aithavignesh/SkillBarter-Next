import { describe, expect, it } from "vitest";
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateSecureToken,
} from "../src/utils/security";

describe("Security utilities", () => {
  it("hashes password with Argon2id and verifies correctly", async () => {
    const password = "SecurePassword123!";
    const hash = await hashPassword(password);
    expect(hash).toContain("$argon2id$");

    const valid = await verifyPassword(password, hash);
    expect(valid).toBe(true);

    const invalid = await verifyPassword("WrongPassword", hash);
    expect(invalid).toBe(false);
  });

  it("signs and verifies access tokens", () => {
    const payload = { userId: "user-123", email: "user@example.com", role: "user" as const };
    const token = signAccessToken(payload);
    expect(typeof token).toBe("string");

    const decoded = verifyAccessToken(token);
    expect(decoded?.userId).toBe("user-123");
    expect(decoded?.email).toBe("user@example.com");
  });

  it("rejects invalid access tokens", () => {
    const decoded = verifyAccessToken("invalid-token-string");
    expect(decoded).toBeNull();
  });

  it("generates cryptographically secure tokens", () => {
    const token1 = generateSecureToken(16);
    const token2 = generateSecureToken(16);
    expect(token1).not.toBe(token2);
    expect(token1.length).toBe(32);
  });
});
