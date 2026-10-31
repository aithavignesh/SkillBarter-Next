import { afterEach, describe, expect, it, vi } from "vitest";
import { envSchema } from "./env";

const validProductionEnv = {
  NODE_ENV: "production",
  FRONTEND_URL: "https://skillbarter.example",
  PUBLIC_API_URL: "https://api.skillbarter.example/api/v1",
  MONGODB_URI: "mongodb://127.0.0.1:27017/skillbarter_next",
  JWT_ACCESS_SECRET: "access-secret-that-is-at-least-32-characters",
  JWT_REFRESH_SECRET: "refresh-secret-that-is-at-least-32-characters",
  ADMIN_BOOTSTRAP_SECRET: "admin-secret-that-is-at-least-32-characters",
  RESEND_API_KEY: "re_test_key",
  EMAIL_FROM: "SkillBarter <noreply@skillbarter.example>",
};

function setProductionEnvironment(values: typeof validProductionEnv) {
  for (const [key, value] of Object.entries(values)) {
    vi.stubEnv(key, value);
  }
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("production environment secret validation", () => {
  it("accepts distinct access, refresh, and admin secrets", () => {
    setProductionEnvironment(validProductionEnv);
    const result = envSchema.safeParse(validProductionEnv);
    expect(result.success).toBe(true);
  });

  it("rejects identical access and refresh secrets", () => {
    const values = {
      ...validProductionEnv,
      JWT_REFRESH_SECRET: validProductionEnv.JWT_ACCESS_SECRET,
    };
    setProductionEnvironment(values);
    const result = envSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) =>
        issue.path.includes("JWT_REFRESH_SECRET") &&
        issue.message.includes("must use different secrets"),
      )).toBe(true);
    }
  });

  it("rejects an admin bootstrap secret reused as a JWT secret", () => {
    const values = {
      ...validProductionEnv,
      ADMIN_BOOTSTRAP_SECRET: validProductionEnv.JWT_ACCESS_SECRET,
    };
    setProductionEnvironment(values);
    const result = envSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) =>
        issue.path.includes("ADMIN_BOOTSTRAP_SECRET") &&
        issue.message.includes("must use different secrets"),
      )).toBe(true);
    }
  });
});
