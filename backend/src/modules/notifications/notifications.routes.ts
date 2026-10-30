import { Router } from "express";
import { notificationsController } from "./notifications.controller";
import { authenticate } from "../../middleware/auth";

export const notificationsRouter = Router();

notificationsRouter.get("/", authenticate, (req, res, next) => notificationsController.listNotifications(req, res, next));
notificationsRouter.get("/unread-count", authenticate, (req, res, next) => notificationsController.getUnreadCount(req, res, next));
notificationsRouter.patch("/:id/read", authenticate, (req, res, next) => notificationsController.markAsRead(req, res, next));
notificationsRouter.post("/mark-all-read", authenticate, (req, res, next) => notificationsController.markAllAsRead(req, res, next));
