import { notFound, redirect } from "next/navigation";

// Compatibility layer for deep links that existed in the legacy React Router app.
// These routes redirect only to the closest currently implemented Next.js destination;
// they do not pretend that unported legacy screens have their own data/UI yet.
const sectionTargets: Record<string, string> = {
  home: "/dashboard",
  learning: "/skills",
  workshops: "/community",
  requests: "/exchanges",
  membership: "/monetization",
  support: "/support/support",
  activity: "/dashboard",
  discover: "/discover",
  matches: "/discover",
  notifications: "/notifications",
};

const screenTargets: Record<string, string> = {
  dashboard: "/dashboard",
  "edit-profile": "/settings",
  "public-profile": "/discover",
  skills: "/skills",
  "add-skill": "/skills",
  "learning-goals": "/skills",
  "teaching-skills": "/skills",
  search: "/discover",
  "advanced-search": "/discover",
  recommended: "/discover",
  "ai-matching": "/discover",
  "match-details": "/discover",
  "send-request": "/exchanges",
  "incoming-requests": "/exchanges",
  "sent-requests": "/exchanges",
  "request-details": "/exchanges",
  "active-exchange": "/exchanges",
  "exchange-history": "/exchanges",
  "exchange-rating": "/exchanges",
  schedule: "/exchanges",
  calendar: "/exchanges",
  notifications: "/notifications",
  "notification-settings": "/settings",
  "chat-details": "/messages",
  "create-post": "/community",
  "post-details": "/community",
  groups: "/community",
  "group-details": "/community",
  workshops: "/community",
  "create-workshop": "/community",
  "workshop-details": "/community",
  "my-workshops": "/community",
  credits: "/monetization",
  premium: "/monetization",
  verification: "/safety",
  support: "/support/support",
  faq: "/support/faq",
  privacy: "/settings",
  "account-settings": "/settings",
  activity: "/dashboard",
};

export default async function LegacyRoute({ params }: { params: Promise<{ legacy: string[] }> }) {
  const { legacy } = await params;
  const [section, slug] = legacy;

  if (section === "screens") {
    const target = slug ? screenTargets[slug] : "/dashboard";
    if (!target) notFound();
    redirect(target);
  }

  if (!section) notFound();
  const target = sectionTargets[section];
  if (!target) notFound();
  redirect(target);
}
