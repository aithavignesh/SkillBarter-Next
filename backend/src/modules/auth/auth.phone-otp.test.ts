import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "../../config/env";
import { AuthCooldown } from "../../models/AuthCooldown";
import { OtpChallenge } from "../../models/OtpChallenge";
import { User } from "../../models/User";
import { RefreshSession } from "../../models/RefreshSession";
import { AuthService } from "./auth.service";

const originalTwoFactorApiKey = env.TWOFACTOR_API_KEY;
const testPhones: string[] = [];
const testUserIds: string[] = [];

function cooldownKey(phone: string): string {
  return createHash("sha256").update("phone:" + phone.trim().toLowerCase()).digest("hex");
}

afterEach(async () => {
  if (originalTwoFactorApiKey === undefined) delete env.TWOFACTOR_API_KEY;
  else env.TWOFACTOR_API_KEY = originalTwoFactorApiKey;

  await Promise.all([
    OtpChallenge.deleteMany({ phone: { $in: testPhones } }),
    AuthCooldown.deleteMany({ key: { $in: testPhones.map(cooldownKey) } }),
    RefreshSession.deleteMany({ userId: { $in: testUserIds } }),
    User.deleteMany({ _id: { $in: testUserIds } }),
  ]);
  testPhones.length = 0;
  testUserIds.length = 0;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("2Factor SMS OTP provider lifecycle", () => {
  it("creates a provider challenge, verifies it, and does not bypass email verification", async () => {
    const phone = "+919" + String(Date.now()).slice(-9);
    testPhones.push(phone);
    const user = await User.create({
      email: "phone-otp-" + Date.now() + "@example.test",
      phone,
      passwordHash: "test-password-hash",
      displayName: "SMS OTP Test Member",
      isEmailVerified: false,
    });
    testUserIds.push(user._id.toString());
    env.TWOFACTOR_API_KEY = "test-twofactor-key";

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ Status: "Success", Details: "provider-challenge-123" }),
        { status: 200 },
      ))
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ Status: "Success", Details: "OTP Matched" }),
        { status: 200 },
      ));
    vi.stubGlobal("fetch", fetchMock);

    const challenge = await new AuthService().requestPhoneOtp(phone);
    expect(challenge.phone).toBe(phone);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(requestUrl).toContain("/SMS/" + phone.slice(3) + "/AUTOGEN");

    const storedChallenge = await OtpChallenge.findOne({ challengeId: challenge.challengeId, phone });
    expect(storedChallenge?.providerChallengeId).toBe("provider-challenge-123");
    expect(storedChallenge?.expiresAt.getTime()).toBeGreaterThan(Date.now());

    const session = await new AuthService().verifyPhoneOtp(phone, "123456", challenge.challengeId);
    expect(session.user.id).toBe(user.id);
    expect(session.user.isEmailVerified).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [verifyUrl] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(verifyUrl).toContain("/SMS/VERIFY/provider-challenge-123/123456");
    expect(await OtpChallenge.findOne({ challengeId: challenge.challengeId })).toBeNull();
  });

  it("releases the resend cooldown when the SMS provider rejects an OTP request", async () => {
    const phone = "+919" + String(Date.now()).slice(-9);
    testPhones.push(phone);
    const user = await User.create({
      email: "phone-otp-failure-" + Date.now() + "@example.test",
      phone,
      passwordHash: "test-password-hash",
      displayName: "SMS OTP Failure Member",
    });
    testUserIds.push(user._id.toString());
    env.TWOFACTOR_API_KEY = "test-twofactor-key";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ Status: "Error", Details: "provider rejected" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(new AuthService().requestPhoneOtp(phone)).rejects.toMatchObject({
      statusCode: 502,
      code: "SMS_DELIVERY_FAILED",
    });
    expect(await OtpChallenge.countDocuments({ phone })).toBe(0);
    expect(await AuthCooldown.countDocuments({ key: cooldownKey(phone) })).toBe(0);
  });
});
