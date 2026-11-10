import { notFound, redirect } from "next/navigation";

// Compatibility layer for deep links that existed in the legacy React Router app.
// Redirect only to real Next.js destinations; unported workflows must not appear as
// separate pages until their data and actions are implemented.
const sectionTargets: Record<string, string> = {
  home: "/dashboard",
  learning: "/skills",
  workshops: "/workshops/workshops",
  requests: "/exchanges",
  membership: "/monetization",
  support: "/support/support",
  activity: "/dashboard",
  discover: "/discover",
  matches: "/matches",
  notifications: "/notifications",
  trust: "/trust",
};

const screenTargets: Record<string, string> = {
  dashboard: "/dashboard",
  "edit-profile": "/profile/edit",
  "public-profile": "/profile",
  skills: "/skills",
  "add-skill": "/skills",
  "learning-goals": "/skills",
  "teaching-skills": "/skills",
  search: "/discover",
  "advanced-search": "/discover",
  recommended: "/matches",
  "ai-matching": "/matches",
  "match-details": "/matches",
  "send-request": "/matches",
  "incoming-requests": "/exchanges?view=incoming",
  "sent-requests": "/exchanges?view=sent",
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
  workshops: "/workshops/workshops",
  "create-workshop": "/workshops/create-workshop",
  "workshop-details": "/workshops/workshop-details",
  "my-workshops": "/workshops/my-workshops",
  credits: "/monetization",
  premium: "/monetization",
  verification: "/trust",
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
    const target = slug ? screenTargets[slug] : "/screens";
    if (!target) notFound();
    redirect(target);
  }

  if (!section) notFound();
  const target = sectionTargets[section];
  if (!target) notFound();
  redirect(target);
}
