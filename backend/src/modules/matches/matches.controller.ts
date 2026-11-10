import { Request, Response, NextFunction } from "express";
import { matchesService } from "./matches.service";
import { sendSuccess } from "../../utils/response";

export class MatchesController {
  async details(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUserId = req.user?._id.toString();
      if (!currentUserId) {
        throw new Error("Authentication required");
      }
      const match = await matchesService.getMatchDetails(currentUserId, req.params.userId as string);
      sendSuccess(res, { match });
    } catch (error) {
      next(error);
    }
  }

  async discover(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUserId = req.user?._id.toString();
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;
      const format = req.query.format as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 12;

      const result = await matchesService.discoverMatches(currentUserId, {
        category,
        search,
        format,
        page,
        limit,
      });

      sendSuccess(res, result.matches, result.meta);
    } catch (error) {
      next(error);
    }
  }
}

export const matchesController = new MatchesController();
