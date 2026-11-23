import mongoose from "mongoose";
import { User, IUser } from "../models/User";
import { AuditLog } from "../models/AuditLog";
import { UserSkill } from "../models/UserSkill";
import { Exchange } from "../models/Exchange";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { Review } from "../models/Review";
import { Notification } from "../models/Notification";
import { Connection } from "../models/Connection";
import { connectDatabase, disconnectDatabase } from "../config/database";

export interface AccountAuditReport {
  primaryUser: {
    id: string;
    email: string;
    phone?: string;
    displayName: string;
    role: string;
    isEmailVerified: boolean;
    onboardingCompleted: boolean;
    isSuspended: boolean;
    suspensionReason?: string;
    createdAt: Date;
  } | null;
  consolidatedAccounts: Array<{
    id: string;
    email: string;
    phone?: string;
    displayName: string;
    role: string;
    isSuspended: boolean;
    suspensionReason?: string;
    createdAt: Date;
  }>;
  assetDistribution: {
    primary: {
      skillsCount: number;
      exchangesCount: number;
      conversationsCount: number;
      messagesCount: number;
      reviewsCount: number;
      notificationsCount: number;
      connectionsCount: number;
    };
    consolidated: Record<
      string,
      {
        skillsCount: number;
        exchangesCount: number;
        conversationsCount: number;
        messagesCount: number;
        reviewsCount: number;
        notificationsCount: number;
        connectionsCount: number;
      }
    >;
  };
  auditHistory: Array<{
    action: string;
    actorId: string;
    targetId?: string;
    details: Record<string, unknown>;
    timestamp: Date;
  }>;
  summary: {
    isPrimaryValid: boolean;
    canPrimarySignIn: boolean;
    totalConsolidatedAccounts: number;
    hasRemainingAssetsOnConsolidated: boolean;
    recommendation: string;
  };
}

export async function inspectAccountConsolidation(
  primaryIdOrEmail: string
): Promise<AccountAuditReport> {
  let primaryUser: IUser | null = null;

  if (mongoose.Types.ObjectId.isValid(primaryIdOrEmail)) {
    primaryUser = await User.findById(primaryIdOrEmail);
  }
  if (!primaryUser) {
    primaryUser = await User.findOne({ email: primaryIdOrEmail.toLowerCase().trim() });
  }

  const primaryIdStr = primaryUser ? primaryUser._id.toString() : primaryIdOrEmail;

  // Search for any secondary accounts pointing to this primary account
  const consolidatedUsers = await User.find({
    suspensionReason: { $regex: new RegExp(primaryIdStr, "i") },
  });

  const report: AccountAuditReport = {
    primaryUser: primaryUser
      ? {
          id: primaryUser._id.toString(),
          email: primaryUser.email,
          phone: primaryUser.phone,
          displayName: primaryUser.displayName,
          role: primaryUser.role,
          isEmailVerified: primaryUser.isEmailVerified,
          onboardingCompleted: primaryUser.onboardingCompleted,
          isSuspended: primaryUser.isSuspended,
          suspensionReason: primaryUser.suspensionReason,
          createdAt: primaryUser.createdAt,
        }
      : null,
    consolidatedAccounts: consolidatedUsers.map((u) => ({
      id: u._id.toString(),
      email: u.email,
      phone: u.phone,
      displayName: u.displayName,
      role: u.role,
      isSuspended: u.isSuspended,
      suspensionReason: u.suspensionReason,
      createdAt: u.createdAt,
    })),
    assetDistribution: {
      primary: {
        skillsCount: 0,
        exchangesCount: 0,
        conversationsCount: 0,
        messagesCount: 0,
        reviewsCount: 0,
        notificationsCount: 0,
        connectionsCount: 0,
      },
      consolidated: {},
    },
    auditHistory: [],
    summary: {
      isPrimaryValid: false,
      canPrimarySignIn: false,
      totalConsolidatedAccounts: consolidatedUsers.length,
      hasRemainingAssetsOnConsolidated: false,
      recommendation: "",
    },
  };

  if (primaryUser) {
    const pOid = primaryUser._id;
    const [skills, exchanges, convs, msgs, reviews, notifs, conns] = await Promise.all([
      UserSkill.countDocuments({ userId: pOid }),
      Exchange.countDocuments({ $or: [{ requesterId: pOid }, { recipientId: pOid }] }),
      Conversation.countDocuments({ participants: pOid }),
      Message.countDocuments({ senderId: pOid }),
      Review.countDocuments({ $or: [{ authorId: pOid }, { targetId: pOid }] }),
      Notification.countDocuments({ userId: pOid }),
      Connection.countDocuments({ $or: [{ requesterId: pOid }, { recipientId: pOid }] }),
    ]);

    report.assetDistribution.primary = {
      skillsCount: skills,
      exchangesCount: exchanges,
      conversationsCount: convs,
      messagesCount: msgs,
      reviewsCount: reviews,
      notificationsCount: notifs,
      connectionsCount: conns,
    };

    report.summary.isPrimaryValid = true;
    report.summary.canPrimarySignIn = !primaryUser.isSuspended;
  }

  for (const cUser of consolidatedUsers) {
    const cOid = cUser._id;
    const [cSkills, cExchanges, cConvs, cMsgs, cReviews, cNotifs, cConns] = await Promise.all([
      UserSkill.countDocuments({ userId: cOid }),
      Exchange.countDocuments({ $or: [{ requesterId: cOid }, { recipientId: cOid }] }),
      Conversation.countDocuments({ participants: cOid }),
      Message.countDocuments({ senderId: cOid }),
      Review.countDocuments({ $or: [{ authorId: cOid }, { targetId: cOid }] }),
      Notification.countDocuments({ userId: cOid }),
      Connection.countDocuments({ $or: [{ requesterId: cOid }, { recipientId: cOid }] }),
    ]);

    report.assetDistribution.consolidated[cUser._id.toString()] = {
      skillsCount: cSkills,
      exchangesCount: cExchanges,
      conversationsCount: cConvs,
      messagesCount: cMsgs,
      reviewsCount: cReviews,
      notificationsCount: cNotifs,
      connectionsCount: cConns,
    };

    if (cSkills > 0 || cExchanges > 0 || cConvs > 0 || cMsgs > 0 || cReviews > 0) {
      report.summary.hasRemainingAssetsOnConsolidated = true;
    }
  }

  // Retrieve Audit Logs for primary and consolidated accounts
  const targetIds = [primaryIdStr, ...consolidatedUsers.map((u) => u._id.toString())];
  const logs = await AuditLog.find({ targetId: { $in: targetIds } }).sort({ timestamp: -1 });

  report.auditHistory = logs.map((l) => ({
    action: l.action,
    actorId: l.actorId.toString(),
    targetId: l.targetId,
    details: l.details,
    timestamp: l.timestamp,
  }));

  if (!primaryUser) {
    report.summary.recommendation =
      "Primary account ID does not exist in the database. Consolidation target is invalid. Safe reversible rollback or reassignment needed.";
  } else if (primaryUser.isSuspended) {
    report.summary.recommendation =
      "Primary account is also suspended. Review suspension reason before allowing user access.";
  } else {
    report.summary.recommendation =
      "Primary account is active and valid. User should be instructed to sign in using the primary account's email credentials.";
  }

  return report;
}

export async function revertAccountConsolidation(
  secondaryUserId: string,
  adminId: string,
  reason: string
): Promise<{ success: boolean; message: string; previousReason?: string }> {
  const user = await User.findById(secondaryUserId);
  if (!user) {
    return { success: false, message: `Account with ID ${secondaryUserId} not found` };
  }

  if (!user.isSuspended) {
    return { success: false, message: `Account ${secondaryUserId} is not currently suspended` };
  }

  const previousReason = user.suspensionReason;
  user.isSuspended = false;
  user.suspensionReason = undefined;
  await user.save();

  await AuditLog.create({
    actorId: new mongoose.Types.ObjectId(adminId),
    action: "REVERT_ACCOUNT_CONSOLIDATION",
    targetType: "user",
    targetId: secondaryUserId,
    details: {
      previousSuspension: true,
      previousSuspensionReason: previousReason,
      newSuspension: false,
      reason,
    },
    timestamp: new Date(),
  });

  return {
    success: true,
    message: `Account ${user.email} successfully unsuspended with audit trail entry`,
    previousReason,
  };
}

// CLI Execution Support
async function runCli(): Promise<void> {
  const targetId = process.argv[2] || "6ae6437e4419de4b9ecc74bc";
  console.info(`[audit] Running consolidation audit for: ${targetId}...`);

  await connectDatabase();
  try {
    const report = await inspectAccountConsolidation(targetId);
    console.info(JSON.stringify(report, null, 2));
  } finally {
    await disconnectDatabase();
  }
}

if (require.main === module) {
  runCli().catch((err) => {
    console.error("[audit] Audit script failed:", err);
    process.exit(1);
  });
}
