import mongoose from "mongoose";
import { Conversation, IConversation } from "../../models/Conversation";
import { Message, IMessage } from "../../models/Message";
import { User } from "../../models/User";
import { Block } from "../../models/Block";
import { Notification } from "../../models/Notification";
import { ConversationDto, MessageDto } from "@skillbarter/shared";
import { AppError } from "../../middleware/errorHandler";

export class MessagesService {
  async listConversations(userId: string): Promise<ConversationDto[]> {
    const userObjId = new mongoose.Types.ObjectId(userId);
    const conversations = await Conversation.find({ participants: userObjId })
      .populate("participants", "displayName avatarUrl")
      .sort({ lastMessageAt: -1 });

    const results: ConversationDto[] = [];

    for (const conv of conversations) {
      // Count unread messages for this user
      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        senderId: { $ne: userObjId },
        readBy: { $ne: userObjId },
      });

      const participants = (conv.participants as unknown as Array<{ _id: mongoose.Types.ObjectId; displayName: string; avatarUrl?: string }>).map((p) => ({
        id: p._id.toString(),
        displayName: p.displayName,
        avatarUrl: p.avatarUrl,
      }));

      results.push({
        id: conv._id.toString(),
        participants,
        exchangeId: conv.exchangeId?.toString(),
        lastMessage: conv.lastMessageText
          ? {
              content: conv.lastMessageText,
              senderId: conv.lastMessageSenderId?.toString() || "",
              createdAt: conv.lastMessageAt.toISOString(),
            }
          : undefined,
        unreadCount,
        updatedAt: conv.updatedAt.toISOString(),
      });
    }

    return results;
  }

  async getConversationMessages(
    conversationId: string,
    userId: string,
    page = 1,
    limit = 50
  ): Promise<{ messages: MessageDto[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const conv = await Conversation.findById(conversationId);
    if (!conv) {
      throw new AppError("Conversation not found", 404, "NOT_FOUND");
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const isParticipant = conv.participants.some((p) => p.toString() === userId);
    if (!isParticipant) {
      throw new AppError("Unauthorized access to conversation", 403, "FORBIDDEN");
    }

    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      Message.find({ conversationId })
        .populate("senderId", "displayName")
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit),
      Message.countDocuments({ conversationId }),
    ]);

    // Mark unread messages as read by this user
    await Message.updateMany(
      { conversationId, senderId: { $ne: userObjId }, readBy: { $ne: userObjId } },
      { $addToSet: { readBy: userObjId } }
    );

    const formattedMessages: MessageDto[] = messages.map((m) => {
      const sender = m.senderId as unknown as { displayName?: string };
      return {
        id: m._id.toString(),
        conversationId: m.conversationId.toString(),
        senderId: m.senderId._id ? m.senderId._id.toString() : m.senderId.toString(),
        senderName: sender?.displayName,
        content: m.content,
        readBy: m.readBy.map((id) => id.toString()),
        createdAt: m.createdAt.toISOString(),
      };
    });

    return {
      messages: formattedMessages,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async sendMessage(conversationId: string, senderId: string, content: string): Promise<MessageDto> {
    const conv = await Conversation.findById(conversationId);
    if (!conv) {
      throw new AppError("Conversation not found", 404, "NOT_FOUND");
    }

    const senderObjId = new mongoose.Types.ObjectId(senderId);
    const isParticipant = conv.participants.some((p) => p.toString() === senderId);
    if (!isParticipant) {
      throw new AppError("Unauthorized to send message in this conversation", 403, "FORBIDDEN");
    }

    const recipientId = conv.participants.find((p) => p.toString() !== senderId);
    if (recipientId) {
      // Check blocking
      const isBlocked = await Block.findOne({
        $or: [
          { blockerId: senderObjId, blockedUserId: recipientId },
          { blockerId: recipientId, blockedUserId: senderObjId },
        ],
      });
      if (isBlocked) {
        throw new AppError("Cannot send messages to this user", 403, "BLOCKED");
      }
    }

    const message = await Message.create({
      conversationId: conv._id,
      senderId: senderObjId,
      content: content.trim(),
      readBy: [senderObjId],
    });

    conv.lastMessageAt = new Date();
    conv.lastMessageText = content.slice(0, 100);
    conv.lastMessageSenderId = senderObjId;
    await conv.save();

    if (recipientId) {
      const senderUser = await User.findById(senderId);
      await Notification.create({
        recipientId,
        senderId: senderObjId,
        type: "NEW_MESSAGE",
        title: "New Message",
        message: `${senderUser?.displayName || "A user"}: ${content.slice(0, 50)}...`,
        link: `/messages?c=${conv._id.toString()}`,
      });
    }

    const senderUser = await User.findById(senderId);

    return {
      id: message._id.toString(),
      conversationId: message.conversationId.toString(),
      senderId,
      senderName: senderUser?.displayName,
      content: message.content,
      readBy: message.readBy.map((id) => id.toString()),
      createdAt: message.createdAt.toISOString(),
    };
  }

  async getOrCreateConversation(userId: string, targetUserId: string): Promise<{ id: string }> {
    if (userId === targetUserId) {
      throw new AppError("Cannot message yourself", 400, "INVALID_TARGET");
    }

    const u1 = new mongoose.Types.ObjectId(userId);
    const u2 = new mongoose.Types.ObjectId(targetUserId);

    let conv = await Conversation.findOne({
      participants: { $all: [u1, u2] },
    });

    if (!conv) {
      conv = await Conversation.create({
        participants: [u1, u2],
        lastMessageAt: new Date(),
      });
    }

    return { id: conv._id.toString() };
  }
}

export const messagesService = new MessagesService();
