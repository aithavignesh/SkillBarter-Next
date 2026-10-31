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


  it("refreshes an expired browser access token once and retries the request", async () => {
    let storedToken: string | null = "expired-token";
    const storage = {
      getItem: vi.fn(() => storedToken),
      setItem: vi.fn((_key: string, value: string) => { storedToken = value; }),
      removeItem: vi.fn(() => { storedToken = null; }),
    };
    const responses = [
      { ok: false, status: 401, statusText: "Unauthorized", json: async () => ({ success: false, error: { code: "INVALID_TOKEN", message: "expired" } }) },
      { ok: true, status: 200, statusText: "OK", json: async () => ({ success: true, data: { accessToken: "fresh-token" } }) },
      { ok: true, status: 200, statusText: "OK", json: async () => ({ success: true, data: [] }) },
    ];
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => responses.shift() as unknown as Response);
    vi.stubGlobal("window", {} as Window);
    vi.stubGlobal("localStorage", storage as unknown as Storage);
    vi.stubGlobal("fetch", fetchMock);

    try {
      await expect(api.skills.list()).resolves.toEqual([]);
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(String(fetchMock.mock.calls[1][0])).toContain("/auth/refresh");
      const retryInit = fetchMock.mock.calls[2][1];
      expect(new Headers(retryInit?.headers).get("Authorization")).toBe("Bearer fresh-token");
      expect(storage.setItem).toHaveBeenCalledWith("skillbarter_token", "fresh-token");
    } finally {
      vi.unstubAllGlobals();
    }
  });

});