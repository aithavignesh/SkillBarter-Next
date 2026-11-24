import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../app";
import { User } from "../../models/User";
import { RefreshSession } from "../../models/RefreshSession";
import { AuthService } from "./auth.service";
import { hashPassword, verifyRefreshToken } from "../../utils/security";

describe("Password login and refresh-session lifecycle", () => {
  const service = new AuthService();
  const createdUserIds: string[] = [];

  afterEach(async () => {
    if (createdUserIds.length > 0) {
      await RefreshSession.deleteMany({ userId: { $in: createdUserIds } });
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
    const onboardingSession = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer " + session.accessToken);
    expect(onboardingSession.status).toBe(200);
    expect(onboardingSession.body.data.user.isEmailVerified).toBe(false);
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
      code: "ACCOUNT_CONSOLIDATED",
      details: expect.objectContaining({
        primaryAccountId: primary.id,
        primaryEmailMasked: expect.any(String),
      }),
    });
  });

  it("rotates refresh tokens once and revokes access and refresh tokens on logout", async () => {
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
    const previousPayload = verifyRefreshToken(session.refreshToken);
    const refreshedPayload = verifyRefreshToken(refreshed.refreshToken);
    expect(refreshedPayload).toMatchObject({
      userId: user.id,
      email: user.email,
      role: "user",
      sessionId: expect.any(String),
      jti: expect.any(String),
    });
    expect(refreshedPayload?.jti).not.toBe(previousPayload?.jti);

    await expect(service.refresh(session.refreshToken)).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_TOKEN",
    });

    const logoutResponse = await request(app)
      .post("/api/v1/auth/logout")
      .send({ refreshToken: refreshed.refreshToken });
    expect(logoutResponse.status).toBe(200);

    await expect(service.refresh(refreshed.refreshToken)).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_TOKEN",
    });

    const revokedAccess = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer " + refreshed.accessToken);
    expect(revokedAccess.status).toBe(401);
    expect(revokedAccess.body.error.code).toBe("SESSION_REVOKED");
  });

  it("revokes refresh sessions when an account is suspended", async () => {
    const user = await createUser({
      isEmailVerified: true,
      onboardingCompleted: true,
    });
    const session = await service.login({
      email: user.email,
      password: "CorrectPassword123!",
    });

    user.isSuspended = true;
    user.suspensionReason = "Suspended for session revocation test";
    await user.save();

    const blockedAccess = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer " + session.accessToken);
    expect(blockedAccess.status).toBe(403);
    expect(blockedAccess.body.error.code).toBe("ACCOUNT_SUSPENDED");

    await expect(service.refresh(session.refreshToken)).rejects.toMatchObject({
      statusCode: 401,
      code: "UNAUTHORIZED",
    });
    expect(await RefreshSession.countDocuments({ userId: user._id })).toBe(0);
  });
});
