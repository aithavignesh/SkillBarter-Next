import { afterEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { User } from "../../models/User";
import { UserSkill } from "../../models/UserSkill";
import { Block } from "../../models/Block";
import { AnalyticsEvent } from "../../models/AnalyticsEvent";
import { MatchesService } from "./matches.service";

describe("MatchesService candidate visibility", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns one eligible member with reciprocal skill detail", async () => {
    const currentUserId = new mongoose.Types.ObjectId();
    const targetUserId = new mongoose.Types.ObjectId();
    const candidate = {
      _id: targetUserId,
      displayName: "Match Detail Member",
      bio: "Happy to exchange practical skills.",
      avatarUrl: "",
      location: "Hyderabad",
      preferredSessionFormat: "online",
      availability: "Weekends",
      reputationScore: 4.6,
      completedExchangesCount: 2,
    };
    const myOfferedSkill = {
      _id: new mongoose.Types.ObjectId(),
      userId: currentUserId,
      type: "offered",
      skillName: "React",
      category: "Programming",
      proficiency: "Advanced",
    };
    const myWantedSkill = {
      _id: new mongoose.Types.ObjectId(),
      userId: currentUserId,
      type: "wanted",
      skillName: "Python",
      category: "Programming",
      proficiency: "Beginner",
    };
    const candidateOfferedSkill = {
      _id: new mongoose.Types.ObjectId(),
      userId: targetUserId,
      type: "offered",
      skillName: "Python",
      category: "Programming",
      proficiency: "Advanced",
    };
    const candidateWantedSkill = {
      _id: new mongoose.Types.ObjectId(),
      userId: targetUserId,
      type: "wanted",
      skillName: "React",
      category: "Programming",
      proficiency: "Intermediate",
    };

    const userSkillFind = vi.spyOn(UserSkill, "find")
      .mockResolvedValueOnce([myOfferedSkill] as never)
      .mockResolvedValueOnce([myWantedSkill] as never)
      .mockResolvedValueOnce([candidateOfferedSkill, candidateWantedSkill] as never);
    vi.spyOn(Block, "find").mockResolvedValue([] as never);
    const limit = vi.fn().mockResolvedValue([candidate]);
    vi.spyOn(User, "find").mockReturnValue(
      { limit } as unknown as ReturnType<typeof User.find>
    );
    vi.spyOn(AnalyticsEvent, "create").mockResolvedValue({} as never);

    const service = new MatchesService();
    const match = await service.getMatchDetails(currentUserId.toString(), targetUserId.toString());

    expect(match.user.id).toBe(targetUserId.toString());
    expect(match.reciprocalMatch).toBe(true);
    expect(match.theyTeachYouLearn.map((skill) => skill.name)).toContain("Python");
    expect(match.youTeachTheyLearn.map((skill) => skill.name)).toContain("React");
    expect(User.find).toHaveBeenCalled();
    expect(userSkillFind).toHaveBeenCalledTimes(3);
  });

  it("rejects invalid and unavailable match IDs", async () => {
    const service = new MatchesService();
    await expect(service.getMatchDetails(new mongoose.Types.ObjectId().toString(), "invalid"))
      .rejects.toMatchObject({ statusCode: 400, code: "INVALID_ID" });

    const currentUserId = new mongoose.Types.ObjectId();
    const targetUserId = new mongoose.Types.ObjectId();
    vi.spyOn(Block, "find").mockResolvedValue([
      { blockerId: currentUserId, blockedUserId: targetUserId },
    ] as never);
    vi.spyOn(UserSkill, "find").mockResolvedValue([] as never);
    const limit = vi.fn().mockResolvedValue([]);
    vi.spyOn(User, "find").mockReturnValue({ limit } as unknown as ReturnType<typeof User.find>);
    vi.spyOn(AnalyticsEvent, "create").mockResolvedValue({} as never);

    await expect(service.getMatchDetails(currentUserId.toString(), targetUserId.toString()))
      .rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
  });

  it("only includes verified, public, onboarded, non-suspended members as candidates", async () => {
    const limit = vi.fn().mockResolvedValue([]);
    const candidateQuery = { limit };
    const userFind = vi.spyOn(User, "find").mockReturnValue(
      candidateQuery as unknown as ReturnType<typeof User.find>
    );
    vi.spyOn(UserSkill, "find").mockResolvedValue([] as never);

    const service = new MatchesService();
    await service.discoverMatches();

    expect(userFind).toHaveBeenCalledWith(
      expect.objectContaining({
        isProfilePublic: true,
        isSuspended: false,
        isEmailVerified: true,
        onboardingCompleted: true,
      })
    );
    expect(limit).toHaveBeenCalledWith(100);
  });
});
