import { Request, Response, NextFunction } from "express";
import { exchangesService } from "./exchanges.service";
import {
  createExchangeSchema,
  updateExchangeStatusSchema,
  createSessionSchema,
  updateSessionStatusSchema,
  disputeExchangeSchema,
} from "@skillbarter/shared";
import { sendSuccess } from "../../utils/response";
import { AppError } from "../../middleware/errorHandler";

export class ExchangesController {
  async createExchange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const input = createExchangeSchema.parse(req.body);
      const exchange = await exchangesService.createExchange(req.user._id.toString(), input);
      sendSuccess(res, { exchange }, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  async listUserExchanges(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const status = req.query.status as string | undefined;
      const exchanges = await exchangesService.listUserExchanges(req.user._id.toString(), status);
      sendSuccess(res, { exchanges });
    } catch (error) {
      next(error);
    }
  }

  async getExchangeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const exchange = await exchangesService.getExchangeById(
        req.params.id as string,
        req.user._id.toString()
      );
      sendSuccess(res, { exchange });
    } catch (error) {
      next(error);
    }
  }

  async updateExchangeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const input = updateExchangeStatusSchema.parse(req.body);
      const exchange = await exchangesService.updateExchangeStatus(
        req.params.id as string,
        req.user._id.toString(),
        input
      );
      sendSuccess(res, { exchange });
    } catch (error) {
      next(error);
    }
  }

  async confirmCompletion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const exchange = await exchangesService.confirmCompletion(
        req.params.id as string,
        req.user._id.toString()
      );
      sendSuccess(res, { exchange });
    } catch (error) {
      next(error);
    }
  }

  async disputeExchange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const input = disputeExchangeSchema.parse(req.body);
      const exchange = await exchangesService.disputeExchange(
        req.params.id as string,
        req.user._id.toString(),
        input.reason
      );
      sendSuccess(res, { exchange });
    } catch (error) {
      next(error);
    }
  }

  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const input = createSessionSchema.parse(req.body);
      if (input.exchangeId !== req.params.id) {
        throw new AppError(
          "The session exchange ID must match the exchange in the URL",
          400,
          "EXCHANGE_ID_MISMATCH"
        );
      }
      const session = await exchangesService.createSession(req.user._id.toString(), input);
      sendSuccess(res, { session }, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  async listSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const sessions = await exchangesService.listSessions(
        req.params.id as string,
        req.user._id.toString()
      );
      sendSuccess(res, { sessions });
    } catch (error) {
      next(error);
    }
  }

  async updateSessionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const input = updateSessionStatusSchema.parse(req.body);
      const session = await exchangesService.updateSessionStatus(
        req.params.sessionId as string,
        req.user._id.toString(),
        input
      );
      sendSuccess(res, { session });
    } catch (error) {
      next(error);
    }
  }
}

export const exchangesController = new ExchangesController();
