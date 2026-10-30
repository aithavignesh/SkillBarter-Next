import { Router } from "express";
import { analyticsController } from "./analytics.controller";
import { optionalAuth, authenticate, requireRole } from "../../middleware/auth";

export const analyticsRouter = Router();

analyticsRouter.post("/track", optionalAuth, (req, res, next) => analyticsController.track(req, res, next));
analyticsRouter.get("/summary", authenticate, requireRole("admin"), (req, res, next) => analyticsController.getSummary(req, res, next));
