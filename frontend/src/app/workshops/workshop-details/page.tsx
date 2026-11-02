"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppPageShell } from "../../../components/ui/AppPageShell";
import { api } from "../../../services/api";
import type { CommunityPostDto } from "@skillbarter/shared";
import { ArrowLeft, CalendarDays, CircleAlert, RefreshCw } from "lucide-react";

const WORKSHOP_TAGS = new Set(["workshop", "workshops"]);

export default function WorkshopDetailsPage() {
  const [post, setPost] = useState<CommunityPostDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPost = useCallback(async () => {
    setLoading(true);
    setError(null);

    const postId = new URLSearchParams(window.location.search).get("post");
    if (!postId) {
      setPost(null);
      setError("This workshop link is missing its post identifier.");
      setLoading(false);
      return;
    }

    try {
      let page = 1;
      let workshop: CommunityPostDto | undefined;

      // The community endpoint is paginated (20 posts per page). Follow the
      // shared post ID across pages instead of assuming it is in the newest page.
      while (!workshop && page <= 100) {
        const posts = await api.community.listPosts(page);
        workshop = posts.find(
          (item) =>
            item.id === postId &&
            item.tags.some((tag) => WORKSHOP_TAGS.has(tag.trim().toLowerCase()))
        );

        if (workshop || posts.length < 20) break;
        page += 1;
      }

      if (!workshop) {
        setPost(null);
        setError("This workshop could not be found. It may have been removed or is no longer available.");
        return;
      }

      setPost(workshop);
    } catch (err: unknown) {
      setPost(null);
      setError(err instanceof Error ? err.message : "Unable to load this workshop right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPost();
  }, [loadPost]);

  return (
    <AppPageShell
      eyebrow="Community learning"
      title="Workshop details"
      description="Review the workshop announcement and connect with its author."
      icon={<CalendarDays className="h-4 w-4" />}
      actions={
        <Link
          href="/workshops/workshops"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Browse workshops
        </Link>
      }
    >
      {loading ? (
        <div
          className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600"
          role="status"
          aria-live="polite"
        >
          Loading workshop details…
        </div>
      ) : error ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6" role="alert">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden="true" />
            <div>
              <h2 className="font-semibold text-red-950">Workshop unavailable</h2>
              <p className="mt-1 text-sm leading-6 text-red-900">{error}</p>
              <button
                type="button"
                onClick={() => void loadPost()}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Try again
              </button>
            </div>
          </div>
        </section>
      ) : post ? (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-red-700">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Workshop
          </p>
          <h2 className="mt-3 break-words text-2xl font-bold text-slate-900">{post.title}</h2>
          <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
            {post.content}
          </p>
          <p className="mt-5 text-sm text-slate-600">
            By{" "}
            <Link
              href={`/profile/${post.authorId}`}
              className="font-semibold text-slate-800 underline decoration-slate-300 underline-offset-2 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
            >
              {post.authorName || "SkillBarter member"}
            </Link>
            {" · "}
            Published{" "}
            <time dateTime={post.createdAt}>
              {new Date(post.createdAt).toLocaleDateString()}
            </time>
          </p>
          {post.tags.filter((tag) => !WORKSHOP_TAGS.has(tag.trim().toLowerCase())).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2" aria-label="Workshop tags">
              {post.tags
                .filter((tag) => !WORKSHOP_TAGS.has(tag.trim().toLowerCase()))
                .map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                    #{tag}
                  </span>
                ))}
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
            <Link
              href={`/profile/${post.authorId}`}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
            >
              View member
            </Link>
            <Link
              href="/community"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
            >
              Community feed
            </Link>
          </div>
        </article>
      ) : null}
    </AppPageShell>
  );
}
