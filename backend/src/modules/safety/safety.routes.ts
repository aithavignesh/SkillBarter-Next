import { Router } from "express";
import { safetyController } from "./safety.controller";
import { authenticate } from "../../middleware/auth";

export const safetyRouter = Router();

safetyRouter.post("/block", authenticate, (req, res, next) => safetyController.blockUser(req, res, next));
safetyRouter.delete("/block/:userId", authenticate, (req, res, next) => safetyController.unblockUser(req, res, next));
safetyRouter.get("/blocked", authenticate, (req, res, next) => safetyController.listBlockedUsers(req, res, next));
safetyRouter.post("/report", authenticate, (req, res, next) => safetyController.createReport(req, res, next));
