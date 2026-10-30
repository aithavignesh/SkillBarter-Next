import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { apiHealthSchema } from "@skillbarter/shared";
import { env } from "./config/env";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-7", legacyHeaders: false }));

app.get("/api/health", (_req, res) => {
  const payload = apiHealthSchema.parse({
    status: "ok",
    service: "skillbarter-api",
    timestamp: new Date().toISOString(),
  });
  res.status(200).json(payload);
});

app.use((_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message } });
});
