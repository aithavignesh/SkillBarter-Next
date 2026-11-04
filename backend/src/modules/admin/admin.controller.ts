import { Request, Response, NextFunction } from "express";
import { adminService } from "./admin.service";
import { adminUpdateUserSchema, adminReportActionSchema } from "@skillbarter/shared";
import { sendSuccess } from "../../utils/response";
import { AppError } from "../../middleware/errorHandler";

export class AdminController {
  async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminService.getPlatformStats();
      sendSuccess(res, { stats });
    } catch (error) {
      next(error);
    }
  }

  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string | undefined;
      const role = req.query.role as string | undefined;

      const result = await adminService.listUsers(page, limit, search, role);
      sendSuccess(res, result.users, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const input = adminUpdateUserSchema.parse(req.body);
      if (input.role !== undefined && req.user.role !== "owner") {
        throw new AppError("Only the platform owner can grant or revoke administrator access", 403, "OWNER_REQUIRED");
      }
      const user = await adminService.updateUser(
        req.user._id.toString(),
        req.params.id as string,
        input,
        req.ip
      );
      sendSuccess(res, { user });
    } catch (error) {
      next(error);
    }
  }

  async listReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const status = req.query.status as string | undefined;

      const result = await adminService.listReports(page, limit, status);
      sendSuccess(res, result.reports, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async handleReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const input = adminReportActionSchema.parse(req.body);
      const report = await adminService.handleReport(
        req.user._id.toString(),
        req.params.id as string,
        input,
        req.ip
      );
      sendSuccess(res, { report });
    } catch (error) {
      next(error);
    }
  }

  async listAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const action = req.query.action as string | undefined;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;

      const result = await adminService.listAuditLogs(page, limit, action, from, to);
      sendSuccess(res, result.logs, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async bootstrapAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { secretKey, email, password, displayName } = req.body;
      if (!secretKey || !email || !password || !displayName) {
        throw new AppError("Missing bootstrap parameters", 400, "MISSING_PARAMS");
      }
      const admin = await adminService.bootstrapAdmin(secretKey, email, password, displayName);
      sendSuccess(res, { message: "Admin bootstrapped successfully", adminId: admin._id.toString() });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
