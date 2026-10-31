"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import {
  ArrowRight,
  Sparkles,
  BookOpen,
  Users,
  Shield,
  Clock,
  Award,
  CheckCircle2,
  Compass,
  MessageCircle,
  BriefcaseBusiness,
  HeartHandshake,
  ChevronDown,
} from "lucide-react";

const features = [
  {
    icon: Compass,
    title: "Discover locally",
    text: "Find people and skills that are relevant to where you are and what you want to learn.",
  },
  {
    icon: Sparkles,
    title: "Smart matching",
    text: "Use skill compatibility and shared interests to find people who complement your learning goals.",
  },
  {
    icon: MessageCircle,
    title: "Keep it practical",
    text: "Move from discovering a person to a real conversation and a scheduled learning session.",
  },
  {
    icon: Shield,
    title: "Build trust",
    text: "Profiles, reviews and verification give you more context before starting an exchange.",
  },
];

const exchangeTypes = [
  {
    icon: BookOpen,
    title: "Learn a skill",
    text: "Pick up practical skills from someone who already uses them.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Share your expertise",
    text: "Turn what you know into useful value for another member.",
  },
  {
    icon: HeartHandshake,
    title: "Grow your network",
    text: "Meet people around shared interests, projects and goals.",
  },
];

const faqs = [
  {
    question: "Do I need to pay to start?",
    answer:
      "No. SkillBarter is designed around skill-for-skill exchanges, so you can create a profile and start exploring without making money the starting point.",
  },
  {
    question: "What can I exchange?",
    answer:
      "Anything practical that another member can learn from you: coding, design, languages, fitness, communication, music, career skills and many other areas.",
  },
  {
    question: "How do I choose someone to exchange with?",
    answer:
      "Review their profile, skills, location and available trust signals, then start a conversation before proposing an exchange.",
  },
  {
    question: "Can I use SkillBarter for professional growth?",
    answer:
      "Yes. You can use exchanges for portfolio feedback, interview preparation, project guidance, tools, creative skills and peer learning.",
  },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col">
      {/* Hero section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-red-50/60 via-white to-[#f7f7f5] py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#b71c1c] shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Peer-to-peer skill exchange
              </div>
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-[#17233b] sm:text-5xl lg:text-6xl">
                Teach what you know. <br />
                <span className="text-[#d31d24]">Learn what you love.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                Exchange knowledge directly with real people. No currency, no subscriptions—just
                fair, reciprocal skill swaps between developers, designers, writers, and learners.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                {user ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#d31d24] px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#b71c1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
                  >
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#d31d24] px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#b71c1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
                    >
                      Join Community
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/discover"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition-colors hover:bg-[#f7f7f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
                    >
                      Browse Available Skills
                    </Link>
                  </>
                )}
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-500" />
                  Free peer-to-peer exchange
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-500" />
                  Reciprocal learning
                </span>
              </div>
            </div>

            <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#d31d24]">
                  Example skill exchange
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Two-way learning
                </span>
              </div>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-[#f7f7f5] p-4">
                  <p className="text-xs font-semibold text-slate-500">YOU TEACH</p>
                  <p className="mt-1 text-base font-bold text-[#17233b]">Web Development</p>
                  <p className="text-sm text-slate-600">Share your projects and practical experience.</p>
                </div>
                <div className="flex justify-center">
                  <span className="rounded-full bg-[#d31d24] p-2 text-white shadow-md">
                    <ArrowRight aria-hidden="true" className="h-4 w-4 rotate-90 sm:rotate-0" />
                  </span>
                </div>
                <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4">
                  <p className="text-xs font-semibold text-[#d31d24]">YOU LEARN</p>
                  <p className="mt-1 text-base font-bold text-[#17233b]">UI/UX Design</p>
                  <p className="text-sm text-slate-600">Learn design principles from another member.</p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <span>Learn together</span>
                <span>Build skills through practice</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-slate-100 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#d31d24]">Simple 4-step cycle</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-[#17233b] sm:text-4xl">
              How SkillBarter Works
            </p>
            <p className="mt-4 text-base text-slate-600">
              A collaborative model where both participants benefit equally from exchanging time and knowledge.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: BookOpen,
                step: "1. Create Profile",
                desc: "List skills you can confidently teach and skills you are eager to learn.",
              },
              {
                icon: Users,
                step: "2. Discover Matches",
                desc: "Find peers whose skills and learning goals complement yours.",
              },
              {
                icon: Clock,
                step: "3. Schedule Sessions",
                desc: "Agree on a convenient time and a clear learning goal for your session.",
              },
              {
                icon: Award,
                step: "4. Exchange & Review",
                desc: "Complete your exchange and leave an honest review of the experience.",
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.step}
                  className="rounded-2xl border border-slate-200 bg-[#f7f7f5]/50 p-6 transition-all hover:bg-white hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d31d24] text-white">
                    <Icon aria-hidden="true" className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-[#17233b]">{card.step}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features from the established legacy landing page */}
      <section className="border-t border-slate-200 bg-[#f7f7f5] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#d31d24]">Made for peer learning</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#17233b] sm:text-4xl">
              Learn more by learning together
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#b71c1c]">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-[#17233b]">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Ways to participate */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#d31d24]">Your skills have value</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#17233b] sm:text-4xl">
              More than just learning
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {exchangeTypes.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-7 transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-[#b71c1c]">
                    <Icon aria-hidden="true" className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-[#17233b]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="border-t border-slate-200 bg-[#f7f7f5] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-red-100 p-3 text-[#b71c1c]">
                <Shield aria-hidden="true" className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#17233b]">Safety & Moderation</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Reporting, blocking and moderation tools help members keep exchanges respectful.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                <Award aria-hidden="true" className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#17233b]">Reputation & Reviews</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Exchange feedback helps members make more informed decisions about learning partners.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
                <Users aria-hidden="true" className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#17233b]">Community Connections</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Meet peers, exchange ideas and build connections around shared interests.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs retained from the legacy landing page */}
      <section className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#d31d24]">FAQs</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#17233b] sm:text-4xl">
              Questions, answered
            </h2>
          </div>
          <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-semibold text-[#17233b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2">
                  {faq.question}
                  <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 pr-8 text-sm leading-6 text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href={user ? "/discover" : "/register"}
              className="inline-flex items-center gap-2 rounded-xl bg-[#d31d24] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#b71c1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
            >
              {user ? "Find a learning partner" : "Start exchanging skills"}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
