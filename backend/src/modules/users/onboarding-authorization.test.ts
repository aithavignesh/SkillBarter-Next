import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { User } from "../../models/User";
import { Skill } from "../../models/Skill";
import { UserSkill } from "../../models/UserSkill";
import { AnalyticsEvent } from "../../models/AnalyticsEvent";
import { app } from "../../app";
import { signAccessToken } from "../../utils/security";

describe("Server-side onboarding authorization", () => {
  const userIds: string[] = [];
  const skillNames: string[] = [];

  afterAll(async () => {
    await UserSkill.deleteMany({ userId: { $in: userIds } });
    await AnalyticsEvent.deleteMany({ userId: { $in: userIds } });
    await User.deleteMany({ _id: { $in: userIds } });
    await Skill.deleteMany({ normalizedName: { $in: skillNames } });
  });

  it("blocks verified but incomplete members from protected feature APIs while preserving safety access", async () => {
    const suffix = Date.now() + "-" + Math.random().toString(36).slice(2);
    const user = await User.create({
      email: "onboarding-gate-" + suffix + "@example.com",
      passwordHash: "test-hash",
      displayName: "Incomplete Member",
      role: "user",
      isEmailVerified: true,
      onboardingCompleted: false,
    });
    userIds.push(user._id.toString());

    const token = signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: "user",
    });
    const authorization = "Bearer " + token;

    const responses = await Promise.all([
      request(app).get("/api/v1/matches/recommendations").set("Authorization", authorization),
      request(app).get("/api/v1/matches/discover").set("Authorization", authorization),
      request(app).get("/api/v1/exchanges").set("Authorization", authorization),
      request(app).get("/api/v1/messages/conversations").set("Authorization", authorization),
      request(app).get("/api/v1/notifications").set("Authorization", authorization),
      request(app).get("/api/v1/skills/user").set("Authorization", authorization),
      request(app).get("/api/v1/community/connections").set("Authorization", authorization),
      request(app).post("/api/v1/community/posts").set("Authorization", authorization).send({}),
      request(app).post("/api/v1/reviews").set("Authorization", authorization).send({}),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("ONBOARDING_INCOMPLETE");
    }

    const safetyResponse = await request(app)
      .get("/api/v1/safety/blocked")
      .set("Authorization", authorization);
    expect(safetyResponse.status).toBe(200);
  });

  it("lets an unverified member complete onboarding, but keeps protected features locked until email verification", async () => {
    const suffix = Date.now() + "-" + Math.random().toString(36).slice(2);
    const user = await User.create({
      email: "unverified-onboarding-" + suffix + "@example.com",
      passwordHash: "test-hash",
      displayName: "New Member",
      role: "user",
      isEmailVerified: false,
      onboardingCompleted: false,
    });
    userIds.push(user._id.toString());

    const offeredSkillName = "Onboarding Offered " + suffix;
    const wantedSkillName = "Onboarding Wanted " + suffix;
    skillNames.push(offeredSkillName.toLowerCase(), wantedSkillName.toLowerCase());

    const token = signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: "user",
    });
    const authorization = "Bearer " + token;

    const onboardingResponse = await request(app)
      .post("/api/v1/users/onboarding")
      .set("Authorization", authorization)
      .send({
        displayName: "New Member",
        bio: "Ready to teach and learn.",
        location: "Hyderabad",
        preferredSessionFormat: "video",
        availability: "Flexible",
        offeredSkills: [
          {
            skillName: offeredSkillName,
            category: "Testing",
            proficiency: "intermediate",
            description: "A test skill offered during onboarding.",
            yearsExperience: 1,
          },
        ],
        wantedSkills: [
          {
            skillName: wantedSkillName,
            category: "Testing",
            proficiency: "beginner",
            description: "A test skill wanted during onboarding.",
            yearsExperience: 0,
          },
        ],
      });

    expect(onboardingResponse.status).toBe(200);
    expect(onboardingResponse.body.data.user.onboardingCompleted).toBe(true);
    expect(onboardingResponse.body.data.user.isEmailVerified).toBe(false);

    const stillUnverified = await request(app)
      .get("/api/v1/matches/recommendations")
      .set("Authorization", authorization);
    expect(stillUnverified.status).toBe(403);
    expect(stillUnverified.body.error.code).toBe("EMAIL_NOT_VERIFIED");

    const discoverStillUnverified = await request(app)
      .get("/api/v1/matches/discover")
      .set("Authorization", authorization);
    expect(discoverStillUnverified.status).toBe(403);
    expect(discoverStillUnverified.body.error.code).toBe("EMAIL_NOT_VERIFIED");

    user.isEmailVerified = true;
    await user.save();

    const verified = await request(app)
      .get("/api/v1/matches/recommendations")
      .set("Authorization", authorization);
    expect(verified.status).toBe(200);

    const discoverVerified = await request(app)
      .get("/api/v1/matches/discover")
      .set("Authorization", authorization);
    expect(discoverVerified.status).toBe(200);
  });
});
