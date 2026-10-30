import { describe, expect, it } from "vitest";
import { api } from "../src/services/api";
import { registerSchema, loginSchema, onboardingSchema } from "@skillbarter/shared";

describe("Frontend Client Services & Schemas", () => {
  it("exports all domain API clients", () => {
    expect(api.auth).toBeDefined();
    expect(api.users).toBeDefined();
    expect(api.skills).toBeDefined();
    expect(api.matches).toBeDefined();
    expect(api.exchanges).toBeDefined();
    expect(api.messages).toBeDefined();
    expect(api.notifications).toBeDefined();
    expect(api.reviews).toBeDefined();
    expect(api.community).toBeDefined();
    expect(api.safety).toBeDefined();
    expect(api.admin).toBeDefined();
    expect(api.analytics).toBeDefined();
  });

  it("validates registration schema on the client side", () => {
    const valid = registerSchema.safeParse({
      email: "learner@example.com",
      password: "StrongPassword123!",
      displayName: "Learner One",
    });
    expect(valid.success).toBe(true);

    const invalid = registerSchema.safeParse({
      email: "not-an-email",
      password: "short",
      displayName: "L",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates onboarding schema with skills offered and wanted", () => {
    const valid = onboardingSchema.safeParse({
      displayName: "Jane Developer",
      bio: "Passionate about open-source learning.",
      location: "San Francisco, CA",
      preferredSessionFormat: "video",
      availability: "Weekends",
      offeredSkills: [
        {
          skillName: "TypeScript",
          category: "Software Development",
          proficiency: "advanced",
          yearsExperience: 4,
          description: "Full stack TypeScript",
        },
      ],
      wantedSkills: [
        {
          skillName: "Spanish",
          category: "Languages",
          proficiency: "beginner",
          yearsExperience: 0,
          description: "Conversational Spanish",
        },
      ],
    });
    expect(valid.success).toBe(true);
  });
});
