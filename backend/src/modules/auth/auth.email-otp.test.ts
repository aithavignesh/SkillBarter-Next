import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

const { sendLoginOtpEmailMock } = vi.hoisted(() => ({
  sendLoginOtpEmailMock: vi.fn(),
}));

vi.mock("../../utils/email", () => ({
  isEmailConfigured: () => true,
  sendLoginOtpEmail: sendLoginOtpEmailMock,
  sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
  sendVerificationEmail: vi.fn().mockResolvedValue(true),
}));

import { AuthCooldown } from "../../models/AuthCooldown";
import { OtpChallenge } from "../../models/OtpChallenge";
import { User } from "../../models/User";
import { authService } from "./auth.service";

const testEmails: string[] = [];
const testUserIds: string[] = [];

function cooldownKey(email: string): string {
  return createHash("sha256").update("email:" + email.trim().toLowerCase()).digest("hex");
}

afterEach(async () => {
  await Promise.all([
    OtpChallenge.deleteMany({ email: { $in: testEmails } }),
    AuthCooldown.deleteMany({ key: { $in: testEmails.map(cooldownKey) } }),
    User.deleteMany({ _id: { $in: testUserIds } }),
  ]);
  testEmails.length = 0;
  testUserIds.length = 0;
  sendLoginOtpEmailMock.mockReset();
});

describe("Email OTP provider lifecycle", () => {
  it("stores only a hash, sends the generated code, and verifies the same challenge", async () => {
    const email = "email-otp-" + Date.now() + "-" + Math.random().toString(36).slice(2) + "@example.test";
    testEmails.push(email);
    const user = await User.create({
      email,
      passwordHash: "test-password-hash",
      displayName: "Email OTP Test Member",
      isEmailVerified: false,
    });
    testUserIds.push(user._id.toString());
    sendLoginOtpEmailMock.mockResolvedValue(true);

    await authService.requestEmailOtp(email);

    expect(sendLoginOtpEmailMock).toHaveBeenCalledTimes(1);
    const [sentEmail, sentName, code] = sendLoginOtpEmailMock.mock.calls[0] as [string, string, string];
    expect(sentEmail).toBe(email);
    expect(sentName).toBe("Email OTP Test Member");
    expect(code).toMatch(/^\d{6}$/);

    const challenge = await OtpChallenge.findOne({ email });
    expect(challenge).not.toBeNull();
    expect(challenge?.codeHash).toBe(createHash("sha256").update(code).digest("hex"));
    expect(challenge?.codeHash).not.toBe(code);
    expect(challenge?.expiresAt.getTime()).toBeGreaterThan(Date.now());

    const result = await authService.verifyEmailOtp(email, code);
    expect(result.user.id).toBe(user.id);
    expect(result.user.isEmailVerified).toBe(false);
    expect(await OtpChallenge.countDocuments({ email })).toBe(0);
  });

  it("removes the challenge and releases the resend cooldown when email delivery fails", async () => {
    const email = "email-otp-failure-" + Date.now() + "-" + Math.random().toString(36).slice(2) + "@example.test";
    testEmails.push(email);
    const user = await User.create({
      email,
      passwordHash: "test-password-hash",
      displayName: "Email OTP Failure Member",
    });
    testUserIds.push(user._id.toString());
    sendLoginOtpEmailMock.mockRejectedValue(new Error("provider unavailable"));

    await expect(authService.requestEmailOtp(email)).rejects.toMatchObject({
      statusCode: 503,
      code: "EMAIL_DELIVERY_FAILED",
    });

    expect(await OtpChallenge.countDocuments({ email })).toBe(0);
    expect(await AuthCooldown.countDocuments({ key: cooldownKey(email) })).toBe(0);
  });
});
