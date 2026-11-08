import { Router } from "express";
import { notificationsController } from "./notifications.controller";
import { authenticate, requireOnboardingCompleted } from "../../middleware/auth";

export const notificationsRouter = Router();

notificationsRouter.use(authenticate, requireOnboardingCompleted);

notificationsRouter.get("/", (req, res, next) => notificationsController.listNotifications(req, res, next));
notificationsRouter.get("/unread-count", (req, res, next) => notificationsController.getUnreadCount(req, res, next));
notificationsRouter.patch("/:id/read", (req, res, next) => notificationsController.markAsRead(req, res, next));
notificationsRouter.post("/mark-all-read", (req, res, next) => notificationsController.markAllAsRead(req, res, next));
