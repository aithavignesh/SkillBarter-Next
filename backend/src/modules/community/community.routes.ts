import { Router } from "express";
import { communityController } from "./community.controller";
import { authenticate, optionalAuth, requireOnboardingCompleted } from "../../middleware/auth";

export const communityRouter = Router();

// Connections
communityRouter.use("/connections", authenticate, requireOnboardingCompleted);
communityRouter.post("/connections", (req, res, next) => communityController.requestConnection(req, res, next));
communityRouter.patch("/connections/:id/accept", (req, res, next) => communityController.acceptConnection(req, res, next));
communityRouter.delete("/connections/:id", (req, res, next) => communityController.removeConnection(req, res, next));
communityRouter.get("/connections", (req, res, next) => communityController.listConnections(req, res, next));

// Community Posts
communityRouter.post("/posts", (req, res, next) => communityController.createPost(req, res, next));
communityRouter.get("/posts", optionalAuth, (req, res, next) => communityController.listPosts(req, res, next));
communityRouter.post("/posts/:id/like", (req, res, next) => communityController.likePost(req, res, next));
communityRouter.delete("/posts/:id/like", (req, res, next) => communityController.unlikePost(req, res, next));
communityRouter.delete("/posts/:id", (req, res, next) => communityController.deletePost(req, res, next));
