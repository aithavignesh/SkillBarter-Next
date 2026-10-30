import { Request, Response, NextFunction } from "express";
import { reviewsService } from "./reviews.service";
import { createReviewSchema } from "@skillbarter/shared";
import { sendSuccess } from "../../utils/response";
import { AppError } from "../../middleware/errorHandler";

export class ReviewsController {
  async createReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const input = createReviewSchema.parse(req.body);
      const review = await reviewsService.createReview(req.user._id.toString(), input);
      sendSuccess(res, { review }, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  async getUserReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reviews = await reviewsService.getUserReviews(req.params.userId as string);
      sendSuccess(res, { reviews });
    } catch (error) {
      next(error);
    }
  }
}

export const reviewsController = new ReviewsController();
