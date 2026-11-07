import { afterAll, describe, expect, it } from "vitest";
import { User } from "../../models/User";
import { Block } from "../../models/Block";
import { usersService } from "./users.service";

describe("Public profile privacy boundaries", () => {
  const createdUserIds: string[] = [];

  afterAll(async () => {
    await Block.deleteMany({ $or: [{ blockerId: { $in: createdUserIds } }, { blockedUserId: { $in: createdUserIds } }] });
    await User.deleteMany({ _id: { $in: createdUserIds } });
  });

  it("hides private profiles from other members and omits account contact details", async () => {
    const suffix = Date.now() + "-" + Math.random().toString(36).slice(2);
    const owner = await User.create({
      email: "profile-privacy-owner-" + suffix + "@example.com",
      passwordHash: "test-hash",
      displayName: "Private Profile Owner",
      isProfilePublic: false,
      isEmailVerified: true,
    });
    const visitor = await User.create({
      email: "profile-privacy-visitor-" + suffix + "@example.com",
      passwordHash: "test-hash",
      displayName: "Profile Visitor",
      isEmailVerified: true,
    });
    createdUserIds.push(owner._id.toString(), visitor._id.toString());

    await expect(
      usersService.getPublicProfile(owner._id.toString(), visitor._id.toString()),
    ).rejects.toMatchObject({ statusCode: 403, code: "PROFILE_PRIVATE" });

    const ownProfile = await usersService.getPublicProfile(owner._id.toString(), owner._id.toString());
    expect(ownProfile).not.toHaveProperty("email");
    expect(ownProfile).not.toHaveProperty("phone");
  });

  it("hides profiles in both directions after either member blocks the other", async () => {
    const suffix = Date.now() + "-" + Math.random().toString(36).slice(2);
    const blocker = await User.create({
      email: "profile-blocker-" + suffix + "@example.com",
      passwordHash: "test-hash",
      displayName: "Profile Blocker",
      isEmailVerified: true,
    });
    const blocked = await User.create({
      email: "profile-blocked-" + suffix + "@example.com",
      passwordHash: "test-hash",
      displayName: "Blocked Member",
      isEmailVerified: true,
    });
    createdUserIds.push(blocker._id.toString(), blocked._id.toString());
    await Block.create({ blockerId: blocker._id, blockedUserId: blocked._id, reason: "privacy test" });

    await expect(
      usersService.getPublicProfile(blocked._id.toString(), blocker._id.toString()),
    ).rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
    await expect(
      usersService.getPublicProfile(blocker._id.toString(), blocked._id.toString()),
    ).rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
  });
});
