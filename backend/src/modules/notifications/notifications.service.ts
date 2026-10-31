import mongoose from "mongoose";
import { Notification } from "../../models/Notification";
import { NotificationDto } from "@skillbarter/shared";
import { AppError } from "../../middleware/errorHandler";

export class NotificationsService {
  async getUserNotifications(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<{ notifications: NotificationDto[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const normalizedPage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    const normalizedLimit = Number.isFinite(limit) ? Math.min(100, Math.max(1, Math.floor(limit))) : 20;
    const userObjId = new mongoose.Types.ObjectId(userId);
    const skip = (normalizedPage - 1) * normalizedLimit;

    const [notifications, total] = await Promise.all([
      Notification.find({ recipientId: userObjId })
        .populate("senderId", "displayName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(normalizedLimit),
      Notification.countDocuments({ recipientId: userObjId }),
    ]);

    const formatted: NotificationDto[] = notifications.map((n) => {
      const sender = n.senderId as unknown as { displayName?: string };
      return {
        id: n._id.toString(),
        recipientId: n.recipientId.toString(),
        senderId: n.senderId?._id?.toString(),
        senderName: sender?.displayName,
        type: n.type as NotificationDto["type"],
        title: n.title,
        message: n.message,
        link: n.link,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
      };
    });

    return {
      notifications: formatted,
      meta: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages: Math.ceil(total / normalizedLimit),
      },
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({
      recipientId: new mongoose.Types.ObjectId(userId),
      read: false,
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notif = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { read: true }
    );
    if (!notif) {
      throw new AppError("Notification not found", 404, "NOT_FOUND");
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany(
      { recipientId: new mongoose.Types.ObjectId(userId), read: false },
      { read: true }
    );
  }
}

export const notificationsService = new NotificationsService();
