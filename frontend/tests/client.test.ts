import { describe, expect, it, vi } from "vitest";
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
  it("encodes reserved characters in skill and match search parameters", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ success: true, data: [] }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    try {
      await api.skills.list("Software & Development", "C++ / Regex?");
      const skillUrl = new URL(fetchMock.mock.calls[0][0] as string);
      expect(skillUrl.searchParams.get("category")).toBe("Software & Development");
      expect(skillUrl.searchParams.get("search")).toBe("C++ / Regex?");

      await api.matches.discover("Software & Development", "C++ / Regex?", "in person");
      const matchUrl = new URL(fetchMock.mock.calls[1][0] as string);
      expect(matchUrl.searchParams.get("category")).toBe("Software & Development");
      expect(matchUrl.searchParams.get("search")).toBe("C++ / Regex?");
      expect(matchUrl.searchParams.get("format")).toBe("in person");
    } finally {
      vi.unstubAllGlobals();
    }
  });

});