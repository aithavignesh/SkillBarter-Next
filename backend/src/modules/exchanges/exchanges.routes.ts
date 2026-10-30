import { Router } from "express";
import { exchangesController } from "./exchanges.controller";
import { authenticate } from "../../middleware/auth";

export const exchangesRouter = Router();

exchangesRouter.post("/", authenticate, (req, res, next) => exchangesController.createExchange(req, res, next));
exchangesRouter.get("/", authenticate, (req, res, next) => exchangesController.listUserExchanges(req, res, next));
exchangesRouter.get("/:id", authenticate, (req, res, next) => exchangesController.getExchangeById(req, res, next));
exchangesRouter.patch("/:id/status", authenticate, (req, res, next) => exchangesController.updateExchangeStatus(req, res, next));
exchangesRouter.post("/:id/complete", authenticate, (req, res, next) => exchangesController.confirmCompletion(req, res, next));
exchangesRouter.post("/:id/dispute", authenticate, (req, res, next) => exchangesController.disputeExchange(req, res, next));

// Scheduling routes
exchangesRouter.post("/:id/sessions", authenticate, (req, res, next) => exchangesController.createSession(req, res, next));
exchangesRouter.get("/:id/sessions", authenticate, (req, res, next) => exchangesController.listSessions(req, res, next));
exchangesRouter.patch("/:id/sessions/:sessionId", authenticate, (req, res, next) => exchangesController.updateSessionStatus(req, res, next));
