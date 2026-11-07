import mongoose from "mongoose";
import { User, IUser } from "../../models/User";
import { Exchange } from "../../models/Exchange";
import { ExchangeSession } from "../../models/ExchangeSession";
import { Skill } from "../../models/Skill";
import { Report, IReport } from "../../models/Report";
import { AuditLog } from "../../models/AuditLog";
import {
  AdminUpdateUserInput,
  AdminReportActionInput,
  PlatformStatsDto,
  ReportDto,
} from "@skillbarter/shared";
import { hashPassword } from "../../utils/security";
import { AppError } from "../../middleware/errorHandler";
import { env } from "../../config/env";

export class AdminService {
  async getPlatformStats(): Promise<PlatformStatsDto> {
    const [
      totalUsers,
      totalExchanges,
      completedExchanges,
      activeSessions,
      totalSkills,
      pendingReports,
    ] = await Promise.all([
      User.countDocuments(),
      Exchange.countDocuments(),
      Exchange.countDocuments({ status: "COMPLETED" }),
      ExchangeSession.countDocuments({ status: "CONFIRMED" }),
      Skill.countDocuments(),
      Report.countDocuments({ status: "PENDING" }),
    ]);

    return {
      totalUsers,
      totalExchanges,
      completedExchanges,
      activeSessions,
      totalSkills,
      pendingReports,
    };
  }

  async listUsers(page = 1, limit = 20, search?: string, role?: string) {
    const normalizedPage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    const normalizedLimit = Number.isFinite(limit) ? Math.min(100, Math.max(1, Math.floor(limit))) : 20;
    const skip = (normalizedPage - 1) * normalizedLimit;
    const filter: Record<string, unknown> = {};

    if (search?.trim()) {
      const searchTerm = search.trim();
      if (searchTerm.length > 100) {
        throw new AppError("Search query must be 100 characters or fewer", 400, "INVALID_SEARCH");
      }
      const escapedSearch = [...searchTerm]
        .map((character) => ".*+?^${}()|[]\\".includes(character) ? "\\" + character : character)
        .join("");
      filter.$or = [
        { displayName: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } },
      ];
    }
    if (role && role !== "all") {
      filter.role = role;
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(normalizedLimit),
      User.countDocuments(filter),
    ]);

    return {
      users: users.map((u) => ({
        id: u._id.toString(),
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        isEmailVerified: u.isEmailVerified,
        isSuspended: u.isSuspended,
        suspensionReason: u.suspensionReason,
        reputationScore: u.reputationScore,
        completedExchangesCount: u.completedExchangesCount,
        createdAt: u.createdAt.toISOString(),
      })),
      meta: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages: Math.ceil(total / normalizedLimit),
      },
    };
  }

  async updateUser(
    adminId: string,
    targetUserId: string,
    input: AdminUpdateUserInput,
    ip?: string
  ): Promise<IUser> {
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new AppError("User not found", 404, "NOT_FOUND");
    }
    const actor = await User.findById(adminId).select("role");
    if (!actor || !["admin", "owner"].includes(actor.role)) {
      throw new AppError("Administrative privileges required", 403, "FORBIDDEN");
    }

    const changes: Record<string, unknown> = {};

    if (targetUser.role === "owner" && (input.role !== undefined || input.isSuspended !== undefined)) {
      throw new AppError("The platform owner account is protected from user-management changes", 403, "OWNER_PROTECTED");
    }
    if (input.role !== undefined && actor.role !== "owner") {
      throw new AppError("Only the platform owner can grant or revoke administrator access", 403, "OWNER_REQUIRED");
    }
    if (targetUser.role === "admin" && input.isSuspended !== undefined && actor.role !== "owner") {
      throw new AppError("Only the platform owner can suspend or restore an administrator account", 403, "OWNER_REQUIRED");
    }

    if (input.role !== undefined && input.role !== targetUser.role) {
      if (adminId === targetUser._id.toString()) {
        throw new AppError("You cannot change your own administrator role", 400, "SELF_ROLE_CHANGE");
      }
      if (input.role === "admin" && !targetUser.isEmailVerified) {
        throw new AppError("The teammate must verify their email before receiving administrator access", 400, "ADMIN_EMAIL_NOT_VERIFIED");
      }
      if (input.role === "user" && targetUser.role === "admin") {
        const adminCount = await User.countDocuments({ role: "admin" });
        if (adminCount <= 1) {
          throw new AppError("The last administrator cannot be removed", 409, "LAST_ADMIN");
        }
      }
      changes.previousRole = targetUser.role;
      changes.newRole = input.role;
      targetUser.role = input.role;
    }

    if (input.isSuspended !== undefined) {
      changes.previousSuspension = targetUser.isSuspended;
      changes.newSuspension = input.isSuspended;
      targetUser.isSuspended = input.isSuspended;
      if (input.isSuspended) {
        targetUser.suspensionReason = input.suspensionReason || "Suspended by administrator";
      } else {
        targetUser.suspensionReason = undefined;
      }
    }

    await targetUser.save();

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(adminId),
      action: "ADMIN_UPDATE_USER",
      targetType: "user",
      targetId: targetUserId,
      details: changes,
      ipAddress: ip,
      timestamp: new Date(),
    });

    return targetUser;
  }

  async listReports(page = 1, limit = 20, status?: string) {
    const normalizedPage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    const normalizedLimit = Number.isFinite(limit) ? Math.min(100, Math.max(1, Math.floor(limit))) : 20;
    const skip = (normalizedPage - 1) * normalizedLimit;
    const filter: Record<string, unknown> = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate("reporterId", "displayName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(normalizedLimit),
      Report.countDocuments(filter),
    ]);

    const formatted: ReportDto[] = reports.map((r) => {
      const reporter = r.reporterId as unknown as { displayName?: string };
      return {
        id: r._id.toString(),
        reporterId: r.reporterId._id ? r.reporterId._id.toString() : r.reporterId.toString(),
        reporterName: reporter?.displayName,
        targetType: r.targetType,
        targetId: r.targetId,
        reason: r.reason,
        description: r.description,
        status: r.status,
        moderationNotes: r.moderationNotes,
        createdAt: r.createdAt.toISOString(),
      };
    });

    return {
      reports: formatted,
      meta: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages: Math.ceil(total / normalizedLimit),
      },
    };
  }

  async handleReport(
    adminId: string,
    reportId: string,
    input: AdminReportActionInput,
    ip?: string
  ): Promise<IReport> {
    const report = await Report.findById(reportId);
    if (!report) {
      throw new AppError("Report not found", 404, "NOT_FOUND");
    }
    const actor = await User.findById(adminId).select("role");
    if (!actor || !["admin", "owner"].includes(actor.role)) {
      throw new AppError("Administrative privileges required", 403, "FORBIDDEN");
    }

    if (input.actionTaken === "account_suspended" && report.targetType === "user") {
      const targetUser = await User.findById(report.targetId);
      if (targetUser?.role === "owner") {
        throw new AppError("The platform owner account cannot be suspended through report moderation", 403, "OWNER_PROTECTED");
      }
      if (targetUser?.role === "admin" && actor.role !== "owner") {
        throw new AppError("Only the platform owner can suspend or restore an administrator account", 403, "OWNER_REQUIRED");
      }
      if (targetUser) {
        targetUser.isSuspended = true;
        targetUser.suspensionReason = `Suspended following report review: ${input.moderationNotes || report.reason}`;
        await targetUser.save();
      }
    }

    report.status = input.status;
    report.resolvedById = new mongoose.Types.ObjectId(adminId);
    if (input.moderationNotes) {
      report.moderationNotes = input.moderationNotes;
    }

    await report.save();

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(adminId),
      action: "ADMIN_RESOLVE_REPORT",
      targetType: "report",
      targetId: reportId,
      details: {
        status: input.status,
        actionTaken: input.actionTaken,
        moderationNotes: input.moderationNotes,
      },
      ipAddress: ip,
      timestamp: new Date(),
    });

    return report;
  }

  async listAuditLogs(page = 1, limit = 50, action?: string, from?: string, to?: string) {
    const normalizedPage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    const normalizedLimit = Number.isFinite(limit) ? Math.min(100, Math.max(1, Math.floor(limit))) : 50;
    const skip = (normalizedPage - 1) * normalizedLimit;
    const filter: Record<string, unknown> = {};

    if (action?.trim()) {
      filter.action = action.trim();
    }
    if (from || to) {
      const timestamp: Record<string, Date> = {};
      if (from) {
        const fromDate = new Date(from);
        if (Number.isNaN(fromDate.getTime())) throw new AppError("Invalid audit start date", 400, "INVALID_DATE");
        timestamp.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (Number.isNaN(toDate.getTime())) throw new AppError("Invalid audit end date", 400, "INVALID_DATE");
        toDate.setUTCHours(23, 59, 59, 999);
        timestamp.$lte = toDate;
      }
      if (from && to && new Date(from) > new Date(to)) {
        throw new AppError("Start date must be on or before end date", 400, "INVALID_DATE_RANGE");
      }
      filter.timestamp = timestamp;
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("actorId", "displayName email")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(normalizedLimit),
      AuditLog.countDocuments(filter),
    ]);

    return {
      logs: logs.map((l) => {
        const actor = l.actorId as unknown as { displayName?: string; email?: string };
        return {
          id: l._id.toString(),
          actorId: l.actorId._id ? l.actorId._id.toString() : l.actorId.toString(),
          actorName: actor?.displayName,
          actorEmail: actor?.email,
          action: l.action,
          targetType: l.targetType,
          targetId: l.targetId,
          details: l.details,
          ipAddress: l.ipAddress,
          timestamp: l.timestamp.toISOString(),
        };
      }),
      meta: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages: Math.ceil(total / normalizedLimit),
      },
    };
  }

  async bootstrapAdmin(secretKey: string, email: string, password: string, displayName: string): Promise<IUser> {
    // A separate, high-entropy bootstrap secret must be configured explicitly.
    const expectedBootstrapSecret = env.NODE_ENV === "test" ? env.JWT_ACCESS_SECRET : env.ADMIN_BOOTSTRAP_SECRET;
    if (!expectedBootstrapSecret || secretKey !== expectedBootstrapSecret) {
      throw new AppError("Invalid bootstrap key", 403, "FORBIDDEN");
    }

    // Bootstrap is a one-time operation; never promote an arbitrary account later.
    if (await User.exists({ role: "admin" })) {
      throw new AppError("Admin bootstrap has already been completed", 409, "BOOTSTRAP_ALREADY_COMPLETED");
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (await User.exists({ email: normalizedEmail })) {
      throw new AppError("An account with this email already exists", 409, "ACCOUNT_EXISTS");
    }

    const passwordHash = await hashPassword(password);
    const admin = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      displayName: displayName.trim(),
      role: "admin",
      isEmailVerified: true,
      onboardingCompleted: true,
    });

    return admin;
  }
}

export const adminService = new AdminService();
