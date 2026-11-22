import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "../config/env";
import {
  isEmailConfigured,
  sendLoginOtpEmail,
  sendVerificationEmail,
} from "./email";

const originalResendApiKey = env.RESEND_API_KEY;
const originalEmailFrom = env.EMAIL_FROM;
const originalEmailDisabled = env.EMAIL_DISABLED;

afterEach(() => {
  env.RESEND_API_KEY = originalResendApiKey;
  env.EMAIL_FROM = originalEmailFrom;
  env.EMAIL_DISABLED = originalEmailDisabled;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Resend transactional email adapter", () => {
  it("sends a verification email with escaped display names and an encoded token", async () => {
    env.RESEND_API_KEY = "re_test_key";
    env.EMAIL_FROM = "SkillBarter <no-reply@example.test>";
    env.EMAIL_DISABLED = "false";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "email_test_123" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const sent = await sendVerificationEmail(
      "member@example.test",
      "A&B <Member>",
      "token value/with+symbols",
    );

    expect(sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer re_test_key");

    const body = JSON.parse(String(init.body)) as {
      from: string;
      to: string[];
      subject: string;
      html: string;
      text: string;
    };
    expect(body.from).toBe("SkillBarter <no-reply@example.test>");
    expect(body.to).toEqual(["member@example.test"]);
    expect(body.subject).toBe("Verify your SkillBarter email");
    expect(body.html).toContain("A&amp;B &lt;Member&gt;");
    expect(body.html).toContain("token%20value%2Fwith%2Bsymbols");
    expect(body.text).toContain("token%20value%2Fwith%2Bsymbols");
  });

  it("sends the six-digit sign-in code in both text and HTML email bodies", async () => {
    env.RESEND_API_KEY = "re_test_key";
    env.EMAIL_FROM = "SkillBarter <no-reply@example.test>";
    env.EMAIL_DISABLED = "false";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "email_test_otp" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const sent = await sendLoginOtpEmail("member@example.test", "Member", "042731");

    expect(sent).toBe(true);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as { text: string; html: string };
    expect(body.text).toContain("042731");
    expect(body.html).toContain("042731");
  });

  it("does not attempt delivery when provider configuration is missing outside production", async () => {
    env.RESEND_API_KEY = undefined;
    env.EMAIL_FROM = undefined;

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(isEmailConfigured()).toBe(false);
    await expect(
      sendVerificationEmail("member@example.test", "Member", "token"),
    ).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects provider errors without logging recipient or token values", async () => {
    env.RESEND_API_KEY = "re_test_key";
    env.EMAIL_FROM = "SkillBarter <no-reply@example.test>";
    env.EMAIL_DISABLED = "false";

    const recipient = "private-recipient@example.test";
    const token = "private-verification-token";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ name: "validation_error", message: recipient }), { status: 422 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(sendVerificationEmail(recipient, "Member", token)).rejects.toThrow("HTTP 422");

    const logged = JSON.stringify(errorLog.mock.calls);
    expect(logged).not.toContain(recipient);
    expect(logged).not.toContain(token);
  });
});
