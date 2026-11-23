import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { User } from "../src/models/User";
import { authService, maskEmail, maskPhone } from "../src/modules/auth/auth.service";
import { hashPassword } from "../src/utils/security";
import {
  inspectAccountConsolidation,
  revertAccountConsolidation,
} from "../src/scripts/accountConsolidationAudit";
import mongoose from "mongoose";

describe("Registration and Phone Validation Integration", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it("registers successfully with a standard 10-digit Indian phone number normalized to +91", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        displayName: "Ravi Kumar",
        email: "ravi.kumar@example.com",
        phone: "9876543210",
        password: "Password123",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe("ravi.kumar@example.com");
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();

    const dbUser = await User.findOne({ email: "ravi.kumar@example.com" });
    expect(dbUser).toBeDefined();
    expect(dbUser?.phone).toBe("+919876543210");
  });

  it("registers successfully with an international E.164 phone number", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        displayName: "John Doe",
        email: "john.doe@example.com",
        phone: "+14155552671",
        password: "Password123",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const dbUser = await User.findOne({ email: "john.doe@example.com" });
    expect(dbUser?.phone).toBe("+14155552671");
  });

  it("rejects registration with an invalid phone format", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        displayName: "Invalid Phone",
        email: "invalid.phone@example.com",
        phone: "12345", // too short, no country code
        password: "Password123",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects registration with duplicate email returning field-specific EMAIL_EXISTS error", async () => {
    // Create first user
    await authService.register({
      displayName: "Existing Email User",
      email: "duplicate.email@example.com",
      phone: "+919876543211",
      password: "Password123",
    });

    // Attempt second registration with same email but different phone
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        displayName: "Another Name",
        email: "duplicate.email@example.com",
        phone: "+919876543212",
        password: "Password123",
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("EMAIL_EXISTS");
    expect(res.body.error.details).toEqual({ field: "email" });
    expect(res.body.error.message).toMatch(/account with this email already exists/i);
  });

  it("rejects registration with duplicate phone returning field-specific PHONE_EXISTS error", async () => {
    // Create first user
    await authService.register({
      displayName: "Existing Phone User",
      email: "first.user@example.com",
      phone: "+919876543215",
      password: "Password123",
    });

    // Attempt second registration with different email but same phone (10-digit format)
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        displayName: "Second User",
        email: "second.user@example.com",
        phone: "9876543215",
        password: "Password123",
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("PHONE_EXISTS");
    expect(res.body.error.details).toEqual({ field: "phone" });
    expect(res.body.error.message).toMatch(/account with this mobile number already exists/i);
  });
});

describe("Account Consolidation and Suspension Login Handling", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it("masks emails and phones correctly for user security and guidance", () => {
    expect(maskEmail("vignesh@example.com")).toBe("v***h@example.com");
    expect(maskEmail("ab@domain.org")).toBe("a***@domain.org");
    expect(maskPhone("+919876543210")).toBe("+91 ********10");
  });

  it("allows active accounts to log in normally", async () => {
    const passwordHash = await hashPassword("Password123");
    await User.create({
      displayName: "Active User",
      email: "active.user@example.com",
      phone: "+919876543220",
      passwordHash,
      role: "user",
      isEmailVerified: true,
      isSuspended: false,
    });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "active.user@example.com",
        password: "Password123",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe("active.user@example.com");
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it("returns ACCOUNT_SUSPENDED for regular suspended accounts", async () => {
    const passwordHash = await hashPassword("Password123");
    await User.create({
      displayName: "Suspended User",
      email: "suspended.user@example.com",
      phone: "+919876543221",
      passwordHash,
      role: "user",
      isEmailVerified: true,
      isSuspended: true,
      suspensionReason: "Terms of service violation",
    });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "suspended.user@example.com",
        password: "Password123",
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("ACCOUNT_SUSPENDED");
    expect(res.body.error.message).toContain("Terms of service violation");
  });

  it("returns ACCOUNT_CONSOLIDATED with masked primary email when logging into a consolidated secondary account", async () => {
    const passwordHash = await hashPassword("Password123");

    // Primary account
    const primaryUser = await User.create({
      displayName: "Primary Owner",
      email: "primary.account@example.com",
      phone: "+919876543222",
      passwordHash,
      role: "user",
      isEmailVerified: true,
      isSuspended: false,
    });

    // Secondary account consolidated into primary account
    await User.create({
      displayName: "Secondary Alias",
      email: "secondary.alias@example.com",
      phone: "+919876543223",
      passwordHash,
      role: "user",
      isEmailVerified: true,
      isSuspended: true,
      suspensionReason: `Account consolidated into primary account ${primaryUser._id.toString()}`,
    });

    // Attempt login with secondary account
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "secondary.alias@example.com",
        password: "Password123",
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("ACCOUNT_CONSOLIDATED");
    expect(res.body.error.message).toContain("consolidated into your primary account");
    expect(res.body.error.message).toContain("p***t@example.com");
    expect(res.body.error.details.primaryEmailMasked).toBe("p***t@example.com");
    expect(res.body.error.details.primaryAccountId).toBe(primaryUser._id.toString());
  });

  it("verifies the primary account remains accessible and login succeeds", async () => {
    const passwordHash = await hashPassword("Password123");

    const primaryUser = await User.create({
      displayName: "Primary Owner",
      email: "primary.accessible@example.com",
      phone: "+919876543225",
      passwordHash,
      role: "user",
      isEmailVerified: true,
      isSuspended: false,
    });

    // Login with primary account
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "primary.accessible@example.com",
        password: "Password123",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.id).toBe(primaryUser._id.toString());
  });
});

describe("Account Consolidation Audit and Revert Script", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it("inspects consolidation state and reports valid primary account status", async () => {
    const passwordHash = await hashPassword("Password123");

    const primary = await User.create({
      displayName: "Main User",
      email: "main.user@example.com",
      phone: "+919876543230",
      passwordHash,
      isSuspended: false,
      isEmailVerified: true,
      onboardingCompleted: true,
    });

    const secondary = await User.create({
      displayName: "Secondary User",
      email: "secondary.user@example.com",
      phone: "+919876543231",
      passwordHash,
      isSuspended: true,
      suspensionReason: `Account consolidated into primary account ${primary._id.toString()}`,
    });

    const report = await inspectAccountConsolidation(primary._id.toString());

    expect(report.primaryUser).toBeDefined();
    expect(report.primaryUser?.email).toBe("main.user@example.com");
    expect(report.consolidatedAccounts).toHaveLength(1);
    expect(report.consolidatedAccounts[0].id).toBe(secondary._id.toString());
    expect(report.summary.isPrimaryValid).toBe(true);
    expect(report.summary.canPrimarySignIn).toBe(true);
  });

  it("enforces security constraints on revertAccountConsolidation and prevents arbitrary unsuspension", async () => {
    const passwordHash = await hashPassword("Password123");

    // 1. Create a regular non-admin user
    const nonAdmin = await User.create({
      displayName: "Regular User",
      email: "regular@example.com",
      phone: "+919876543240",
      passwordHash,
      role: "user",
      isSuspended: false,
    });

    // 2. Create an admin user
    const admin = await User.create({
      displayName: "Security Admin",
      email: "admin@example.com",
      phone: "+919876543241",
      passwordHash,
      role: "admin",
      isSuspended: false,
    });

    // 3. Create a primary user
    const primary = await User.create({
      displayName: "Primary Target",
      email: "primary.target@example.com",
      phone: "+919876543242",
      passwordHash,
      role: "user",
      isSuspended: false,
    });

    // 4. Create an account suspended for non-consolidation terms violation
    const tosViolator = await User.create({
      displayName: "Bad Actor",
      email: "tos.bad@example.com",
      phone: "+919876543243",
      passwordHash,
      role: "user",
      isSuspended: true,
      suspensionReason: "Harassment and spam violations",
    });

    // 5. Create a legitimate consolidated account
    const consolidatedUser = await User.create({
      displayName: "Mistakenly Consolidated",
      email: "mistake@example.com",
      phone: "+919876543244",
      passwordHash,
      role: "user",
      isSuspended: true,
      suspensionReason: `Account consolidated into primary account ${primary._id.toString()}`,
    });

    // Check 1: Non-admin caller is rejected
    const nonAdminAttempt = await revertAccountConsolidation(
      consolidatedUser._id.toString(),
      nonAdmin._id.toString(),
      "Attempting revert as regular user"
    );
    expect(nonAdminAttempt.success).toBe(false);
    expect(nonAdminAttempt.code).toBe("INSUFFICIENT_PERMISSIONS");

    // Check 2: Arbitrary suspended account (non-consolidation) is rejected
    const arbitraryAttempt = await revertAccountConsolidation(
      tosViolator._id.toString(),
      admin._id.toString(),
      "Trying to unsuspend TOS violator"
    );
    expect(arbitraryAttempt.success).toBe(false);
    expect(arbitraryAttempt.code).toBe("NOT_CONSOLIDATED_ACCOUNT");
    const stillSuspended = await User.findById(tosViolator._id);
    expect(stillSuspended?.isSuspended).toBe(true); // Must remain suspended!

    // Check 3: Primary account ID mismatch is rejected
    const wrongPrimaryAttempt = await revertAccountConsolidation(
      consolidatedUser._id.toString(),
      admin._id.toString(),
      "Wrong primary ID",
      "000000000000000000000000"
    );
    expect(wrongPrimaryAttempt.success).toBe(false);
    expect(wrongPrimaryAttempt.code).toBe("PRIMARY_ID_MISMATCH");

    // Check 4: Authorized admin successfully reverts genuine consolidated account
    const validRevert = await revertAccountConsolidation(
      consolidatedUser._id.toString(),
      admin._id.toString(),
      "Consolidation performed in error; confirmed separate user identity",
      primary._id.toString()
    );
    expect(validRevert.success).toBe(true);

    const unsuspendedUser = await User.findById(consolidatedUser._id);
    expect(unsuspendedUser?.isSuspended).toBe(false);
    expect(unsuspendedUser?.suspensionReason).toBeUndefined();
  });
});
