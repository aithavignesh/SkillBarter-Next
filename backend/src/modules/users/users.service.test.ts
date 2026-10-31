import { afterAll, describe, expect, it } from "vitest";
import { User } from "../../models/User";
import { Skill } from "../../models/Skill";
import { UserSkill } from "../../models/UserSkill";
import { usersService } from "./users.service";

describe("UsersService onboarding persistence", () => {
  afterAll(async () => {
    await User.deleteMany({ email: /onboarding-service-test-/ });
  });

  it("preserves zero years of experience for offered and wanted skills", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const user = await User.create({
      email: `onboarding-service-test-${suffix}@example.com`,
      passwordHash: "test-hash",
      displayName: "Onboarding Test",
    });

    await usersService.completeOnboarding(user._id.toString(), {
      displayName: "Onboarding Test",
      bio: "",
      location: "",
      preferredSessionFormat: "video",
      availability: "Flexible",
      offeredSkills: [{
        skillName: `Offered Zero ${suffix}`,
        category: "Testing",
        proficiency: "beginner",
        description: "",
        yearsExperience: 0,
      }],
      wantedSkills: [{
        skillName: `Wanted Zero ${suffix}`,
        category: "Testing",
        proficiency: "beginner",
        description: "",
        yearsExperience: 0,
      }],
    });

    const associations = await UserSkill.find({ userId: user._id });
    expect(associations).toHaveLength(2);
    expect(associations.every((association) => association.yearsExperience === 0)).toBe(true);

    const normalizedNames = [`offered zero ${suffix}`, `wanted zero ${suffix}`];
    await Skill.deleteMany({ normalizedName: { $in: normalizedNames } });
    await UserSkill.deleteMany({ userId: user._id });
    await user.deleteOne();
  });
});
