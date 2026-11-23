import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";

const { verifyEmailOtpMock, verifyPhoneOtpMock } = vi.hoisted(() => ({
  verifyEmailOtpMock: vi.fn(),
  verifyPhoneOtpMock: vi.fn(),
}));

vi.mock("./auth.service", () => ({
  authService: {
    verifyEmailOtp: verifyEmailOtpMock,
    verifyPhoneOtp: verifyPhoneOtpMock,
  },
  formatAuthUser: vi.fn(),
}));

import { authController } from "./auth.controller";

const user = {
  id: "507f1f77bcf86cd799439011",
  email: "otp-user@example.test",
  displayName: "OTP Test User",
  role: "user",
  isEmailVerified: false,
  onboardingCompleted: false,
  isProfilePublic: true,
  locationVisibility: true,
  reputationScore: 0,
  completedExchangesCount: 0,
  createdAt: "2026-11-23T00:00:00.000Z",
};
const accessToken = "test-access-token";
const refreshToken = "test-refresh-token";

function makeResponse() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const cookie = vi.fn();
  const response = { json, status, cookie } as unknown as Response;
  return { response, json, status, cookie };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("OTP authentication response contract", () => {
  it("returns the refresh token after phone OTP verification", async () => {
    verifyPhoneOtpMock.mockResolvedValue({ user, accessToken, refreshToken });
    const { response, json, status, cookie } = makeResponse();
    const next = vi.fn() as unknown as NextFunction;
    const request = {
      body: { phone: "+919876543210", otp: "123456", challengeId: "test-challenge" },
    } as unknown as Request;

    await authController.verifyPhoneOtp(request, response, next);

    expect(next).not.toHaveBeenCalled();
    expect(cookie).toHaveBeenCalledWith("refreshToken", refreshToken, expect.any(Object));
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: { user, accessToken, refreshToken },
    });
  });

  it("returns the refresh token after email OTP verification", async () => {
    verifyEmailOtpMock.mockResolvedValue({ user, accessToken, refreshToken });
    const { response, json, status, cookie } = makeResponse();
    const next = vi.fn() as unknown as NextFunction;
    const request = {
      body: { email: "otp-user@example.test", otp: "123456" },
    } as unknown as Request;

    await authController.verifyEmailOtp(request, response, next);

    expect(next).not.toHaveBeenCalled();
    expect(cookie).toHaveBeenCalledWith("refreshToken", refreshToken, expect.any(Object));
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: { user, accessToken, refreshToken },
    });
  });
});
