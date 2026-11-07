"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppPageShell } from "../../components/ui/AppPageShell";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Repeat,
  Sparkles,
  Users,
  X,
} from "lucide-react";

type MatchSkill = {
  skillId: string;
  name: string;
  proficiency: string;
};

type MatchResult = {
  user: {
    id: string;
    displayName: string;
    bio: string;
    avatarUrl: string;
    location: string;
    preferredSessionFormat: string;
    availability: string;
    reputationScore: number;
    completedExchangesCount: number;
  };
  compatibilityScore: number;
  explanation: string;
  reciprocalMatch: boolean;
  theyTeachYouLearn: MatchSkill[];
  youTeachTheyLearn: MatchSkill[];
};

export default function MatchesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [offeredSkillId, setOfferedSkillId] = useState("");
  const [wantedSkillId, setWantedSkillId] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const proposalSubmitLock = useRef(false);

  const loadMatches = useCallback(async () => {
    if (!user?.id || !user.isEmailVerified) {
      setMatches([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await api.matches.recommendations();
      setMatches(result as MatchResult[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to load your personalized matches.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.isEmailVerified]);

  useEffect(() => {
    if (!authLoading) void loadMatches();
  }, [authLoading, loadMatches]);

  const reciprocalMatches = matches.filter((match) => match.reciprocalMatch);
  const potentialMatches = matches.filter((match) => !match.reciprocalMatch);

  function openProposal(match: MatchResult) {
    setSelectedMatch(match);
    setOfferedSkillId(match.youTeachTheyLearn[0]?.skillId ?? "");
    setWantedSkillId(match.theyTeachYouLearn[0]?.skillId ?? "");
    setProposalDescription(
      `Hi ${match.user.displayName}, I would love to exchange skills with you.`
    );
    setProposalError(null);
  }

  async function submitProposal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !selectedMatch ||
      !offeredSkillId ||
      !wantedSkillId ||
      proposalSubmitLock.current
    ) {
      return;
    }

    proposalSubmitLock.current = true;
    setSubmitting(true);
    setProposalError(null);
    try {
      await api.exchanges.create({
        recipientId: selectedMatch.user.id,
        offeredSkillId,
        wantedSkillId,
        proposalDescription: proposalDescription.trim(),
      });
      setSelectedMatch(null);
      router.push("/exchanges");
    } catch (err: unknown) {
      setProposalError(err instanceof Error ? err.message : "Unable to send the exchange request.");
    } finally {
      proposalSubmitLock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <AppPageShell
      eyebrow="Personalized matching"
      title="Your skill matches"
      description="See members whose learning goals complement the skills you can teach, with reciprocal matches highlighted first."
      icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
      actions={
        <Link
          href="/discover"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
        >
          Explore Discover <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      }
    >
      {authLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600" role="status">
          Checking your account…
        </div>
      ) : !user ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center sm:p-12">
          <Users className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-slate-900">Sign in to see your matches</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Personalized recommendations use the skills in your member profile.
          </p>
          <Link href="/login" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-red-700 px-5 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">
            Sign in
          </Link>
        </section>
      ) : !user.isEmailVerified ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8" role="status">
          <h2 className="font-bold text-amber-950">Verify your email to unlock personalized matching</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            You can finish setting up your profile first. Matching and exchange requests become available after email verification.
          </p>
          <Link
            href={user.onboardingCompleted ? `/verify-email?email=${encodeURIComponent(user.email)}` : "/onboarding"}
            className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-900 focus-visible:ring-offset-2"
          >
            {user.onboardingCompleted ? "Verify email" : "Complete onboarding"}
          </Link>
        </section>
      ) : loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600" role="status" aria-live="polite">
          Finding peers whose skills complement yours…
        </div>
      ) : error ? (
        <section className="rounded-2xl border border-red-200 bg-white p-6 sm:p-8" role="alert">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden="true" />
            <div>
              <h2 className="font-bold text-slate-900">Your matches could not be loaded</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{error}</p>
              <button type="button" onClick={() => void loadMatches()} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">
                <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
              </button>
            </div>
          </div>
        </section>
      ) : reciprocalMatches.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12">
          <Users className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-slate-900">No reciprocal matches yet</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
            {potentialMatches.length
              ? "We found members with related interests, but there is not yet a two-way skill fit. Add or refine your offered and wanted skills to improve your options."
              : "As more verified members add the skills they can teach and want to learn, reciprocal matches will appear here."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/skills" className="inline-flex min-h-11 items-center rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">
              Update my skills
            </Link>
            <Link href="/discover" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">
              Browse Discover
            </Link>
          </div>
        </section>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{reciprocalMatches.length}</span> reciprocal match{reciprocalMatches.length === 1 ? "" : "es"}
            </p>
            <button type="button" onClick={() => void loadMatches()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Refresh
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reciprocalMatches.map((match) => (
              <article key={match.user.id} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-sm font-bold text-red-800" aria-hidden="true">
                    {match.user.displayName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/profile/${match.user.id}`} className="break-words font-bold text-slate-900 underline-offset-2 hover:text-red-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700">
                      {match.user.displayName}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {match.user.location || "Location not shared"} · {match.user.reputationScore.toFixed(1)} reputation
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800">
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Reciprocal
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{match.explanation}</p>
                <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">They can teach you</p>
                    <ul className="mt-2 space-y-1">
                      {match.theyTeachYouLearn.map((skill) => (
                        <li key={skill.skillId} className="break-words text-xs font-semibold text-slate-900">{skill.name}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">You can teach them</p>
                    <ul className="mt-2 space-y-1">
                      {match.youTeachTheyLearn.map((skill) => (
                        <li key={skill.skillId} className="break-words text-xs font-semibold text-slate-900">{skill.name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  <Link href={`/profile/${match.user.id}`} className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">
                    View profile
                  </Link>
                  <button type="button" onClick={() => openProposal(match)} className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-lg bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">
                    <Repeat className="h-3.5 w-3.5" aria-hidden="true" /> Propose exchange
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedMatch(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="match-proposal-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-red-700">New exchange request</p>
                <h2 id="match-proposal-title" className="mt-1 text-xl font-bold text-slate-900">Exchange with {selectedMatch.user.displayName}</h2>
              </div>
              <button type="button" onClick={() => setSelectedMatch(null)} aria-label="Close proposal" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={submitProposal} className="mt-5 space-y-4">
              <div>
                <label htmlFor="offered-skill" className="block text-sm font-semibold text-slate-800">Skill you will teach</label>
                <select id="offered-skill" required value={offeredSkillId} onChange={(event) => setOfferedSkillId(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-100">
                  {selectedMatch.youTeachTheyLearn.map((skill) => <option key={skill.skillId} value={skill.skillId}>{skill.name} · {skill.proficiency}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="wanted-skill" className="block text-sm font-semibold text-slate-800">Skill you want to learn</label>
                <select id="wanted-skill" required value={wantedSkillId} onChange={(event) => setWantedSkillId(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-100">
                  {selectedMatch.theyTeachYouLearn.map((skill) => <option key={skill.skillId} value={skill.skillId}>{skill.name} · {skill.proficiency}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="proposal-description" className="block text-sm font-semibold text-slate-800">Message</label>
                <textarea id="proposal-description" required maxLength={1000} rows={4} value={proposalDescription} onChange={(event) => setProposalDescription(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-100" />
              </div>
              {proposalError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{proposalError}</p>}
              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setSelectedMatch(null)} className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">Cancel</button>
                <button type="submit" disabled={submitting || !proposalDescription.trim()} className="min-h-11 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  {submitting ? "Sending…" : "Send request"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </AppPageShell>
  );
}
