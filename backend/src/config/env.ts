import "dotenv/config";
import { z } from "zod";

const envBaseSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  PUBLIC_API_URL: z.string().url().default("http://localhost:4000/api/v1"),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/skillbarter_next"),
  JWT_ACCESS_SECRET: z.string().min(16).default("dev-skillbarter-jwt-access-secret-32-chars-min!"),
  JWT_REFRESH_SECRET: z.string().min(16).default("dev-skillbarter-jwt-refresh-secret-32-chars-min!"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("7d"),
  ADMIN_BOOTSTRAP_SECRET: z.string().min(32).optional(),
  PLATFORM_OWNER_EMAIL: z.string().email().transform((value) => value.toLowerCase().trim()).optional(),
  RESEND_API_KEY: z.string().optional(),
  TWOFACTOR_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().min(1).optional(),
  // Explicitly allow non-email staging deployments without weakening production token/cookie behavior.
  EMAIL_DISABLED: z.enum(["true", "false"]).default("false"),
});

export const envSchema = envBaseSchema.superRefine((value, context) => {
  if (value.NODE_ENV !== "production") return;

  const required = [
    "FRONTEND_URL",
    "PUBLIC_API_URL",
    "MONGODB_URI",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "ADMIN_BOOTSTRAP_SECRET",
  ] as const;
  for (const key of required) {
    if (!process.env[key]?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `${key} must be explicitly configured in production`,
      });
    }
  }

  // Email verification and password recovery are required production capabilities.
  // EMAIL_DISABLED is only a development/test convenience and must never bypass this gate.
  for (const key of ["RESEND_API_KEY", "EMAIL_FROM", "TWOFACTOR_API_KEY"] as const) {
    if (!process.env[key]?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `${key} must be explicitly configured in production`,
      });
    }
  }
  if (value.EMAIL_DISABLED === "true") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["EMAIL_DISABLED"],
      message: "EMAIL_DISABLED=true is not allowed in production",
    });
  }

  for (const key of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "ADMIN_BOOTSTRAP_SECRET"] as const) {
    if ((process.env[key]?.length ?? 0) < 32) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `${key} must contain at least 32 characters in production`,
      });
    }
  }

  const secretPairs = [
    ["JWT_ACCESS_SECRET", value.JWT_ACCESS_SECRET, "JWT_REFRESH_SECRET", value.JWT_REFRESH_SECRET],
    ["JWT_ACCESS_SECRET", value.JWT_ACCESS_SECRET, "ADMIN_BOOTSTRAP_SECRET", value.ADMIN_BOOTSTRAP_SECRET],
    ["JWT_REFRESH_SECRET", value.JWT_REFRESH_SECRET, "ADMIN_BOOTSTRAP_SECRET", value.ADMIN_BOOTSTRAP_SECRET],
  ] as const;

  for (const [firstName, firstValue, secondName, secondValue] of secretPairs) {
    if (firstValue && secondValue && firstValue === secondValue) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [secondName],
        message: `${firstName} and ${secondName} must use different secrets`,
      });
    }
  }
});

export const env = envSchema.parse(process.env);
