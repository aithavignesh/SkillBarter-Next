import { Request, Response, NextFunction } from "express";
import { messagesService } from "./messages.service";
import { sendMessageSchema } from "@skillbarter/shared";
import { sendSuccess } from "../../utils/response";
import { AppError } from "../../middleware/errorHandler";

export class MessagesController {
  async listConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const conversations = await messagesService.listConversations(req.user._id.toString());
      sendSuccess(res, { conversations });
    } catch (error) {
      next(error);
    }
  }

  async getConversationMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await messagesService.getConversationMessages(
        req.params.conversationId as string,
        req.user._id.toString(),
        page,
        limit
      );
      sendSuccess(res, result.messages, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const input = sendMessageSchema.parse(req.body);
      const message = await messagesService.sendMessage(
        req.params.conversationId as string,
        req.user._id.toString(),
        input.content
      );
      sendSuccess(res, { message }, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  async getOrCreateConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const targetUserId = req.body.targetUserId as string;
      if (!targetUserId) throw new AppError("targetUserId is required", 400, "MISSING_FIELD");

      const conversation = await messagesService.getOrCreateConversation(
        req.user._id.toString(),
        targetUserId
      );
      sendSuccess(res, { conversation });
    } catch (error) {
      next(error);
    }
  }
}

export const messagesController = new MessagesController();
