"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { AppPageShell } from "../../components/ui/AppPageShell";
import { api } from "../../services/api";
import { skillCategories, UserSkillDto } from "@skillbarter/shared";
import {
  Compass,
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  User,
  CheckCircle2,
  X,
  Send,
  AlertCircle,
} from "lucide-react";

export default function DiscoverPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [format, setFormat] = useState("");
  const [mySkills, setMySkills] = useState<UserSkillDto[]>([]);
  const matchesRequestId = useRef(0);
  const proposalSubmitLock = useRef(false);

  // Exchange proposal modal state
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [offeredSkillId, setOfferedSkillId] = useState("");
  const [wantedSkillId, setWantedSkillId] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [proposalSuccess, setProposalSuccess] = useState<string | null>(null);

  const fetchMatches = async () => {
    const requestId = ++matchesRequestId.current;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api.matches.discover(category, search, format);
      if (requestId === matchesRequestId.current) setMatches(data);
    } catch (err: unknown) {
      if (requestId === matchesRequestId.current) {
        setMatches([]);
        setLoadError(err instanceof Error ? err.message : "We couldn't load matches. Please try again.");
      }
    } finally {
      if (requestId === matchesRequestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchMatches();
    }, search.trim() ? 300 : 0);
    return () => {
      window.clearTimeout(timer);
      // Invalidate an in-flight request as soon as the filters or user change.
      matchesRequestId.current += 1;
    };
  }, [category, format, search, user]);

  useEffect(() => {
    if (!user) {
      setMySkills([]);
      return;
    }
    let active = true;
    api.skills.mySkills()
      .then((res) => {
        if (active) setMySkills(res.skills);
      })
      .catch(() => {
        if (active) setMySkills([]);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const handleOpenProposal = (match: any) => {
    setSelectedMatch(match);
    setProposalError(null);
    setProposalSuccess(null);

    // Auto-select skills if reciprocal
    if (match.theyTeachYouLearn?.length > 0) {
      setWantedSkillId(match.theyTeachYouLearn[0].skillId);
    }
    const myOffered = mySkills.filter((s) => s.type === "offered");
    if (match.youTeachTheyLearn?.length > 0) {
      const matchOffered = myOffered.find((s) => s.skillId === match.youTeachTheyLearn[0].skillId);
      if (matchOffered) setOfferedSkillId(matchOffered.skillId);
      else if (myOffered.length > 0) setOfferedSkillId(myOffered[0]!.skillId);
    } else if (myOffered.length > 0) {
      setOfferedSkillId(myOffered[0]!.skillId);
    }

    setProposalDescription(
      `Hi ${match.user.displayName}! I would love to exchange skills with you.`
    );
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch || proposalSubmitLock.current) return;
    proposalSubmitLock.current = true;
    setProposalError(null);
    setSubmittingProposal(true);

    try {
      await api.exchanges.create({
        recipientId: selectedMatch.user.id,
        offeredSkillId,
        wantedSkillId,
        proposalDescription,
      });
      setProposalSuccess("Skill exchange proposal sent successfully!");
      setTimeout(() => {
        setSelectedMatch(null);
        setProposalSuccess(null);
      }, 1500);
    } catch (err: unknown) {
      setProposalError(err instanceof Error ? err.message : "Failed to send proposal");
    } finally {
      proposalSubmitLock.current = false;
      setSubmittingProposal(false);
    }
  };

  const myOfferedSkills = mySkills.filter((s) => s.type === "offered");

  return (
    <AppPageShell eyebrow="Match Engine" title="Discover Complementary Skill Matches" description="Matches are sorted by reciprocal compatibility between what you can teach and what you want to learn." icon={<Compass className="h-3.5 w-3.5" />}>
      <div className="space-y-8">

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-5 relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            aria-label="Search by skill or member name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchMatches()}
            placeholder="Search by skill or member name..."
            className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-red-600 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            aria-label="Filter by skill category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm bg-white focus:border-red-600 focus:outline-none"
          >
            <option value="">All Categories</option>
            {skillCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            aria-label="Filter by exchange format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm bg-white focus:border-red-600 focus:outline-none"
          >
            <option value="">Any Format</option>
            <option value="video">Video Call</option>
            <option value="chat">Chat</option>
            <option value="in_person">In Person</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={fetchMatches}
            className="w-full rounded-xl bg-red-700 py-2 text-sm font-semibold text-white hover:bg-red-600 shadow-sm"
          >
            Search
          </button>
        </div>
      </div>

      {/* Match Cards Grid */}
      {loading ? (
        <div role="status" aria-live="polite" className="p-12 text-center text-sm font-medium text-slate-500">
          Finding optimal skill matches...
        </div>
      ) : loadError ? (
        <div role="alert" className="rounded-3xl border border-red-200 bg-white p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-3" />
          <h3 className="text-base font-bold text-slate-900">We couldn't load skill matches</h3>
          <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto">
            The service may be temporarily unavailable. Your filters are preserved; try again in a moment.
          </p>
          <button type="button" onClick={fetchMatches} className="mt-4 rounded-xl bg-red-700 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700">
            Try again
          </button>
        </div>
      ) : matches.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Compass className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-900">No members matched your query</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Try broadening your search or adjusting your categories to find more potential exchange partners.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => (
            <div
              key={match.user.id}
              className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-red-200 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/profile/${match.user.id}`} className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 font-bold text-red-700 text-sm">
                      {match.user.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 hover:text-red-700 transition-colors">
                        {match.user.displayName}
                      </h3>
                      <p className="text-xs text-slate-500">★ {match.user.reputationScore.toFixed(1)} rating</p>
                    </div>
                  </Link>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      match.compatibilityScore >= 80
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    <Sparkles className="h-3 w-3" /> {match.compatibilityScore}%
                  </span>
                </div>

                <p className="mt-4 text-xs leading-5 text-slate-600 line-clamp-2">
                  {match.user.bio || "Member ready to share and learn skills."}
                </p>

                {/* Compatibility explanation */}
                <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-700 border border-slate-100">
                  <p className="font-semibold text-slate-900 mb-1">Compatibility:</p>
                  <p>{match.explanation}</p>
                </div>

                {/* Skills Preview */}
                <div className="mt-4 space-y-2 text-xs">
                  {match.theyTeachYouLearn?.length > 0 && (
                    <div>
                      <span className="font-semibold text-emerald-700">Can teach you: </span>
                      <span className="text-slate-800">
                        {match.theyTeachYouLearn.map((s: any) => s.name).join(", ")}
                      </span>
                    </div>
                  )}
                  {match.youTeachTheyLearn?.length > 0 && (
                    <div>
                      <span className="font-semibold text-red-700">Wants from you: </span>
                      <span className="text-slate-800">
                        {match.youTeachTheyLearn.map((s: any) => s.name).join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                <Link
                  href={`/profile/${match.user.id}`}
                  className="flex-1 rounded-xl border border-slate-300 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View Profile
                </Link>
                {user && user.id !== match.user.id && (
                  <button
                    type="button"
                    onClick={() => handleOpenProposal(match)}
                    className="flex-1 rounded-xl bg-red-700 py-2 text-center text-xs font-semibold text-white hover:bg-red-600 shadow-sm"
                  >
                    Request Exchange
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exchange Proposal Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="proposal-title" className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setSelectedMatch(null)}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                New Exchange Proposal
              </span>
              <h3 id="proposal-title" className="mt-1 text-2xl font-bold text-slate-900">
                Exchange with {selectedMatch.user.displayName}
              </h3>
            </div>

            {proposalError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{proposalError}</p>
              </div>
            )}

            {proposalSuccess ? (
              <div className="rounded-2xl bg-emerald-50 p-6 text-center space-y-2 border border-emerald-200">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
                <p className="text-sm font-bold text-emerald-900">{proposalSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitProposal} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Skill You Offer to Teach
                  </label>
                  {myOfferedSkills.length === 0 ? (
                    <div className="text-xs text-rose-600">
                      You haven&apos;t added any offered skills yet. Please visit{" "}
                      <Link href="/skills" className="underline font-bold">My Skills</Link> first.
                    </div>
                  ) : (
                    <select
                      value={offeredSkillId}
                      onChange={(e) => setOfferedSkillId(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm bg-white"
                    >
                      {myOfferedSkills.map((s) => (
                        <option key={s.skillId} value={s.skillId}>
                          {s.name} ({s.proficiency})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Skill You Want from {selectedMatch.user.displayName}
                  </label>
                  <select
                    value={wantedSkillId}
                    onChange={(e) => setWantedSkillId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm bg-white"
                  >
                    {selectedMatch.theyTeachYouLearn?.map((s: any) => (
                      <option key={s.skillId} value={s.skillId}>
                        {s.name} ({s.proficiency})
                      </option>
                    ))}
                    {/* Fallback option if no explicit match */}
                    {(!selectedMatch.theyTeachYouLearn || selectedMatch.theyTeachYouLearn.length === 0) && (
                      <option value={wantedSkillId || "default"}>General Skill Session</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Proposal Message & Availability
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={proposalDescription}
                    onChange={(e) => setProposalDescription(e.target.value)}
                    placeholder="Describe what you would like to learn and teach, and your general availability..."
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedMatch(null)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProposal || myOfferedSkills.length === 0}
                    className="flex items-center gap-2 rounded-xl bg-red-700 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {submittingProposal ? "Sending..." : "Send Proposal"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      </div>
    </AppPageShell>
  );
}
