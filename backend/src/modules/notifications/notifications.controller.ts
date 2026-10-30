import { Request, Response, NextFunction } from "express";
import { notificationsService } from "./notifications.service";
import { sendSuccess } from "../../utils/response";
import { AppError } from "../../middleware/errorHandler";

export class NotificationsController {
  async listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await notificationsService.getUserNotifications(
        req.user._id.toString(),
        page,
        limit
      );
      sendSuccess(res, result.notifications, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const count = await notificationsService.getUnreadCount(req.user._id.toString());
      sendSuccess(res, { unreadCount: count });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      await notificationsService.markAsRead(req.params.id as string, req.user._id.toString());
      sendSuccess(res, { message: "Marked as read" });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      await notificationsService.markAllAsRead(req.user._id.toString());
      sendSuccess(res, { message: "All notifications marked as read" });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationsController = new NotificationsController();
