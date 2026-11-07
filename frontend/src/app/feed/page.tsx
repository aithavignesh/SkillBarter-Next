"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AppPageShell } from "../../components/ui/AppPageShell";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import type { CommunityPostDto, UserSkillDto } from "@skillbarter/shared";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Heart,
  MapPin,
  RefreshCw,
  Repeat,
  Send,
  Sparkles,
  Users,
} from "lucide-react";

type FeedFilter = "ALL" | "OFFER" | "REQUEST";

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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<CommunityPostDto[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [skills, setSkills] = useState<UserSkillDto[]>([]);
  const [filter, setFilter] = useState<FeedFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postType, setPostType] = useState<"OFFER" | "REQUEST">("OFFER");
  const [postSkill, setPostSkill] = useState("");
  const [posting, setPosting] = useState(false);
  const [likingIds, setLikingIds] = useState<string[]>([]);
  const postLock = useRef(false);

  const loadData = useCallback(async () => {
    if (!user?.id || !user.isEmailVerified) {
      setPosts([]);
      setMatches([]);
      setSkills([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setMatchError(null);
    const [postsResult, matchesResult, skillsResult] = await Promise.allSettled([
      api.community.listPosts(1),
      api.matches.recommendations(),
      api.skills.mySkills(),
    ]);

    if (postsResult.status === "fulfilled") {
      setPosts(postsResult.value);
    } else {
      setPosts([]);
      setError(postsResult.reason instanceof Error ? postsResult.reason.message : "Your feed could not be loaded.");
    }

    if (matchesResult.status === "fulfilled") {
      setMatches(matchesResult.value as MatchResult[]);
    } else {
      setMatches([]);
      setMatchError(matchesResult.reason instanceof Error ? matchesResult.reason.message : "Matches are temporarily unavailable.");
    }

    if (skillsResult.status === "fulfilled") {
      setSkills(skillsResult.value.skills);
    } else {
      setSkills([]);
    }
    setLoading(false);
  }, [user?.id, user?.isEmailVerified]);

  useEffect(() => {
    if (!authLoading) void loadData();
  }, [authLoading, loadData]);

  const visiblePosts = useMemo(() => {
    if (filter === "ALL") return posts;
    const tag = filter.toLowerCase();
    return posts.filter((post) => post.tags.some((item) => item.toLowerCase() === tag));
  }, [filter, posts]);

  const offeredSkills = skills.filter((skill) => skill.type === "offered");
  const wantedSkills = skills.filter((skill) => skill.type === "wanted");
  const topMatches = matches.slice(0, 3);

  async function handleCreatePost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !postTitle.trim() || !postContent.trim() || postLock.current) return;

    postLock.current = true;
    setPosting(true);
    setActionError(null);
    try {
      const tags = [postType.toLowerCase(), postSkill.trim().toLowerCase()]
        .filter(Boolean)
        .slice(0, 5);
      await api.community.createPost({
        title: postTitle.trim(),
        content: postContent.trim(),
        tags,
      });
      setPostTitle("");
      setPostContent("");
      setPostSkill("");
      await loadData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Your post could not be published. Please try again.");
    } finally {
      postLock.current = false;
      setPosting(false);
    }
  }

  async function handleLike(post: CommunityPostDto) {
    if (likingIds.includes(post.id)) return;
    setLikingIds((current) => [...current, post.id]);
    setActionError(null);
    try {
      const result = post.likedByMe
        ? await api.community.unlikePost(post.id)
        : await api.community.likePost(post.id);
      setPosts((current) => current.map((item) => item.id === post.id ? result.post : item));
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "That post could not be updated. Please try again.");
    } finally {
      setLikingIds((current) => current.filter((id) => id !== post.id));
    }
  }

  return (
    <AppPageShell
      eyebrow="Your learning network"
      title="Your SkillBarter feed"
      description="Share what you can teach, ask for help, and discover peers whose skills complement yours."
      icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
      actions={
        <Link
          href="/matches"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
        >
          View matches <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      }
    >
      {authLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600" role="status">
          Checking your account…
        </div>
      ) : !user ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center sm:p-12">
          <Users className="mx-auto h-10 w-10 text-slate-500" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-slate-900">Sign in to open your feed</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Your feed brings together skill offers, learning requests, and personalized peer matches.
          </p>
          <Link href="/login" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-red-700 px-5 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">
            Sign in
          </Link>
        </section>
      ) : !user.onboardingCompleted ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6" role="status">
          <h2 className="font-bold text-amber-950">Complete your learning profile first</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">Add the skills you can teach and want to learn to make your feed useful.</p>
          <Link href="/onboarding" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-900 focus-visible:ring-offset-2">
            Complete onboarding
          </Link>
        </section>
      ) : !user.isEmailVerified ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6" role="status">
          <h2 className="font-bold text-amber-950">Verify your email to use the member feed</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">Your profile is saved. Email verification unlocks posting, liking, and personalized matches.</p>
          <Link href={"/verify-email?email=" + encodeURIComponent(user.email)} className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-900 focus-visible:ring-offset-2">
            Verify email
          </Link>
        </section>
      ) : (
        <>
          <section className="mb-6 overflow-hidden rounded-3xl bg-[#17233b] text-white shadow-sm">
            <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-200">Start your SkillBarter journey</p>
                <h2 className="mt-2 text-2xl font-bold leading-tight">Find your first learning exchange.</h2>
                <p className="mt-2 text-sm leading-6 text-slate-200">Set your skills, find a compatible peer, and start learning together without money changing hands.</p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:min-w-[420px]">
                <Link href="/skills" className="rounded-xl border border-white/20 bg-white/10 p-3 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  <span className="text-xs font-black text-red-200">01</span>
                  <span className="mt-1 block text-xs font-semibold text-white">Set your skills</span>
                </Link>
                <Link href="/matches" className="rounded-xl border border-white/20 bg-white/10 p-3 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  <span className="text-xs font-black text-red-200">02</span>
                  <span className="mt-1 block text-xs font-semibold text-white">Find a partner</span>
                </Link>
                <Link href="/exchanges" className="rounded-xl border border-white/20 bg-white/10 p-3 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  <span className="text-xs font-black text-red-200">03</span>
                  <span className="mt-1 block text-xs font-semibold text-white">Start learning</span>
                </Link>
              </div>
            </div>
          </section>

          <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Your next learning step</p>
              <h2 className="mt-1 text-sm font-bold text-slate-900">Have a skill in mind? Start with one learning partner.</h2>
              <p className="mt-1 text-sm text-slate-700">Check your matches first, then send a short exchange request. Plan a session after they accept.</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link href="/matches" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800 focus-visible:ring-offset-2">
                View matches <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/discover" className="inline-flex min-h-11 items-center rounded-lg border border-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800 focus-visible:ring-offset-2">
                Browse skills
              </Link>
            </div>
          </section>

          {actionError && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              <p>{actionError}</p>
              <button type="button" onClick={() => setActionError(null)} className="rounded-lg px-2 py-1 font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700">
                Dismiss
              </button>
            </div>
          )}

          <div className="grid min-w-0 gap-6 lg:grid-cols-12">
            <aside className="space-y-4 lg:col-span-3">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-700 text-xl font-bold text-white" aria-hidden="true">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="mt-3 text-base font-bold text-slate-900">{user.displayName}</h2>
                  <p className="mt-1 text-xs text-slate-600">Verified member</p>
                  {user.location && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-600">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {user.location}
                    </p>
                  )}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-slate-900">{Number(user.reputationScore || 0).toFixed(1)}</p>
                    <p className="text-xs text-slate-600">Trust score</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">{user.completedExchangesCount || 0}</p>
                    <p className="text-xs text-slate-600">Exchanges</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">You can teach</h3>
                    {offeredSkills.length ? (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {offeredSkills.slice(0, 4).map((skill) => (
                          <li key={skill.id} className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-900">{skill.name}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-xs text-slate-600">No skills added yet.</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">You want to learn</h3>
                    {wantedSkills.length ? (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {wantedSkills.slice(0, 4).map((skill) => (
                          <li key={skill.id} className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-900">{skill.name}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-xs text-slate-600">No learning goals added yet.</p>
                    )}
                  </div>
                </div>
                <Link href={"/profile/" + user.id} className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">
                  View my profile
                </Link>
              </section>
            </aside>

            <section className="min-w-0 space-y-4 lg:col-span-6" aria-label="SkillBarter posts">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-800">
                    <Repeat className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Share a skill or ask for help</h2>
                    <p className="text-xs text-slate-600">Posts are visible to the SkillBarter community.</p>
                  </div>
                </div>
                <form onSubmit={handleCreatePost} className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" aria-pressed={postType === "OFFER"} onClick={() => setPostType("OFFER")} className={"min-h-10 rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800 focus-visible:ring-offset-2 " + (postType === "OFFER" ? "bg-emerald-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}>
                      Offer a skill
                    </button>
                    <button type="button" aria-pressed={postType === "REQUEST"} onClick={() => setPostType("REQUEST")} className={"min-h-10 rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-800 focus-visible:ring-offset-2 " + (postType === "REQUEST" ? "bg-teal-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}>
                      Request help
                    </button>
                  </div>
                  <div>
                    <label htmlFor="feed-post-title" className="mb-1 block text-xs font-semibold text-slate-700">Post title</label>
                    <input id="feed-post-title" required maxLength={150} value={postTitle} onChange={(event) => setPostTitle(event.target.value)} placeholder={postType === "OFFER" ? "What can you teach?" : "What would you like to learn?"} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-red-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-700/20" />
                  </div>
                  <div>
                    <label htmlFor="feed-post-content" className="mb-1 block text-xs font-semibold text-slate-700">Details</label>
                    <textarea id="feed-post-content" required minLength={10} maxLength={5000} rows={3} value={postContent} onChange={(event) => setPostContent(event.target.value)} placeholder="Share what you are learning, building, or ready to teach..." className="w-full resize-y rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-red-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-700/20" />
                  </div>
                  <div>
                    <label htmlFor="feed-post-skill" className="mb-1 block text-xs font-semibold text-slate-700">Skill tag <span className="font-normal text-slate-600">(optional)</span></label>
                    <input id="feed-post-skill" maxLength={30} value={postSkill} onChange={(event) => setPostSkill(event.target.value)} placeholder="e.g. React, Python, UI design" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-red-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-700/20" />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-slate-600">Keep posts specific, respectful, and focused on skills.</p>
                    <button type="submit" disabled={posting || !postTitle.trim() || postContent.trim().length < 10} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
                      {posting ? "Publishing…" : "Publish post"} <Send className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </form>
              </section>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Community feed</h2>
                  <p className="text-xs text-slate-600">Latest skill offers and learning requests.</p>
                </div>
                <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1" aria-label="Filter feed posts">
                  {(["ALL", "OFFER", "REQUEST"] as FeedFilter[]).map((item) => (
                    <button key={item} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)} className={"min-h-9 rounded-lg px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 " + (filter === item ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100")}>
                      {item === "ALL" ? "All posts" : item === "OFFER" ? "Offers" : "Requests"}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600" role="status" aria-live="polite">Loading your feed…</div>
              ) : error ? (
                <section className="rounded-2xl border border-red-200 bg-white p-6" role="alert">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden="true" />
                    <div>
                      <h3 className="font-bold text-slate-900">Your feed could not be loaded</h3>
                      <p className="mt-1 text-sm text-slate-600">{error}</p>
                      <button type="button" onClick={() => void loadData()} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">
                        <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
                      </button>
                    </div>
                  </div>
                </section>
              ) : visiblePosts.length === 0 ? (
                <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                  <BookOpen className="mx-auto h-9 w-9 text-slate-500" aria-hidden="true" />
                  <h3 className="mt-3 text-base font-bold text-slate-900">{filter === "ALL" ? "Your feed is ready for its first post" : "No posts in this filter yet"}</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Share a skill you can teach or a topic you want help with. Your post will appear here.</p>
                </section>
              ) : (
                <div className="space-y-3">
                  {visiblePosts.map((post) => {
                    const type = post.tags.some((tag) => tag.toLowerCase() === "offer") ? "OFFER" : post.tags.some((tag) => tag.toLowerCase() === "request") ? "REQUEST" : "COMMUNITY";
                    return (
                      <article key={post.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-800" aria-hidden="true">
                              {(post.authorName || "S").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <Link href={"/profile/" + post.authorId} className="truncate text-sm font-bold text-slate-900 hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700">{post.authorName || "SkillBarter member"}</Link>
                              <p className="text-xs text-slate-600">{formatDate(post.createdAt)}</p>
                            </div>
                          </div>
                          <span className={"shrink-0 rounded-full px-2.5 py-1 text-xs font-bold " + (type === "OFFER" ? "bg-emerald-100 text-emerald-900" : type === "REQUEST" ? "bg-sky-100 text-sky-900" : "bg-slate-100 text-slate-800")}>
                            {type === "OFFER" ? "Skill offer" : type === "REQUEST" ? "Learning request" : "Community"}
                          </span>
                        </div>
                        <h3 className="mt-4 text-base font-bold text-slate-900">{post.title}</h3>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{post.content}</p>
                        {post.tags.length > 0 && (
                          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Post tags">
                            {post.tags.filter((tag) => tag.toLowerCase() !== "offer" && tag.toLowerCase() !== "request").map((tag) => (
                              <li key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800">#{tag}</li>
                            ))}
                          </ul>
                        )}
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                          <button type="button" disabled={likingIds.includes(post.id)} aria-pressed={post.likedByMe} aria-label={post.likedByMe ? "Unlike this post" : "Like this post"} onClick={() => void handleLike(post)} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
                            <Heart className={"h-4 w-4 " + (post.likedByMe ? "fill-current text-rose-700" : "")} aria-hidden="true" />
                            {post.likesCount} {post.likesCount === 1 ? "like" : "likes"}
                          </button>
                          <Link href="/matches" className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">
                            Find a learning partner <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <aside className="space-y-4 lg:col-span-3">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Your matches</h2>
                    <p className="text-xs text-slate-600">Peers with complementary skills.</p>
                  </div>
                  <Sparkles className="h-5 w-5 text-red-700" aria-hidden="true" />
                </div>
                {matchError ? (
                  <div className="mt-4 rounded-xl bg-amber-50 p-3" role="status">
                    <p className="text-xs text-amber-950">{matchError}</p>
                    <button type="button" onClick={() => void loadData()} className="mt-2 text-xs font-bold text-amber-950 underline">Retry</button>
                  </div>
                ) : topMatches.length === 0 ? (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4 text-center">
                    <Users className="mx-auto h-7 w-7 text-slate-500" aria-hidden="true" />
                    <p className="mt-2 text-sm font-semibold text-slate-900">No matches yet</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Add offered and wanted skills to improve your recommendations.</p>
                    <Link href="/skills" className="mt-3 inline-flex min-h-9 items-center rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">Update skills</Link>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {topMatches.map((match) => (
                      <article key={match.user.id} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={"/profile/" + match.user.id} className="text-sm font-bold text-slate-900 hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700">{match.user.displayName}</Link>
                          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900">{Math.round(match.compatibilityScore)}% fit</span>
                        </div>
                        {match.reciprocalMatch && <p className="mt-1 text-xs font-semibold text-emerald-800">Two-way skill fit</p>}
                        <p className="mt-2 text-xs leading-5 text-slate-600">{match.explanation}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Link href={"/profile/" + match.user.id} className="text-xs font-semibold text-slate-700 underline underline-offset-2">View profile</Link>
                          <Link href="/matches" className="text-xs font-semibold text-red-800 underline underline-offset-2">Send request</Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
                <Link href="/matches" className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">
                  All matches <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </section>
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900">Build a stronger profile</h2>
                <p className="mt-2 text-xs leading-5 text-slate-600">Clear skill descriptions and reliable exchange history help members choose a learning partner.</p>
                <Link href="/skills" className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-red-800 hover:text-red-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700">
                  Manage skills <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </section>
            </aside>
          </div>
        </>
      )}
    </AppPageShell>
  );
}
