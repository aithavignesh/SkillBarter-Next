import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/skillbarter_next"),
  JWT_ACCESS_SECRET: z.string().min(16).default("dev-skillbarter-jwt-access-secret-32-chars-min!"),
  JWT_REFRESH_SECRET: z.string().min(16).default("dev-skillbarter-jwt-refresh-secret-32-chars-min!"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("7d"),
});

export const env = envSchema.parse(process.env);
