"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  Coins,
  Compass,
  LifeBuoy,
  MessageSquare,
  Settings,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
  LayoutGrid,
} from "lucide-react";
import { AppPageShell } from "../../components/ui/AppPageShell";

const workspaces = [
  { title: "Dashboard", description: "See your activity and active exchanges.", href: "/dashboard", icon: LayoutGrid },
  { title: "Discover", description: "Find members and complementary skill matches.", href: "/discover", icon: Compass },
  { title: "My Skills", description: "Manage the skills you offer and want to learn.", href: "/skills", icon: BookOpen },
  { title: "Exchanges", description: "Review requests and manage your barter lifecycle.", href: "/exchanges", icon: CalendarDays },
  { title: "Messages", description: "Continue conversations with exchange partners.", href: "/messages", icon: MessageSquare },
  { title: "Community", description: "Share posts and take part in community discussions.", href: "/community", icon: Users },
  { title: "Workshops", description: "Browse workshops and publish your own when eligible.", href: "/workshops/workshops", icon: CalendarDays },
  { title: "Trust & Reputation", description: "Review your platform reputation and member feedback.", href: "/trust", icon: ShieldCheck },
  { title: "Safety Centre", description: "Manage blocked members and submit safety reports.", href: "/safety", icon: ShieldAlert },
  { title: "Notifications", description: "Review updates about your account and exchanges.", href: "/notifications", icon: Bell },
  { title: "Settings", description: "Manage your profile and account preferences.", href: "/settings", icon: Settings },
  { title: "Invite Peers", description: "Invite classmates and teammates to join SkillBarter.", href: "/invite", icon: UserPlus },
  { title: "Beta Feedback", description: "Share product feedback with the team.", href: "/feedback", icon: MessageSquare },
  { title: "Help Centre", description: "Find help articles and answers to common questions.", href: "/support/support", icon: LifeBuoy },
  { title: "FAQ", description: "Browse frequently asked questions.", href: "/support/faq", icon: LifeBuoy },
  { title: "Monetization Roadmap", description: "Review planned optional platform features.", href: "/monetization", icon: Coins },
];

export default function ScreensIndexPage() {
  return (
    <AppPageShell
      eyebrow="Product workspace"
      title="Explore SkillBarter"
      description="Open the main workspaces for learning, skill exchanges, community, trust and account support."
      icon={<LayoutGrid className="h-4 w-4" aria-hidden="true" />}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {workspaces.map(({ title, description, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-h-36 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </div>
            <h2 className="mt-4 font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
          </Link>
        ))}
      </div>
    </AppPageShell>
  );
}
