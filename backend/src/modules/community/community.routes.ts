import { Router } from "express";
import { communityController } from "./community.controller";
import { authenticate, optionalAuth } from "../../middleware/auth";

export const communityRouter = Router();

// Connections
communityRouter.post("/connections", authenticate, (req, res, next) => communityController.requestConnection(req, res, next));
communityRouter.patch("/connections/:id/accept", authenticate, (req, res, next) => communityController.acceptConnection(req, res, next));
communityRouter.delete("/connections/:id", authenticate, (req, res, next) => communityController.removeConnection(req, res, next));
communityRouter.get("/connections", authenticate, (req, res, next) => communityController.listConnections(req, res, next));

// Community Posts
communityRouter.post("/posts", authenticate, (req, res, next) => communityController.createPost(req, res, next));
communityRouter.get("/posts", optionalAuth, (req, res, next) => communityController.listPosts(req, res, next));
communityRouter.delete("/posts/:id", authenticate, (req, res, next) => communityController.deletePost(req, res, next));
