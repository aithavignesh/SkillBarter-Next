import { Router } from "express";
import { matchesController } from "./matches.controller";
import { authenticate, requireOnboardingCompleted } from "../../middleware/auth";

export const matchesRouter = Router();

matchesRouter.get("/recommendations", authenticate, requireOnboardingCompleted, (req, res, next) => matchesController.discover(req, res, next));
matchesRouter.get("/discover", authenticate, requireOnboardingCompleted, (req, res, next) => matchesController.discover(req, res, next));
