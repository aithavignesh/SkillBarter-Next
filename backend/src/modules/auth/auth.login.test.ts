import { afterEach, describe, expect, it } from "vitest";
import { User } from "../../models/User";
import { AuthService } from "./auth.service";
import { hashPassword, verifyRefreshToken } from "../../utils/security";

describe("Password login and refresh-session lifecycle", () => {
  const service = new AuthService();
  const createdUserIds: string[] = [];

  afterEach(async () => {
    if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
      createdUserIds.length = 0;
    }
  });

  async function createUser(overrides: Record<string, unknown> = {}) {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const user = await User.create({
      email: `auth-login-${suffix}@example.test`,
      passwordHash: await hashPassword("CorrectPassword123!"),
      displayName: "Authentication Test Member",
      ...overrides,
    });
    createdUserIds.push(user._id.toString());
    return user;
  }

  it("allows an unverified member to sign in so onboarding can be completed", async () => {
    const user = await createUser({
      isEmailVerified: false,
      onboardingCompleted: false,
    });

    const session = await service.login({
      email: user.email,
      password: "CorrectPassword123!",
    });

    expect(session.user.id).toBe(user.id);
    expect(session.user.isEmailVerified).toBe(false);
    expect(session.user.onboardingCompleted).toBe(false);
    expect(session.accessToken).toBeTruthy();
    expect(session.refreshToken).toBeTruthy();
  });

  it("rejects invalid passwords without issuing a session", async () => {
    const user = await createUser();

    await expect(
      service.login({ email: user.email, password: "WrongPassword123!" }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });
  });

  it("keeps a consolidated duplicate suspended while its active primary account can sign in", async () => {
    const primary = await createUser({
      role: "owner",
      isEmailVerified: true,
      onboardingCompleted: true,
    });
    const duplicate = await createUser({
      isSuspended: true,
      suspensionReason: `Account consolidated into primary account ${primary.id}`,
    });

    const primarySession = await service.login({
      email: primary.email,
      password: "CorrectPassword123!",
    });

    expect(primarySession.user.id).toBe(primary.id);
    expect(primarySession.user.role).toBe("owner");

    await expect(
      service.login({ email: duplicate.email, password: "CorrectPassword123!" }),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "ACCOUNT_SUSPENDED",
      message: expect.stringContaining(primary.id),
    });
  });

  it("accepts a valid refresh token and rejects refresh after account suspension", async () => {
    const user = await createUser({
      isEmailVerified: true,
      onboardingCompleted: true,
    });
    const session = await service.login({
      email: user.email,
      password: "CorrectPassword123!",
    });

    const refreshed = await service.refresh(session.refreshToken);
    expect(refreshed.accessToken).toBeTruthy();
    expect(refreshed.refreshToken).toBeTruthy();
    expect(verifyRefreshToken(refreshed.refreshToken)).toMatchObject({
      userId: user.id,
      email: user.email,
      role: "user",
    });

    user.isSuspended = true;
    await user.save();

    await expect(service.refresh(refreshed.refreshToken)).rejects.toMatchObject({
      statusCode: 401,
      code: "UNAUTHORIZED",
    });
  });
});
