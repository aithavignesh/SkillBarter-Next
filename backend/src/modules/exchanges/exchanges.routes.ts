import { Router } from "express";
import { exchangesController } from "./exchanges.controller";
import { authenticate, requireOnboardingCompleted } from "../../middleware/auth";

export const exchangesRouter = Router();

exchangesRouter.use(authenticate, requireOnboardingCompleted);

exchangesRouter.post("/", (req, res, next) => exchangesController.createExchange(req, res, next));
exchangesRouter.get("/", (req, res, next) => exchangesController.listUserExchanges(req, res, next));
exchangesRouter.get("/:id", (req, res, next) => exchangesController.getExchangeById(req, res, next));
exchangesRouter.patch("/:id/status", (req, res, next) => exchangesController.updateExchangeStatus(req, res, next));
exchangesRouter.post("/:id/complete", (req, res, next) => exchangesController.confirmCompletion(req, res, next));
exchangesRouter.post("/:id/dispute", (req, res, next) => exchangesController.disputeExchange(req, res, next));

// Scheduling routes
exchangesRouter.post("/:id/sessions", (req, res, next) => exchangesController.createSession(req, res, next));
exchangesRouter.get("/:id/sessions", (req, res, next) => exchangesController.listSessions(req, res, next));
exchangesRouter.patch("/:id/sessions/:sessionId", (req, res, next) => exchangesController.updateSessionStatus(req, res, next));
