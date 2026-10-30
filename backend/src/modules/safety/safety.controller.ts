import { Request, Response, NextFunction } from "express";
import { safetyService } from "./safety.service";
import { blockUserSchema, createReportSchema } from "@skillbarter/shared";
import { sendSuccess } from "../../utils/response";
import { AppError } from "../../middleware/errorHandler";

export class SafetyController {
  async blockUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const input = blockUserSchema.parse(req.body);
      await safetyService.blockUser(req.user._id.toString(), input.userId, input.reason);
      sendSuccess(res, { message: "User blocked successfully" });
    } catch (error) {
      next(error);
    }
  }

  async unblockUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      await safetyService.unblockUser(req.user._id.toString(), req.params.userId as string);
      sendSuccess(res, { message: "User unblocked successfully" });
    } catch (error) {
      next(error);
    }
  }

  async listBlockedUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const blockedUsers = await safetyService.listBlockedUsers(req.user._id.toString());
      sendSuccess(res, { blockedUsers });
    } catch (error) {
      next(error);
    }
  }

  async createReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const input = createReportSchema.parse(req.body);
      const report = await safetyService.createReport(req.user._id.toString(), input);
      sendSuccess(res, { report }, undefined, 201);
    } catch (error) {
      next(error);
    }
  }
}

export const safetyController = new SafetyController();
