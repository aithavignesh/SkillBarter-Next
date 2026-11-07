import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { User } from "../../models/User";
import { AuditLog } from "../../models/AuditLog";
import { Report } from "../../models/Report";
import { app } from "../../app";
import { signAccessToken } from "../../utils/security";

describe("Admin authorization boundaries", () => {
  const createdUserIds: string[] = [];

  afterAll(async () => {
    await Report.deleteMany({
      $or: [
        { reporterId: { $in: createdUserIds } },
        { targetId: { $in: createdUserIds } },
      ],
    });
    await AuditLog.deleteMany({ actorId: { $in: createdUserIds } });
    await User.deleteMany({ _id: { $in: createdUserIds } });
  });

  it("allows only the platform owner to grant administrator access", async () => {
    const suffix = Date.now() + "-" + Math.random().toString(36).slice(2);
    const admin = await User.create({
      email: "authorization-admin-" + suffix + "@example.com",
      passwordHash: "test-hash",
      displayName: "Existing Administrator",
      role: "admin",
      isEmailVerified: true,
    });
    const owner = await User.create({
      email: "authorization-owner-" + suffix + "@example.com",
      passwordHash: "test-hash",
      displayName: "Platform Owner",
      role: "owner",
      isEmailVerified: true,
    });
    const target = await User.create({
      email: "authorization-target-" + suffix + "@example.com",
      passwordHash: "test-hash",
      displayName: "New Administrator",
      role: "user",
      isEmailVerified: true,
    });
    const unverifiedTarget = await User.create({
      email: "authorization-unverified-" + suffix + "@example.com",
      passwordHash: "test-hash",
      displayName: "Unverified Member",
      role: "user",
      isEmailVerified: false,
    });
    createdUserIds.push(
      admin._id.toString(),
      owner._id.toString(),
      target._id.toString(),
      unverifiedTarget._id.toString(),
    );

    const adminToken = signAccessToken({
      userId: admin._id.toString(),
      email: admin.email,
      role: "admin",
    });
    const ownerToken = signAccessToken({
      userId: owner._id.toString(),
      email: owner.email,
      role: "owner",
    });

    const deniedPromotion = await request(app)
      .patch("/api/v1/admin/users/" + target._id.toString())
      .set("Authorization", "Bearer " + adminToken)
      .send({ role: "admin" });
    expect(deniedPromotion.status).toBe(403);
    expect(deniedPromotion.body.error.code).toBe("OWNER_REQUIRED");

    const deniedUnverifiedPromotion = await request(app)
      .patch("/api/v1/admin/users/" + unverifiedTarget._id.toString())
      .set("Authorization", "Bearer " + ownerToken)
      .send({ role: "admin" });
    expect(deniedUnverifiedPromotion.status).toBe(400);
    expect(deniedUnverifiedPromotion.body.error.code).toBe("ADMIN_EMAIL_NOT_VERIFIED");

    const allowedPromotion = await request(app)
      .patch("/api/v1/admin/users/" + target._id.toString())
      .set("Authorization", "Bearer " + ownerToken)
      .send({ role: "admin" });
    expect(allowedPromotion.status).toBe(200);
    expect(allowedPromotion.body.data.user.role).toBe("admin");

    const deniedOwnerSuspension = await request(app)
      .patch("/api/v1/admin/users/" + owner._id.toString())
      .set("Authorization", "Bearer " + adminToken)
      .send({ isSuspended: true, suspensionReason: "Unauthorized suspension attempt" });
    expect(deniedOwnerSuspension.status).toBe(403);
    expect(deniedOwnerSuspension.body.error.code).toBe("OWNER_PROTECTED");

    const deniedAdminSuspension = await request(app)
      .patch("/api/v1/admin/users/" + admin._id.toString())
      .set("Authorization", "Bearer " + adminToken)
      .send({ isSuspended: true, suspensionReason: "Unauthorized self-suspension attempt" });
    expect(deniedAdminSuspension.status).toBe(403);
    expect(deniedAdminSuspension.body.error.code).toBe("OWNER_REQUIRED");

    const ownerReport = await Report.create({
      reporterId: target._id,
      targetType: "user",
      targetId: owner._id.toString(),
      reason: "Impersonation",
      description: "This report is a fixture for owner protection testing.",
      status: "PENDING",
    });
    const deniedReportSuspension = await request(app)
      .patch("/api/v1/admin/reports/" + ownerReport._id.toString())
      .set("Authorization", "Bearer " + adminToken)
      .send({
        status: "RESOLVED",
        actionTaken: "account_suspended",
        moderationNotes: "Unauthorized owner suspension attempt",
      });
    expect(deniedReportSuspension.status).toBe(403);
    expect(deniedReportSuspension.body.error.code).toBe("OWNER_PROTECTED");

    const ownerSuspendsAdmin = await request(app)
      .patch("/api/v1/admin/users/" + admin._id.toString())
      .set("Authorization", "Bearer " + ownerToken)
      .send({ isSuspended: true, suspensionReason: "Owner-authorized test" });
    expect(ownerSuspendsAdmin.status).toBe(200);
    expect(ownerSuspendsAdmin.body.data.user.isSuspended).toBe(true);
  });

  it("denies ordinary members access to moderation reports", async () => {
    const suffix = Date.now() + "-" + Math.random().toString(36).slice(2);
    const member = await User.create({
      email: "authorization-member-" + suffix + "@example.com",
      passwordHash: "test-hash",
      displayName: "Ordinary Member",
      role: "user",
      isEmailVerified: true,
    });
    createdUserIds.push(member._id.toString());
    const token = signAccessToken({
      userId: member._id.toString(),
      email: member.email,
      role: "user",
    });

    const response = await request(app)
      .get("/api/v1/admin/reports")
      .set("Authorization", "Bearer " + token);
    expect(response.status).toBe(403);
  });
});
