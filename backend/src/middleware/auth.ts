import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../utils/security";
import { User, IUser } from "../models/User";
import { AppError } from "./errorHandler";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      tokenPayload?: TokenPayload;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) throw new AppError("Authentication required", 401, "UNAUTHORIZED");

    const payload = verifyAccessToken(token);
    if (!payload) throw new AppError("Invalid or expired session token", 401, "INVALID_TOKEN");

    const user = await User.findById(payload.userId);
    if (!user) throw new AppError("User account not found", 401, "USER_NOT_FOUND");
    if (user.passwordChangedAt && (!payload.iat || payload.iat < user.passwordChangedAt.getTime() / 1000)) {
      throw new AppError("Password changed; please sign in again", 401, "SESSION_REVOKED");
    }
    if (user.isSuspended) {
      throw new AppError(
        `Your account has been suspended: ${user.suspensionReason || "Violation of terms"}`,
        403,
        "ACCOUNT_SUSPENDED"
      );
    }

    // Email verification is optional. A valid authenticated session (including
    // one established by verified mobile OTP) is sufficient to use the app.
    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) {
        const user = await User.findById(payload.userId);
        const tokenIsCurrent = !user?.passwordChangedAt || Boolean(payload.iat && payload.iat >= user.passwordChangedAt.getTime() / 1000);
        if (user && tokenIsCurrent && !user.isSuspended) {
          req.user = user;
          req.tokenPayload = payload;
        }
      }
    }
    next();
  } catch {
    next();
  }
}

export function requireRole(role: "admin" | "user") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
    if (role === "admin" && req.user.role !== "admin") {
      return next(new AppError("Administrative privileges required", 403, "FORBIDDEN"));
    }
    next();
  };
}
