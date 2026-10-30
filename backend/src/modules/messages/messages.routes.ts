import { Router } from "express";
import { messagesController } from "./messages.controller";
import { authenticate } from "../../middleware/auth";

export const messagesRouter = Router();

messagesRouter.get("/conversations", authenticate, (req, res, next) => messagesController.listConversations(req, res, next));
messagesRouter.post("/conversations", authenticate, (req, res, next) => messagesController.getOrCreateConversation(req, res, next));
messagesRouter.get("/conversations/:conversationId", authenticate, (req, res, next) => messagesController.getConversationMessages(req, res, next));
messagesRouter.post("/conversations/:conversationId", authenticate, (req, res, next) => messagesController.sendMessage(req, res, next));
