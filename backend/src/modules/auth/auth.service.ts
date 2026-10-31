import { User, IUser } from "../../models/User";
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
import { sendPasswordResetEmail, sendVerificationEmail } from "../../utils/email";
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

export class AuthService {
  async register(input: RegisterInput): Promise<{ user: AuthUser; verificationToken: string }> {
    const existing = await User.findOne({ email: input.email.toLowerCase().trim() });
    if (existing) {
      throw new AppError("An account with this email already exists", 409, "ACCOUNT_EXISTS");
    }

    const passwordHash = await hashPassword(input.password);
    const verificationToken = generateSecureToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      email: input.email.toLowerCase().trim(),
      passwordHash,
      displayName: input.displayName.trim(),
      role: "user",
      isEmailVerified: false,
      verificationToken,
      verificationTokenExpiresAt: verificationExpires,
    });

    try {
      await sendVerificationEmail(user.email, user.displayName, verificationToken);
    } catch {
      await user.deleteOne();
      throw new AppError(
        "We could not send the verification email. Please try again later.",
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
    if (!user || user.isSuspended || !user.isEmailVerified) {
      throw new AppError("User account not accessible", 401, "UNAUTHORIZED");
    }
    if (user.passwordChangedAt && (!payload.iat || payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000))) {
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
