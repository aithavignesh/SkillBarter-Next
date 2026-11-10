"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  MapPin,
  Repeat,
  Sparkles,
  Video,
} from "lucide-react";
import { AppPageShell } from "../../../components/ui/AppPageShell";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../services/api";
import type { MatchResultDto } from "../../../types/matches";

export default function MatchDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const memberId = params.id;

  const [match, setMatch] = useState<MatchResultDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProposal, setShowProposal] = useState(false);
  const [offeredSkillId, setOfferedSkillId] = useState("");
  const [wantedSkillId, setWantedSkillId] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);

  const loadMatch = useCallback(async () => {
    if (!user?.id || !user.onboardingCompleted || !user.isEmailVerified) {
      setMatch(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await api.matches.getDetails(memberId);
      setMatch(result.match);
      setOfferedSkillId(result.match.youTeachTheyLearn[0]?.skillId ?? "");
      setWantedSkillId(result.match.theyTeachYouLearn[0]?.skillId ?? "");
      setProposalDescription(`Hi ${result.match.user.displayName}, I would love to exchange skills with you.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to load this match.");
    } finally {
      setLoading(false);
    }
  }, [memberId, user?.id, user?.onboardingCompleted, user?.isEmailVerified]);

  useEffect(() => {
    if (!authLoading) void loadMatch();
  }, [authLoading, loadMatch]);

  const canPropose = Boolean(
    match && match.youTeachTheyLearn.length > 0 && match.theyTeachYouLearn.length > 0,
  );

  async function submitProposal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!match || !offeredSkillId || !wantedSkillId || submitting) return;

    setSubmitting(true);
    setProposalError(null);
    try {
      await api.exchanges.create({
        recipientId: match.user.id,
        offeredSkillId,
        wantedSkillId,
        proposalDescription: proposalDescription.trim(),
      });
      router.push("/exchanges");
    } catch (err: unknown) {
      setProposalError(err instanceof Error ? err.message : "Unable to send the exchange request.");
    } finally {
      setSubmitting(false);
    }
  }

  const gate = !user
    ? { title: "Sign in to view match details", description: "Personalized match details are available to signed-in members.", href: "/login", label: "Sign in" }
    : !user.onboardingCompleted
      ? { title: "Complete your onboarding", description: "Finish setting up your member profile before viewing personalized matches.", href: "/onboarding", label: "Complete onboarding" }
      : !user.isEmailVerified
        ? { title: "Verify your email to unlock matching", description: "Match details and exchange requests become available after email verification.", href: `/verify-email?email=${encodeURIComponent(user.email)}`, label: "Verify email" }
        : null;

  return (
    <AppPageShell
      eyebrow="Personalized matching"
      title="Match details"
      description="Review the skills, availability, and compatibility behind this recommendation."
      icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
      actions={
        <Link href="/matches" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to matches
        </Link>
      }
    >
      {authLoading ? (
        <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Checking your account…</div>
      ) : gate ? (
        <section role="status" className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
          <h2 className="font-bold text-amber-950">{gate.title}</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">{gate.description}</p>
          <Link href={gate.href} className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-900 focus-visible:ring-offset-2">
            {gate.label}
          </Link>
        </section>
      ) : loading ? (
        <div role="status" aria-live="polite" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Loading match details…</div>
      ) : error || !match ? (
        <section role="alert" className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-white p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" aria-hidden="true" />
            <div>
              <h2 className="font-bold text-slate-900">Match details unavailable</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{error || "This member is not currently available as a match."}</p>
              <Link href="/matches" className="mt-4 inline-flex text-sm font-semibold text-red-700 underline underline-offset-4">Return to matches</Link>
            </div>
          </div>
        </section>
      ) : (
        <div className="mx-auto w-full max-w-5xl space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-2xl font-bold text-red-800" aria-hidden="true">
                {match.user.displayName.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold text-slate-950">{match.user.displayName}</h2>
                  {match.reciprocalMatch && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Reciprocal match
                    </span>
                  )}
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{match.user.bio || "This member is ready to share skills and learn with the community."}</p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{match.user.location || "Location not shared"}</span>
                  <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />{match.user.availability || "Availability not shared"}</span>
                  <span className="inline-flex items-center gap-1.5"><Video className="h-3.5 w-3.5" aria-hidden="true" />{match.user.preferredSessionFormat || "Format flexible"}</span>
                </div>
                <Link href={`/profile/${match.user.id}`} className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-red-700 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700">
                  View full profile
                </Link>
              </div>
              <div className="flex shrink-0 flex-col items-start rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:items-center">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Compatibility</span>
                <strong className="mt-1 text-3xl tabular-nums text-slate-950">{match.compatibilityScore}%</strong>
                <span className="mt-1 text-xs text-slate-600">Match score</span>
              </div>
            </div>
            <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{match.explanation}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Reputation</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{match.user.reputationScore.toFixed(1)} / 5</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Completed exchanges</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{match.user.completedExchangesCount}</p>
              </div>
            </div>
          </section>

          <div className="grid gap-5 md:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                <h3 className="font-bold text-slate-900">They can teach you</h3>
              </div>
              {match.theyTeachYouLearn.length ? (
                <ul className="mt-4 space-y-2">
                  {match.theyTeachYouLearn.map((skill) => (
                    <li key={skill.skillId} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <span className="font-semibold text-slate-900">{skill.name}</span>
                      <span className="shrink-0 text-xs text-slate-600">{skill.proficiency}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-600">No direct learning overlap was found yet.</p>
              )}
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-red-700" aria-hidden="true" />
                <h3 className="font-bold text-slate-900">You can teach them</h3>
              </div>
              {match.youTeachTheyLearn.length ? (
                <ul className="mt-4 space-y-2">
                  {match.youTeachTheyLearn.map((skill) => (
                    <li key={skill.skillId} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <span className="font-semibold text-slate-900">{skill.name}</span>
                      <span className="shrink-0 text-xs text-slate-600">{skill.proficiency}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-600">Add more offered skills to find a reciprocal exchange.</p>
              )}
            </section>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900">Start a skill exchange</h3>
                <p className="mt-1 text-sm text-slate-600">Choose what you can teach and what you would like to learn.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowProposal((value) => !value)}
                disabled={!canPropose}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Repeat className="h-4 w-4" aria-hidden="true" /> {showProposal ? "Close request form" : "Propose exchange"}
              </button>
            </div>

            {!canPropose && (
              <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                A request needs at least one skill you can teach and one skill this member can teach. Update your skills or explore other matches.
              </p>
            )}

            {showProposal && canPropose && (
              <form onSubmit={submitProposal} className="mt-5 grid gap-4 border-t border-slate-100 pt-5">
                {proposalError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{proposalError}</p>}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="match-offered-skill" className="mb-1 block text-sm font-semibold text-slate-700">Skill you will teach</label>
                    <select id="match-offered-skill" value={offeredSkillId} onChange={(event) => setOfferedSkillId(event.target.value)} required className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900">
                      {match.youTeachTheyLearn.map((skill) => <option key={skill.skillId} value={skill.skillId}>{skill.name} · {skill.proficiency}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="match-wanted-skill" className="mb-1 block text-sm font-semibold text-slate-700">Skill you want to learn</label>
                    <select id="match-wanted-skill" value={wantedSkillId} onChange={(event) => setWantedSkillId(event.target.value)} required className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900">
                      {match.theyTeachYouLearn.map((skill) => <option key={skill.skillId} value={skill.skillId}>{skill.name} · {skill.proficiency}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="match-proposal-description" className="mb-1 block text-sm font-semibold text-slate-700">Message to {match.user.displayName}</label>
                  <textarea id="match-proposal-description" required maxLength={1000} rows={4} value={proposalDescription} onChange={(event) => setProposalDescription(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" />
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={submitting || !offeredSkillId || !wantedSkillId || !proposalDescription.trim()} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-700 px-5 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 disabled:opacity-50">
                    {submitting ? "Sending request…" : "Send exchange request"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </AppPageShell>
  );
}
