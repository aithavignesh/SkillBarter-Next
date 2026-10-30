import mongoose from "mongoose";
import { Block } from "../../models/Block";
import { Report, IReport } from "../../models/Report";
import { User } from "../../models/User";
import { CreateReportInput, ReportDto } from "@skillbarter/shared";
import { AppError } from "../../middleware/errorHandler";

export class SafetyService {
  async blockUser(blockerId: string, blockedUserId: string, reason?: string): Promise<void> {
    if (blockerId === blockedUserId) {
      throw new AppError("You cannot block yourself", 400, "INVALID_TARGET");
    }

    const targetUser = await User.findById(blockedUserId);
    if (!targetUser) {
      throw new AppError("Target user not found", 404, "NOT_FOUND");
    }

    await Block.findOneAndUpdate(
      {
        blockerId: new mongoose.Types.ObjectId(blockerId),
        blockedUserId: new mongoose.Types.ObjectId(blockedUserId),
      },
      {
        blockerId: new mongoose.Types.ObjectId(blockerId),
        blockedUserId: new mongoose.Types.ObjectId(blockedUserId),
        reason: reason || "",
      },
      { upsert: true, new: true }
    );
  }

  async unblockUser(blockerId: string, blockedUserId: string): Promise<void> {
    const result = await Block.deleteOne({
      blockerId: new mongoose.Types.ObjectId(blockerId),
      blockedUserId: new mongoose.Types.ObjectId(blockedUserId),
    });

    if (result.deletedCount === 0) {
      throw new AppError("User is not currently blocked", 404, "NOT_BLOCKED");
    }
  }

  async listBlockedUsers(blockerId: string) {
    const blocks = await Block.find({ blockerId: new mongoose.Types.ObjectId(blockerId) })
      .populate("blockedUserId", "displayName avatarUrl")
      .sort({ createdAt: -1 });

    return blocks.map((b) => {
      const user = b.blockedUserId as unknown as { _id: mongoose.Types.ObjectId; displayName: string; avatarUrl?: string };
      return {
        id: b._id.toString(),
        userId: user._id ? user._id.toString() : b.blockedUserId.toString(),
        displayName: user?.displayName,
        avatarUrl: user?.avatarUrl,
        reason: b.reason,
        createdAt: b.createdAt.toISOString(),
      };
    });
  }

  async createReport(reporterId: string, input: CreateReportInput): Promise<ReportDto> {
    const reporter = await User.findById(reporterId);

    const report = await Report.create({
      reporterId: new mongoose.Types.ObjectId(reporterId),
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason.trim(),
      description: input.description.trim(),
      status: "PENDING",
    });

    return {
      id: report._id.toString(),
      reporterId,
      reporterName: reporter?.displayName,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason,
      description: report.description,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
    };
  }
}

export const safetyService = new SafetyService();
