import { Request, Response, NextFunction } from "express";
import { usersService } from "./users.service";
import { onboardingSchema, profileUpdateSchema } from "@skillbarter/shared";
import { sendSuccess } from "../../utils/response";
import { formatAuthUser } from "../auth/auth.service";
import { AppError } from "../../middleware/errorHandler";

export class UsersController {
  async completeOnboarding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const input = onboardingSchema.parse(req.body);
      const updatedUser = await usersService.completeOnboarding(req.user._id.toString(), input);
      sendSuccess(res, { user: formatAuthUser(updatedUser) });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const targetUserId = req.params.id as string;
      const requestingUserId = req.user?._id.toString();
      const profile = await usersService.getPublicProfile(targetUserId, requestingUserId);
      sendSuccess(res, { profile });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const input = profileUpdateSchema.parse(req.body);
      const updatedUser = await usersService.updateProfile(req.user._id.toString(), input);
      sendSuccess(res, { user: formatAuthUser(updatedUser) });
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
