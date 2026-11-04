"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Search, ShieldCheck, Users } from "lucide-react";
import { AppPageShell } from "../../../components/ui/AppPageShell";

const topics = [
  {
    id: "account",
    title: "Account",
    description: "Login, email verification, profile setup and account access.",
    examples: ["Create or verify an account", "Update your profile", "Recover account access"],
    icon: Users,
  },
  {
    id: "exchanges",
    title: "Exchanges",
    description: "Requests, reciprocal skills, scheduling, completion and reviews.",
    examples: ["Send or accept a request", "Schedule a session", "Complete and review an exchange"],
    icon: BookOpen,
  },
  {
    id: "community",
    title: "Community & safety",
    description: "Community posts, member interactions, reporting and blocking.",
    examples: ["Find community discussions", "Report inappropriate behaviour", "Block a member"],
    icon: ShieldCheck,
  },
];

export default function SupportPage() {
  const [query, setQuery] = useState("");
  const filteredTopics = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return topics;
    return topics.filter((topic) =>
      [topic.title, topic.description, ...topic.examples]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [query]);

  return (
    <AppPageShell
      eyebrow="Help centre"
      title="How can we help?"
      description="Find guidance for the account, exchange and community workflows in SkillBarter."
      icon={<BookOpen className="h-3.5 w-3.5" />}
    >
      <section className="sb-surface p-5 sm:p-7">
        <label htmlFor="support-topic-search" className="block text-sm font-semibold text-slate-800">
          Search help topics
        </label>
        <div className="mt-2 flex items-center gap-2">
          <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <input
            id="support-topic-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try account, scheduling or reporting"
            className="sb-control min-h-11 w-full px-3 text-sm"
          />
        </div>
      </section>

      <section aria-label="Help categories" className="mt-5 grid gap-4 md:grid-cols-3">
        {filteredTopics.map((topic) => {
          const Icon = topic.icon;
          return (
            <article key={topic.id} className="sb-surface flex min-w-0 flex-col p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-[#b71920]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-base font-bold text-slate-900">{topic.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{topic.description}</p>
              <ul className="mt-4 flex-1 space-y-2 text-xs text-slate-500">
                {topic.examples.map((example) => (
                  <li key={example} className="break-words">• {example}</li>
                ))}
              </ul>
              <Link
                href={`/support/faq#${topic.id}`}
                className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#b71920] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
              >
                Browse answers <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>
          );
        })}
        {filteredTopics.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 md:col-span-3" role="status">
            No help topics match “{query}”. Try a broader search or browse all frequently asked questions.
          </p>
        )}
      </section>

      <section className="mt-5 rounded-2xl border border-red-100 bg-red-50/70 p-5 sm:flex sm:items-center sm:justify-between sm:gap-5">
        <div className="min-w-0">
          <h2 className="font-bold text-slate-900">Need help with member safety?</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Use the Safety Centre to review reporting and blocking options.
          </p>
        </div>
        <Link
          href="/safety"
          className="mt-4 inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-[#d31d24] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b71920] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 sm:mt-0"
        >
          Open Safety Centre <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>

      <p className="mt-5 text-center text-sm text-slate-500">
        Looking for a quick answer?{" "}
        <Link href="/support/faq" className="font-semibold text-[#b71920] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700">
          Visit frequently asked questions
        </Link>
      </p>
    </AppPageShell>
  );
}
