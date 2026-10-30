import { Router } from "express";
import { adminController } from "./admin.controller";
import { authenticate, requireRole } from "../../middleware/auth";

export const adminRouter = Router();

// Bootstrap endpoint (secured by bootstrap key)
adminRouter.post("/bootstrap", (req, res, next) => adminController.bootstrapAdmin(req, res, next));

// Protected admin endpoints
adminRouter.use(authenticate, requireRole("admin"));

adminRouter.get("/stats", (req, res, next) => adminController.getStats(req, res, next));
adminRouter.get("/users", (req, res, next) => adminController.listUsers(req, res, next));
adminRouter.patch("/users/:id", (req, res, next) => adminController.updateUser(req, res, next));
adminRouter.get("/reports", (req, res, next) => adminController.listReports(req, res, next));
adminRouter.patch("/reports/:id", (req, res, next) => adminController.handleReport(req, res, next));
adminRouter.get("/audit-logs", (req, res, next) => adminController.listAuditLogs(req, res, next));
