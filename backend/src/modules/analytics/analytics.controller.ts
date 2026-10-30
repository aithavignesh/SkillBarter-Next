import { Request, Response, NextFunction } from "express";
import { analyticsService } from "./analytics.service";
import { trackEventSchema } from "@skillbarter/shared";
import { sendSuccess } from "../../utils/response";

export class AnalyticsController {
  async track(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = trackEventSchema.parse(req.body);
      const userId = req.user?._id.toString();
      await analyticsService.trackEvent(input, userId);
      sendSuccess(res, { tracked: true });
    } catch (error) {
      next(error);
    }
  }

  async getSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await analyticsService.getSummary();
      sendSuccess(res, { summary });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
