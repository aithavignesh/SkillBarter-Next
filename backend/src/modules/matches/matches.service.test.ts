import { afterEach, describe, expect, it, vi } from "vitest";
import { User } from "../../models/User";
import { UserSkill } from "../../models/UserSkill";
import { MatchesService } from "./matches.service";

describe("MatchesService candidate visibility", () => {
  afterEach(() => {
    vi.restoreAllMocks();
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
