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
  TWOFACTOR_API_KEY: "test-twofactor-provider-key",
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
  it("rejects an admin bootstrap secret reused as the refresh secret", () => {
    const values = {
      ...validProductionEnv,
      ADMIN_BOOTSTRAP_SECRET: validProductionEnv.JWT_REFRESH_SECRET,
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

  it("requires the SMS provider key for production phone OTP", () => {
    const values = {
      ...validProductionEnv,
      TWOFACTOR_API_KEY: "",
    };
    setProductionEnvironment(values);
    const result = envSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) =>
        issue.path.includes("TWOFACTOR_API_KEY") &&
        issue.message.includes("must be explicitly configured"),
      )).toBe(true);
    }
  });

  it("rejects disabling transactional email in production", () => {
    const values = {
      ...validProductionEnv,
      EMAIL_DISABLED: "true",
    };
    setProductionEnvironment(values);
    const result = envSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) =>
        issue.path.includes("EMAIL_DISABLED") &&
        issue.message.includes("not allowed in production"),
      )).toBe(true);
    }
  });

  it("requires email provider configuration even if EMAIL_DISABLED is set", () => {
    const values = {
      ...validProductionEnv,
      EMAIL_DISABLED: "true",
      RESEND_API_KEY: "",
      EMAIL_FROM: "",
    };
    setProductionEnvironment(values);
    const result = envSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("RESEND_API_KEY"))).toBe(true);
      expect(result.error.issues.some((issue) => issue.path.includes("EMAIL_FROM"))).toBe(true);
    }
  });

  it("rejects production secrets shorter than 32 characters", () => {
    const values = {
      ...validProductionEnv,
      ADMIN_BOOTSTRAP_SECRET: "short-secret",
    };
    setProductionEnvironment(values);
    const result = envSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) =>
        issue.path.includes("ADMIN_BOOTSTRAP_SECRET") &&
        issue.message.includes("at least 32 characters"),
      )).toBe(true);
    }
  });

});
