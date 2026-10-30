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
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col">
      {/* Hero section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/60 via-white to-slate-50 py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                SkillBarter-Next Peer-to-Peer Exchange
              </div>
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Teach what you know. <br />
                <span className="text-indigo-600">Learn what you love.</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600 max-w-xl">
                Exchange knowledge directly with real people. No currency, no subscriptions—just
                fair, reciprocal skill swaps between developers, designers, writers, and learners.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                {user ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all"
                  >
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all"
                    >
                      Join Community
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/discover"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      Browse Available Skills
                    </Link>
                  </>
                )}
              </div>
              <div className="mt-10 flex items-center gap-6 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Free peer-to-peer exchange
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Verified reciprocal matching
                </span>
              </div>
            </div>

            {/* Visual Card preview */}
            <div className="relative rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Live Match Preview
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  95% Reciprocal Match
                </span>
              </div>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500">YOU TEACH</p>
                  <p className="mt-1 text-base font-bold text-slate-900">TypeScript & Next.js App Router</p>
                  <p className="text-xs text-slate-600">Advanced full-stack React architecture</p>
                </div>
                <div className="flex justify-center">
                  <span className="rounded-full bg-indigo-600 p-2 text-white shadow-md">
                    <ArrowRight className="h-4 w-4 rotate-90 sm:rotate-0" />
                  </span>
                </div>
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <p className="text-xs font-semibold text-indigo-600">THEY TEACH YOU</p>
                  <p className="mt-1 text-base font-bold text-slate-900">Python Data Science & Pandas</p>
                  <p className="text-xs text-slate-600">Data analysis, visualization, and ML workflows</p>
                </div>
              </div>
              <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-500">
                <span>Verified participants</span>
                <span>Structured sessions & reviews</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600">Simple 4-Step Cycle</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
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
                desc: "Our matching engine pairs you with peers whose learning goals complement yours.",
              },
              {
                icon: Clock,
                step: "3. Schedule Sessions",
                desc: "Propose convenient session dates, video links, and collaborative lesson agendas.",
              },
              {
                icon: Award,
                step: "4. Exchange & Review",
                desc: "Complete your exchange, confirm mutual participation, and leave honest reputation reviews.",
              },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.step}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 transition-all hover:bg-white hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-900">{card.step}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust & Safety highlights */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="flex gap-4 items-start">
              <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Safety & Moderation</h4>
                <p className="mt-1 text-sm text-slate-600">
                  Built-in blocking, moderation reporting, and admin oversight keep exchanges safe and respectful.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Reputation Verification</h4>
                <p className="mt-1 text-sm text-slate-600">
                  Reviews are strictly limited to completed exchanges between genuine participants.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Community Connections</h4>
                <p className="mt-1 text-sm text-slate-600">
                  Stay connected with peers, exchange tips, and join discussions on our community board.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
