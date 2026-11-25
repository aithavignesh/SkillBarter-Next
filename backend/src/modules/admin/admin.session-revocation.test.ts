import { afterEach, describe, expect, it, vi } from "vitest";
import { User } from "../../models/User";
import { RefreshSession } from "../../models/RefreshSession";
import { AuditLog } from "../../models/AuditLog";
import { adminService } from "./admin.service";

describe("AdminService suspension session safety", () => {
  const userIds: string[] = [];

  afterEach(async () => {
    vi.restoreAllMocks();
    await RefreshSession.deleteMany({ userId: { $in: userIds } });
    await AuditLog.deleteMany({ actorId: { $in: userIds } });
    await User.deleteMany({ _id: { $in: userIds } });
    userIds.length = 0;
  });

  it("keeps an account suspended when session revocation fails during restoration", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const owner = await User.create({
      email: `admin-session-owner-${suffix}@example.com`,
      passwordHash: "test-hash",
      displayName: "Session Test Owner",
      role: "owner",
      isEmailVerified: true,
    });
    const target = await User.create({
      email: `admin-session-target-${suffix}@example.com`,
      passwordHash: "test-hash",
      displayName: "Suspended Test Member",
      role: "user",
      isEmailVerified: true,
      isSuspended: true,
      suspensionReason: "Suspended for session revocation test",
    });
    userIds.push(owner._id.toString(), target._id.toString());

    await RefreshSession.create({
      userId: target._id,
      sessionId: `session-${suffix}`,
      tokenHash: suffix.replace(/[^a-z0-9]/gi, "").padEnd(64, "0").slice(0, 64),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    vi.spyOn(RefreshSession, "deleteMany").mockRejectedValueOnce(
      new Error("session store unavailable"),
    );

    await expect(
      adminService.updateUser(owner._id.toString(), target._id.toString(), {
        isSuspended: false,
      }),
    ).rejects.toThrow("session store unavailable");

    const persistedTarget = await User.findById(target._id);
    expect(persistedTarget?.isSuspended).toBe(true);
    expect(await RefreshSession.countDocuments({ userId: target._id })).toBe(1);
  });
});
