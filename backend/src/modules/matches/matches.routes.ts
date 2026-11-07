import { Router } from "express";
import { matchesController } from "./matches.controller";
import { authenticate, optionalAuth, requireOnboardingCompleted } from "../../middleware/auth";

export const matchesRouter = Router();

matchesRouter.get("/recommendations", authenticate, requireOnboardingCompleted, (req, res, next) => matchesController.discover(req, res, next));
matchesRouter.get("/discover", optionalAuth, (req, res, next) => matchesController.discover(req, res, next));
