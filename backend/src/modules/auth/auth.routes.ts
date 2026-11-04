import { createHash } from "node:crypto";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authController } from "./auth.controller";
import { authenticate } from "../../middleware/auth";

export const authRouter = Router();

const rateLimitMessage = {
  success: false,
  error: {
    code: "RATE_LIMITED",
    message: "Too many authentication attempts, please try again later.",
  },
};

// Keep ordinary authentication protection separate from registration and OTP
// delivery so requests to one flow cannot exhaust the allowance for another.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: rateLimitMessage,
});

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: rateLimitMessage,
});

// A shared IP ceiling protects OTP delivery while allowing several people
// behind the same office, campus, or mobile-carrier NAT to register.
const otpIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: rateLimitMessage,
});

// Also cap OTP sends per destination, independently for each email/phone.
// Hash the normalized destination so the rate-limit store does not retain PII.
const createOtpDestinationLimiter = (field: "email" | "phone") =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req) => {
      const destination = String(req.body?.[field] ?? "")
        .trim()
        .toLowerCase();
      return createHash("sha256")
        .update(destination || `${field}:${req.ip}`)
        .digest("hex");
    },
    message: rateLimitMessage,
  });

const emailOtpDestinationLimiter = createOtpDestinationLimiter("email");
const phoneOtpDestinationLimiter = createOtpDestinationLimiter("phone");

authRouter.post("/register", registrationLimiter, (req, res, next) => authController.register(req, res, next));
authRouter.post("/login", authLimiter, (req, res, next) => authController.login(req, res, next));
authRouter.post(
  "/phone/request-otp",
  otpIpLimiter,
  phoneOtpDestinationLimiter,
  (req, res, next) => authController.requestPhoneOtp(req, res, next)
);
authRouter.post("/phone/verify-otp", authLimiter, (req, res, next) => authController.verifyPhoneOtp(req, res, next));
authRouter.post(
  "/email/request-otp",
  otpIpLimiter,
  emailOtpDestinationLimiter,
  (req, res, next) => authController.requestEmailOtp(req, res, next)
);
authRouter.post("/email/verify-otp", authLimiter, (req, res, next) => authController.verifyEmailOtp(req, res, next));
authRouter.post("/logout", (req, res, next) => authController.logout(req, res, next));
authRouter.get("/me", authenticate, (req, res, next) => authController.getMe(req, res, next));
authRouter.get("/verify-email/link", (req, res) => authController.verifyEmailLink(req, res));
authRouter.post("/verify-email", authLimiter, (req, res, next) => authController.verifyEmail(req, res, next));
authRouter.post("/forgot-password", authLimiter, (req, res, next) => authController.forgotPassword(req, res, next));
authRouter.post("/reset-password", authLimiter, (req, res, next) => authController.resetPassword(req, res, next));
authRouter.post("/change-password", authenticate, (req, res, next) => authController.changePassword(req, res, next));
authRouter.post("/refresh", authLimiter, (req, res, next) => authController.refreshToken(req, res, next));
