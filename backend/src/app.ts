import cors from "cors";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { apiHealthSchema, apiReadySchema } from "@skillbarter/shared";
import { env } from "./config/env";
import { isDatabaseConnected } from "./config/database";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";

import { authRouter } from "./modules/auth/auth.routes";
import { usersRouter } from "./modules/users/users.routes";
import { skillsRouter } from "./modules/skills/skills.routes";
import { matchesRouter } from "./modules/matches/matches.routes";
import { exchangesRouter } from "./modules/exchanges/exchanges.routes";
import { messagesRouter } from "./modules/messages/messages.routes";
import { notificationsRouter } from "./modules/notifications/notifications.routes";
import { reviewsRouter } from "./modules/reviews/reviews.routes";
import { communityRouter } from "./modules/community/community.routes";
import { safetyRouter } from "./modules/safety/safety.routes";
import { adminRouter } from "./modules/admin/admin.routes";
import { analyticsRouter } from "./modules/analytics/analytics.routes";

export const app = express();

// Render terminates TLS and forwards client IPs through its trusted proxy.
// Trust only the directly connected proxy so express-rate-limit can safely
// derive client addresses from X-Forwarded-For without accepting arbitrary hops.
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(requestLogger);

// Global API rate limiting
app.use(
  "/api",
  rateLimit({
    windowMs: 60_000,
    limit: 200,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  })
);

// Render's RENDER_GIT_COMMIT can lag behind a newly promoted instance.
// The postbuild script writes the checked-out Git SHA into dist/build-info.json,
// which is bundled with the deployed server and is the primary source of truth.
const readBuildMetadata = (): { commit?: string | null; branch?: string | null } => {
  try {
    return JSON.parse(readFileSync(join(__dirname, "build-info.json"), "utf8")) as {
      commit?: string | null;
      branch?: string | null;
    };
  } catch {
    return {};
  }
};

const buildMetadata = readBuildMetadata();
const getDeploymentMetadata = () => ({
  commit: buildMetadata.commit || process.env.RENDER_GIT_COMMIT || null,
  branch: buildMetadata.branch || process.env.RENDER_GIT_BRANCH || null,
});

// Health check handler
const handleHealth = (_req: express.Request, res: express.Response) => {
  const payload = apiHealthSchema.parse({
    status: "ok",
    service: "skillbarter-api",
    timestamp: new Date().toISOString(),
    ...getDeploymentMetadata(),
  });
  res.status(200).json(payload);
};

// Readiness check handler (verifies DB status without exposing secrets)
const handleReady = (_req: express.Request, res: express.Response) => {
  const dbConnected = isDatabaseConnected();
  const payload = apiReadySchema.parse({
    status: dbConnected ? "ready" : "not_ready",
    service: "skillbarter-api",
    database: dbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
    ...getDeploymentMetadata(),
  });
  res.status(dbConnected ? 200 : 503).json(payload);
};

// Root health route keeps platform probes from treating the API service as unavailable.
// The same payload is exposed at the versioned health endpoints below.
app.get("/", handleHealth);

// Health & Readiness routes
app.get("/api/health", handleHealth);
app.get("/api/v1/health", handleHealth);
app.get("/api/ready", handleReady);
app.get("/api/v1/ready", handleReady);

// API v1 Domain Routes
const apiV1 = express.Router();
apiV1.use("/auth", authRouter);
apiV1.use("/users", usersRouter);
apiV1.use("/skills", skillsRouter);
apiV1.use("/matches", matchesRouter);
apiV1.use("/exchanges", exchangesRouter);
apiV1.use("/messages", messagesRouter);
apiV1.use("/notifications", notificationsRouter);
apiV1.use("/reviews", reviewsRouter);
apiV1.use("/community", communityRouter);
apiV1.use("/safety", safetyRouter);
apiV1.use("/admin", adminRouter);
apiV1.use("/analytics", analyticsRouter);

app.use("/api/v1", apiV1);
// Alias without v1 for convenience
app.use("/api", apiV1);

// Centralized 404 and Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);
