import { afterEach, describe, expect, it } from "vitest";
import { User } from "../../models/User";
import { adminService } from "./admin.service";

describe("AdminService search and pagination", () => {
  afterEach(async () => {
    await User.deleteMany({ email: { $regex: /^admin-search-(test|other)-/ } });
  });

  it("treats search metacharacters as literal text", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const literal = await User.create({
      email: `admin-search-test-${suffix}@example.com`,
      passwordHash: "test-hash",
      displayName: "Literal .* Query",
    });
    await User.create({
      email: `admin-search-other-${suffix}@example.com`,
      passwordHash: "test-hash",
      displayName: "Ordinary User",
    });

    const result = await adminService.listUsers(1, 20, ".*");
    expect(result.users.map((user) => user.id)).toEqual([literal._id.toString()]);
  });

  it("normalizes invalid pagination and caps the page size", async () => {
    const result = await adminService.listUsers(0, 1000);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(100);
  });

  it("rejects excessively long search strings", async () => {
    await expect(adminService.listUsers(1, 20, "x".repeat(101))).rejects.toThrow(
      "Search query must be 100 characters or fewer",
    );
  });
});
