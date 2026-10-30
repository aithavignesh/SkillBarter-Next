import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authController } from "./auth.controller";
import { authenticate } from "../../middleware/auth";

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 25, // limit each IP to 25 requests per windowMs for auth sensitive endpoints
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many authentication attempts, please try again later.",
    },
  },
});

authRouter.post("/register", authLimiter, (req, res, next) => authController.register(req, res, next));
authRouter.post("/login", authLimiter, (req, res, next) => authController.login(req, res, next));
authRouter.post("/logout", (req, res, next) => authController.logout(req, res, next));
authRouter.get("/me", authenticate, (req, res, next) => authController.getMe(req, res, next));
authRouter.post("/verify-email", (req, res, next) => authController.verifyEmail(req, res, next));
authRouter.post("/forgot-password", authLimiter, (req, res, next) => authController.forgotPassword(req, res, next));
authRouter.post("/reset-password", authLimiter, (req, res, next) => authController.resetPassword(req, res, next));
authRouter.post("/change-password", authenticate, (req, res, next) => authController.changePassword(req, res, next));
authRouter.post("/refresh", (req, res, next) => authController.refreshToken(req, res, next));
