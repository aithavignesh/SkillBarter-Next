import { Router } from "express";
import { messagesController } from "./messages.controller";
import { authenticate, requireOnboardingCompleted } from "../../middleware/auth";

export const messagesRouter = Router();

messagesRouter.use(authenticate, requireOnboardingCompleted);

messagesRouter.get("/conversations", (req, res, next) => messagesController.listConversations(req, res, next));
messagesRouter.post("/conversations", (req, res, next) => messagesController.getOrCreateConversation(req, res, next));
messagesRouter.get("/conversations/:conversationId", (req, res, next) => messagesController.getConversationMessages(req, res, next));
messagesRouter.post("/conversations/:conversationId", (req, res, next) => messagesController.sendMessage(req, res, next));
