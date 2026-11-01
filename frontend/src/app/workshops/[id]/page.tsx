"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppPageShell } from "../../../components/ui/AppPageShell";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../services/api";
import { CommunityPostDto } from "@skillbarter/shared";
import { ArrowLeft, CalendarDays, CircleAlert, ExternalLink, LockKeyhole, RefreshCw, Share2, Sparkles } from "lucide-react";

const WORKSHOP_TAGS = new Set(["workshop", "workshops"]);

export default function WorkshopsPage() {
  const params = useParams<{ id: string }>();
  const mode = params.id;
  const { user } = useAuth();
  const isCreate = mode === "create-workshop";
  const isMine = mode === "my-workshops";
  const [posts, setPosts] = useState<CommunityPostDto[]>([]);
  const [loading, setLoading] = useState(!isCreate);
  const [error, setError] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allPosts = await api.community.listPosts(1);
      const workshopPosts = allPosts.filter((post) =>
        post.tags.some((tag) => WORKSHOP_TAGS.has(tag.trim().toLowerCase()))
      );
      setPosts(isMine ? workshopPosts.filter((post) => post.authorId === user?.id) : workshopPosts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to load workshops right now.");
    } finally {
      setLoading(false);
    }
  }, [isMine, user?.id]);

  useEffect(() => {
    if (!isCreate) void loadPosts();
  }, [isCreate, loadPosts]);

  async function shareWorkshop(post: CommunityPostDto) {
    setShareMessage(null);
    const url = new URL(`/workshops/workshop-details?post=${encodeURIComponent(post.id)}`, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: post.content, url });
        setShareMessage("Workshop shared.");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShareMessage("Workshop link copied to clipboard.");
      } else {
        setShareMessage("Sharing is not available in this browser.");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setShareMessage("Could not share this workshop. Please try again.");
    }
  }

  if (isCreate) {
    return (
      <AppPageShell
        eyebrow="Workshops"
        title="Workshop publishing is not enabled yet"
        description="Workshop browsing is available for posts tagged as workshops. Publishing is paused until SkillBarter-Next has a verified premium-entitlement flow."
        icon={<LockKeyhole className="h-4 w-4" />}
      >
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-7" aria-labelledby="workshop-publishing-status">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" aria-hidden="true" />
            <div>
              <h2 id="workshop-publishing-status" className="font-bold text-amber-950">Premium entitlement verification is missing</h2>
              <p className="mt-2 text-sm leading-6 text-amber-900">The current migration does not yet have a backend entitlement check for paid workshop publishing. This action stays disabled rather than bypassing the legacy restriction.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/monetization" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-amber-950 ring-1 ring-amber-300 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-800 focus-visible:ring-offset-2">
                  <Sparkles className="h-4 w-4" aria-hidden="true" /> View monetization status
                </Link>
                <Link href="/workshops/workshops" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-800 focus-visible:ring-offset-2">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Browse workshops
                </Link>
              </div>
            </div>
          </div>
        </section>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell
      eyebrow="Community learning"
      title={isMine ? "My Workshops" : "Workshops"}
      description={isMine ? "Workshop posts authored by your account." : "Discover community posts explicitly tagged as workshops."}
      icon={<CalendarDays className="h-4 w-4" />}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/workshops/create-workshop" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">
            <LockKeyhole className="h-4 w-4" aria-hidden="true" /> Publishing status
          </Link>
          <Link href="/community" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Community
          </Link>
        </div>
      }
    >
      {shareMessage && <p role="status" aria-live="polite" className="mb-4 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">{shareMessage}</p>}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600" role="status" aria-live="polite">Loading workshops…</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6" role="alert">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden="true" />
            <div>
              <h2 className="font-semibold text-red-950">Workshops could not be loaded</h2>
              <p className="mt-1 text-sm text-red-900">{error}</p>
              <button type="button" onClick={() => void loadPosts()} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">
                <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
              </button>
            </div>
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12">
          <CalendarDays className="mx-auto h-9 w-9 text-slate-400" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold text-slate-900">No workshop posts yet</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">This page lists community posts tagged “workshop”. Publishing is currently disabled until premium entitlements can be verified in the backend.</p>
          <Link href="/community" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">Explore community posts</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <article key={post.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-red-700"><CalendarDays className="h-4 w-4" aria-hidden="true" /> Workshop</p>
                  <h2 className="mt-2 break-words text-lg font-bold text-slate-900">{post.title}</h2>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{post.content}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    By <Link href={`/profile/${post.authorId}`} className="font-semibold text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">{post.authorName || "SkillBarter member"}</Link>
                    {" · "}Published <time dateTime={post.createdAt}>{new Date(post.createdAt).toLocaleDateString()}</time>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {post.tags.filter((tag) => !WORKSHOP_TAGS.has(tag.trim().toLowerCase())).map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">#{tag}</span>)}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link href={`/profile/${post.authorId}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">
                    View member <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <button type="button" onClick={() => void shareWorkshop(post)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">
                    <Share2 className="h-4 w-4" aria-hidden="true" /> Share
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppPageShell>
  );
}
