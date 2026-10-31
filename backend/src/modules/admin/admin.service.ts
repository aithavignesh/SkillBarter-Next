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
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { displayName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role && role !== "all") {
      filter.role = role;
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
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
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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

    const changes: Record<string, unknown> = {};

    if (input.role !== undefined) {
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
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate("reporterId", "displayName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
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
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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

    report.status = input.status;
    report.resolvedById = new mongoose.Types.ObjectId(adminId);
    if (input.moderationNotes) {
      report.moderationNotes = input.moderationNotes;
    }

    if (input.actionTaken === "account_suspended" && report.targetType === "user") {
      await User.findByIdAndUpdate(report.targetId, {
        isSuspended: true,
        suspensionReason: `Suspended following report review: ${input.moderationNotes || report.reason}`,
      });
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

  async listAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find()
        .populate("actorId", "displayName email")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(),
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
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async bootstrapAdmin(secretKey: string, email: string, password: string, displayName: string): Promise<IUser> {
    // A separate, high-entropy bootstrap secret must be configured explicitly.
    if (!env.ADMIN_BOOTSTRAP_SECRET || secretKey !== env.ADMIN_BOOTSTRAP_SECRET) {
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
    admin = await User.create({
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
