import { Request, Response, NextFunction } from "express";
import { authService, formatAuthUser } from "./auth.service";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "@skillbarter/shared";
import { sendSuccess } from "../../utils/response";
import { AppError } from "../../middleware/errorHandler";
import { env } from "../../config/env";

const isProduction = env.NODE_ENV === "production";

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 15 * 60 * 1000,
    path: "/",
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });
}

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = registerSchema.parse(req.body);
      const result = await authService.register(input);

      sendSuccess(
        res,
        {
          user: result.user,
          ...(env.NODE_ENV !== "production" ? { verificationToken: result.verificationToken } : {}),
        },
        undefined,
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = loginSchema.parse(req.body);
      const result = await authService.login(input);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      sendSuccess(res, { user: result.user, accessToken: result.accessToken });
    } catch (error) {
      next(error);
    }
  }


  async requestPhoneOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const phone = typeof req.body?.phone === "string" ? req.body.phone : "";
      const result = await authService.requestPhoneOtp(phone);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async verifyPhoneOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone, otp, challengeId } = req.body ?? {};
      if (typeof phone !== "string" || typeof otp !== "string" || typeof challengeId !== "string") {
        throw new AppError("Phone, OTP, and challenge are required", 400, "INVALID_OTP");
      }
      const result = await authService.verifyPhoneOtp(phone, otp, challengeId);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      sendSuccess(res, { user: result.user, accessToken: result.accessToken });
    } catch (error) { next(error); }
  }

  async requestEmailOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
      if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) throw new AppError("Enter a valid email address", 400, "INVALID_EMAIL");
      await authService.requestEmailOtp(email);
      sendSuccess(res, { message: "If an account exists for this email, a sign-in code has been sent." });
    } catch (error) { next(error); }
  }

  async verifyEmailOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body ?? {};
      if (typeof email !== "string" || typeof otp !== "string") throw new AppError("Email and OTP are required", 400, "INVALID_OTP");
      const result = await authService.verifyEmailOtp(email, otp);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      sendSuccess(res, { user: result.user, accessToken: result.accessToken });
    } catch (error) { next(error); }
  }

  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      clearAuthCookies(res);
      sendSuccess(res, { message: "Successfully logged out" });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      sendSuccess(res, { user: formatAuthUser(req.user) });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = verifyEmailSchema.parse(req.body);
      const user = await authService.verifyEmail(input.token);
      sendSuccess(res, { user, message: "Email successfully verified" });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmailLink(req: Request, res: Response): Promise<void> {
    // GET requests may be prefetched by email security scanners. Never consume
    // a one-time verification token on GET; the user must confirm via POST.
    const token = typeof req.query.token === "string" ? req.query.token : "";
    const verifyPage = `${env.FRONTEND_URL.replace(/\/$/, "")}/verify-email`;
    if (!token) {
      res.redirect(303, `${verifyPage}`);
      return;
    }
    res.redirect(303, `${verifyPage}?token=${encodeURIComponent(token)}`);
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = forgotPasswordSchema.parse(req.body);
      const result = await authService.forgotPassword(input.email);
      sendSuccess(res, {
        message: "If an account exists with this email, password reset instructions have been sent.",
        ...(env.NODE_ENV !== "production" && result.token ? { resetToken: result.token } : {}),
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = resetPasswordSchema.parse(req.body);
      await authService.resetPassword(input);
      sendSuccess(res, { message: "Password has been successfully reset" });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      const input = changePasswordSchema.parse(req.body);
      await authService.changePassword(req.user._id.toString(), input);
      sendSuccess(res, { message: "Password updated successfully" });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!token) throw new AppError("Refresh token missing", 401, "REFRESH_TOKEN_REQUIRED");
      const result = await authService.refresh(token);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      sendSuccess(res, { accessToken: result.accessToken });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
