import { Request, Response, NextFunction } from "express";
import { communityService } from "./community.service";
import { createPostSchema } from "@skillbarter/shared";
import { sendSuccess } from "../../utils/response";
import { AppError } from "../../middleware/errorHandler";

export class CommunityController {
  // Connections
  async requestConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const recipientId = req.body.recipientId as string;
      if (!recipientId) throw new AppError("recipientId is required", 400, "MISSING_FIELD");

      const connection = await communityService.requestConnection(
        req.user._id.toString(),
        recipientId
      );
      sendSuccess(res, { connection }, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  async acceptConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const connection = await communityService.acceptConnection(
        req.params.id as string,
        req.user._id.toString()
      );
      sendSuccess(res, { connection });
    } catch (error) {
      next(error);
    }
  }

  async removeConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      await communityService.removeConnection(req.params.id as string, req.user._id.toString());
      sendSuccess(res, { message: "Connection removed" });
    } catch (error) {
      next(error);
    }
  }

  async listConnections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const status = req.query.status as string | undefined;
      const connections = await communityService.listConnections(
        req.user._id.toString(),
        status
      );
      sendSuccess(res, { connections });
    } catch (error) {
      next(error);
    }
  }

  // Community Posts
  async createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const input = createPostSchema.parse(req.body);
      const post = await communityService.createPost(req.user._id.toString(), input);
      sendSuccess(res, { post }, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  async listPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await communityService.listPosts(page, limit, req.user?._id.toString());
      sendSuccess(res, result.posts, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async likePost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const post = await communityService.likePost(req.params.id as string, req.user._id.toString());
      sendSuccess(res, { post });
    } catch (error) {
      next(error);
    }
  }

  async unlikePost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const post = await communityService.unlikePost(req.params.id as string, req.user._id.toString());
      sendSuccess(res, { post });
    } catch (error) {
      next(error);
    }
  }

  async deletePost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const isAdmin = req.user.role === "admin";
      await communityService.deletePost(req.params.id as string, req.user._id.toString(), isAdmin);
      sendSuccess(res, { message: "Post deleted" });
    } catch (error) {
      next(error);
    }
  }
}

export const communityController = new CommunityController();
