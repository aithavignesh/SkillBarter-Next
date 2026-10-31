import { env } from "../config/env";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

export function isEmailConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
}

async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!isEmailConfigured()) {
    if (env.NODE_ENV === "production") {
      throw new Error("Transactional email is not configured");
    }
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    // Do not log the response body: provider responses may contain recipient data.
    throw new Error(`Transactional email provider returned HTTP ${response.status}`);
  }

  return true;
}

export async function sendVerificationEmail(
  email: string,
  displayName: string,
  token: string,
): Promise<boolean> {
  const link = `${env.FRONTEND_URL.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(token)}`;
  const safeName = escapeHtml(displayName);

  return sendEmail({
    to: email,
    subject: "Verify your SkillBarter email",
    text: `Hi ${displayName}, verify your SkillBarter email by opening this link: ${link}. This link expires in 24 hours.`,
    html: `<p>Hi ${safeName},</p><p>Thanks for joining SkillBarter. Confirm your email address using the link below. It expires in 24 hours.</p><p><a href="${link}">Verify my email</a></p><p>If you did not create this account, you can ignore this email.</p>`,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  displayName: string,
  token: string,
): Promise<boolean> {
  const link = `${env.FRONTEND_URL.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
  const safeName = escapeHtml(displayName);

  return sendEmail({
    to: email,
    subject: "Reset your SkillBarter password",
    text: `Hi ${displayName}, reset your SkillBarter password using this link: ${link}. This link expires in one hour. If you did not request a reset, ignore this email.`,
    html: `<p>Hi ${safeName},</p><p>A password reset was requested for your SkillBarter account. This link expires in one hour.</p><p><a href="${link}">Reset my password</a></p><p>If you did not request this, you can safely ignore this email.</p>`,
  });
}
