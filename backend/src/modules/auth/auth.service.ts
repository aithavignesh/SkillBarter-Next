import { User, IUser } from "../../models/User";
import { OtpChallenge } from "../../models/OtpChallenge";
import { AuthCooldown } from "../../models/AuthCooldown";
import { createHash, randomInt } from "node:crypto";
import { AnalyticsEvent } from "../../models/AnalyticsEvent";
import {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
  ChangePasswordInput,
  AuthUser,
} from "@skillbarter/shared";
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  generateSecureToken,
  verifyRefreshToken,
} from "../../utils/security";
import { sendLoginOtpEmail, sendPasswordResetEmail, sendVerificationEmail } from "../../utils/email";
import { env } from "../../config/env";
import { AppError } from "../../middleware/errorHandler";

export function formatAuthUser(user: IUser): AuthUser {
  return {
    id: user._id.toString(),
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    onboardingCompleted: user.onboardingCompleted,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    location: user.location,
    availability: user.availability,
    preferredSessionFormat: user.preferredSessionFormat,
    reputationScore: user.reputationScore,
    completedExchangesCount: user.completedExchangesCount,
    createdAt: user.createdAt.toISOString(),
  };
}

const AUTH_RESEND_COOLDOWN_MS = 60_000;

async function enforceResendCooldown(channel: "email" | "phone", destination: string): Promise<void> {
  const key = createHash("sha256").update(channel + ":" + destination.trim().toLowerCase()).digest("hex");
  try {
    await AuthCooldown.create({ key, expiresAt: new Date(Date.now() + AUTH_RESEND_COOLDOWN_MS) });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      throw new AppError("Please wait 60 seconds before requesting another code or email.", 429, "RESEND_COOLDOWN");
    }
    throw error;
  }
}

async function releaseResendCooldown(channel: "email" | "phone", destination: string): Promise<void> {
  const key = createHash("sha256").update(channel + ":" + destination.trim().toLowerCase()).digest("hex");
  await AuthCooldown.deleteOne({ key });
}

export class AuthService {
  async register(input: RegisterInput): Promise<{ user: AuthUser; verificationToken: string }> {
    let normalizedPhone = input.phone.replace(/[\s()-]/g, "");
    if (/^\d{10}$/.test(normalizedPhone)) normalizedPhone = "+91" + normalizedPhone;
    else if (/^91\d{10}$/.test(normalizedPhone)) normalizedPhone = "+" + normalizedPhone;
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      throw new AppError("Enter a valid mobile number with country code, e.g. +919876543210", 400, "INVALID_PHONE");
    }
    const existing = await User.findOne({ $or: [{ email: input.email.toLowerCase().trim() }, { phone: normalizedPhone }] });
    if (existing) {
      throw new AppError("An account with this email or mobile number already exists", 409, "ACCOUNT_EXISTS");
    }

    const passwordHash = await hashPassword(input.password);
    const verificationToken = generateSecureToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      email: input.email.toLowerCase().trim(),
      phone: normalizedPhone,
      passwordHash,
      displayName: input.displayName.trim(),
      role: "user",
      isEmailVerified: false,
      verificationToken,
      verificationTokenExpiresAt: verificationExpires,
    });

    try {
      await sendVerificationEmail(user.email, user.displayName, verificationToken);
    } catch (error) {
      // Keep the unverified account so a failed provider request does not force
      // the user to repeat registration. They can use the resend endpoint.
      console.error("[auth] Registration verification email failed.", {
        reason: error instanceof Error ? error.message.slice(0, 160) : "unknown",
      });
      throw new AppError(
        "Your account was saved, but the verification email could not be sent. Use the resend option to try again.",
        503,
        "EMAIL_DELIVERY_FAILED",
      );
    }

    await AnalyticsEvent.create({
      eventName: "USER_REGISTERED",
      userId: user._id,
      metadata: { email: user.email },
      timestamp: new Date(),
    });

    // Do not issue an authenticated session until the email address is verified.
    return { user: formatAuthUser(user), verificationToken };
  }

  async login(input: LoginInput): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    const user = await User.findOne({ email: input.email.toLowerCase().trim() });
    if (!user) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    if (!user.isEmailVerified) {
      throw new AppError(
        "Please verify your email address before signing in.",
        403,
        "EMAIL_NOT_VERIFIED",
      );
    }

    if (user.isSuspended) {
      throw new AppError(
        `Your account has been suspended: ${user.suspensionReason || "Violation of terms"}`,
        403,
        "ACCOUNT_SUSPENDED"
      );
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    return { user: formatAuthUser(user), accessToken, refreshToken };
  }


  private createSession(user: IUser): { user: AuthUser; accessToken: string; refreshToken: string } {
    const tokenPayload = { userId: user._id.toString(), email: user.email, role: user.role };
    return { user: formatAuthUser(user), accessToken: signAccessToken(tokenPayload), refreshToken: signRefreshToken(tokenPayload) };
  }

  async requestPhoneOtp(phoneInput: string): Promise<{ challengeId: string; phone: string }> {
    const phone = phoneInput.trim().replace(/[\s()-]/g, "");
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new AppError("Enter a valid mobile number with country code", 400, "INVALID_PHONE");
    const user = await User.findOne({ phone });
    if (!user) throw new AppError("Unable to sign in with this number. Check the number or create an account.", 404, "ACCOUNT_NOT_FOUND");
    if (!user.isEmailVerified) throw new AppError("Please verify your email address before signing in.", 403, "EMAIL_NOT_VERIFIED");
    if (user.isSuspended) throw new AppError("This account has been suspended.", 403, "ACCOUNT_SUSPENDED");
    if (!phone.startsWith("+91")) throw new AppError("SMS OTP currently supports Indian mobile numbers (+91). Use email OTP for other countries.", 400, "PHONE_COUNTRY_UNSUPPORTED");
    if (!env.TWOFACTOR_API_KEY) throw new AppError("SMS OTP is not configured on the server. Please use email OTP or email and password.", 503, "SMS_NOT_CONFIGURED");
    await enforceResendCooldown("phone", phone);
    const url = "https://2factor.in/API/V1/" + encodeURIComponent(env.TWOFACTOR_API_KEY) + "/SMS/" + encodeURIComponent(phone.slice(3)) + "/AUTOGEN";
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await response.json().catch(() => null) as { Status?: string; Details?: string } | null;
    if (!response.ok || data?.Status !== "Success" || !data.Details) {
      await releaseResendCooldown("phone", phone);
      throw new AppError("The SMS provider could not send an OTP. Please try again later.", 502, "SMS_DELIVERY_FAILED");
    }
    const challengeId = generateSecureToken();
    await OtpChallenge.create({ phone, challengeId, providerChallengeId: data.Details, expiresAt: new Date(Date.now() + 5 * 60 * 1000), attempts: 0 });
    return { challengeId, phone };
  }

  async verifyPhoneOtp(phoneInput: string, otpInput: string, challengeId: string): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    const phone = phoneInput.trim().replace(/[\s()-]/g, "");
    const otp = otpInput.trim();
    if (!/^\+[1-9]\d{7,14}$/.test(phone) || !/^\d{6}$/.test(otp) || !challengeId || challengeId.length > 200) throw new AppError("Invalid or expired OTP challenge", 400, "INVALID_OTP");
    if (!phone.startsWith("+91")) throw new AppError("SMS OTP currently supports Indian mobile numbers (+91).", 400, "PHONE_COUNTRY_UNSUPPORTED");
    if (!env.TWOFACTOR_API_KEY) throw new AppError("SMS OTP is not configured on the server.", 503, "SMS_NOT_CONFIGURED");
    const challenge = await OtpChallenge.findOne({ challengeId, phone, expiresAt: { $gt: new Date() } });
    if (!challenge || challenge.attempts >= 5 || !challenge.providerChallengeId) throw new AppError("Invalid or expired mobile OTP. Request a new code.", 401, "INVALID_OTP");
    const url = "https://2factor.in/API/V1/" + encodeURIComponent(env.TWOFACTOR_API_KEY) + "/SMS/VERIFY/" + encodeURIComponent(challenge.providerChallengeId) + "/" + encodeURIComponent(otp);
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await response.json().catch(() => null) as { Status?: string; Details?: string } | null;
    if (!response.ok || data?.Status !== "Success" || data.Details !== "OTP Matched") {
      challenge.attempts += 1;
      await challenge.save();
      throw new AppError("Invalid or expired mobile OTP", 401, "INVALID_OTP");
    }
    await OtpChallenge.deleteOne({ _id: challenge._id });
    const user = await User.findOne({ phone });
    if (!user) throw new AppError("Unable to sign in with this number. Create an account first.", 404, "ACCOUNT_NOT_FOUND");
    if (!user.isEmailVerified) throw new AppError("Please verify your email address before signing in.", 403, "EMAIL_NOT_VERIFIED");
    if (user.isSuspended) throw new AppError("This account has been suspended.", 403, "ACCOUNT_SUSPENDED");
    return this.createSession(user);
  }

  async resendVerificationEmail(emailInput: string): Promise<void> {
    const email = emailInput.trim().toLowerCase();
    const user = await User.findOne({ email });
    // Do not reveal whether an address is registered or already verified.
    if (!user || user.isEmailVerified || user.isSuspended) return;
    await enforceResendCooldown("email", email);

    const verificationToken = generateSecureToken();
    user.verificationToken = verificationToken;
    user.verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    try {
      await sendVerificationEmail(user.email, user.displayName, verificationToken);
    } catch (error) {
      console.error("[auth] Verification email resend failed.", {
        reason: error instanceof Error ? error.message.slice(0, 160) : "unknown",
      });
      await releaseResendCooldown("email", email);
      throw new AppError("The verification email provider is unavailable. Please try again later.", 503, "EMAIL_DELIVERY_FAILED");
    }
  }

  async requestEmailOtp(emailInput: string): Promise<void> {
    const email = emailInput.trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user || user.isSuspended) return;
    if (!user.isEmailVerified) throw new AppError("Please verify your email address before requesting a sign-in code.", 403, "EMAIL_NOT_VERIFIED");
    await enforceResendCooldown("email", email);
    await OtpChallenge.deleteMany({ email });
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const codeHash = createHash("sha256").update(code).digest("hex");
    await OtpChallenge.create({ email, codeHash, expiresAt: new Date(Date.now() + 5 * 60 * 1000), attempts: 0 });
    try {
      await sendLoginOtpEmail(email, user.displayName, code);
    } catch {
      await OtpChallenge.deleteMany({ email, codeHash });
      await releaseResendCooldown("email", email);
      throw new AppError("Unable to send email OTP right now. Please try again later.", 503, "EMAIL_DELIVERY_FAILED");
    }
  }

  async verifyEmailOtp(emailInput: string, otpInput: string): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    const email = emailInput.trim().toLowerCase();
    const otp = otpInput.trim();
    if (!/^\d{6}$/.test(otp)) throw new AppError("Enter the complete 6-digit email OTP", 400, "INVALID_OTP");
    const challenge = await OtpChallenge.findOne({ email, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
    if (!challenge || challenge.attempts >= 5) throw new AppError("Invalid or expired email OTP. Request a new code.", 401, "INVALID_OTP");
    const hash = createHash("sha256").update(otp).digest("hex");
    if (hash !== challenge.codeHash) {
      challenge.attempts += 1;
      await challenge.save();
      throw new AppError("Invalid or expired email OTP", 401, "INVALID_OTP");
    }
    await OtpChallenge.deleteMany({ email });
    const user = await User.findOne({ email });
    if (!user || user.isSuspended) throw new AppError("Unable to sign in with these details.", 401, "INVALID_CREDENTIALS");
    if (!user.isEmailVerified) throw new AppError("Please verify your email address before signing in.", 403, "EMAIL_NOT_VERIFIED");
    return this.createSession(user);
  }

  async verifyEmail(token: string): Promise<AuthUser> {
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError("Invalid or expired verification token", 400, "INVALID_TOKEN");
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    await AnalyticsEvent.create({
      eventName: "USER_VERIFIED",
      userId: user._id,
      timestamp: new Date(),
    });

    return formatAuthUser(user);
  }

  async forgotPassword(email: string): Promise<{ token?: string }> {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return {};

    const resetToken = generateSecureToken();
    user.passwordResetToken = resetToken;
    user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, user.displayName, resetToken);
    } catch {
      user.passwordResetToken = undefined;
      user.passwordResetExpiresAt = undefined;
      await user.save();
      console.error("Password reset email delivery failed.");
      return {};
    }

    return { token: resetToken };
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const user = await User.findOne({
      passwordResetToken: input.token,
      passwordResetExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError("Invalid or expired password reset token", 400, "INVALID_TOKEN");
    }

    user.passwordHash = await hashPassword(input.newPassword);
    user.passwordChangedAt = new Date();
    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();
  }

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await User.findById(userId);
    if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

    const isValid = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!isValid) throw new AppError("Current password is incorrect", 400, "INCORRECT_PASSWORD");

    user.passwordHash = await hashPassword(input.newPassword);
    user.passwordChangedAt = new Date();
    await user.save();
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) throw new AppError("Invalid or expired refresh token", 401, "INVALID_TOKEN");

    const user = await User.findById(payload.userId);
    if (!user || user.isSuspended) {
      throw new AppError("User account not accessible", 401, "UNAUTHORIZED");
    }
    if (!user.isEmailVerified) throw new AppError("Please verify your email address before signing in.", 403, "EMAIL_NOT_VERIFIED");
    if (user.passwordChangedAt && (!payload.iat || payload.iat < user.passwordChangedAt.getTime() / 1000)) {
      throw new AppError("Password changed; please sign in again", 401, "SESSION_REVOKED");
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: signAccessToken(tokenPayload),
      refreshToken: signRefreshToken(tokenPayload),
    };
  }
}

export const authService = new AuthService();
