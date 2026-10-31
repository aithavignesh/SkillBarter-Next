import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  PUBLIC_API_URL: z.string().url().default("http://localhost:4000/api/v1"),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/skillbarter_next"),
  JWT_ACCESS_SECRET: z.string().min(16).default("dev-skillbarter-jwt-access-secret-32-chars-min!"),
  JWT_REFRESH_SECRET: z.string().min(16).default("dev-skillbarter-jwt-refresh-secret-32-chars-min!"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("7d"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().min(1).optional(),
});

const parsedEnv = envSchema.superRefine((value, context) => {
  if (value.NODE_ENV !== "production") return;

  const required = [
    "FRONTEND_URL",
    "PUBLIC_API_URL",
    "MONGODB_URI",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "RESEND_API_KEY",
    "EMAIL_FROM",
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

  for (const key of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"] as const) {
    if ((process.env[key]?.length ?? 0) < 32) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `${key} must contain at least 32 characters in production`,
      });
    }
  }

  if (
    process.env.JWT_ACCESS_SECRET &&
    process.env.JWT_REFRESH_SECRET &&
    process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["JWT_REFRESH_SECRET"],
      message: "Access and refresh JWT secrets must be different",
    });
  }
});

export const env = parsedEnv.parse(process.env);
