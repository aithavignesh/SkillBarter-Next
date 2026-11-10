"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Heart, MessageSquare, Tag, Trash2 } from "lucide-react";
import type { CommunityPostDto } from "@skillbarter/shared";
import { AppPageShell } from "../../../../components/ui/AppPageShell";
import { useAuth } from "../../../../context/AuthContext";
import { api } from "../../../../services/api";

export default function CommunityPostDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const postId = params.id;
  const [post, setPost] = useState<CommunityPostDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    api.community
      .getPostById(postId)
      .then(({ post: loadedPost }) => {
        if (active) setPost(loadedPost);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load this community post.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [postId]);

  const canUseCommunityActions = Boolean(user?.isEmailVerified && user?.onboardingCompleted);
  const actionGateHref = !user
    ? "/login"
    : !user.onboardingCompleted
      ? "/onboarding"
      : !user.isEmailVerified
        ? `/verify-email?email=${encodeURIComponent(user.email)}`
        : null;
  const actionGateLabel = !user
    ? "Sign in to interact with this post"
    : !user.onboardingCompleted
      ? "Complete onboarding to interact with this post"
      : "Verify your email to interact with this post";
  const canDelete = Boolean(
    canUseCommunityActions && user && post && (user.id === post.authorId || user.role === "admin"),
  );

  const handleToggleLike = async () => {
    if (!post) return;
    if (!user) {
      router.push("/login");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = post.likedByMe
        ? await api.community.unlikePost(post.id)
        : await api.community.likePost(post.id);
      setPost(result.post);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to update your like.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!post || !canDelete || !window.confirm("Delete this community post?")) return;

    setBusy(true);
    setError(null);
    try {
      await api.community.deletePost(post.id);
      router.push("/community");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to delete this post.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppPageShell
      eyebrow="Open Knowledge Forum"
      title="Community Post"
      description="Read and interact with a community contribution."
      icon={<MessageSquare className="h-3.5 w-3.5" />}
      actions={
        <Link href="/community" className="sb-button-secondary inline-flex items-center gap-2 px-4 py-2.5 text-xs">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to feed
        </Link>
      }
    >
      <div className="mx-auto w-full max-w-3xl space-y-5">
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500" aria-live="polite">
            Loading community post...
          </div>
        ) : !post ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
            <MessageSquare className="mx-auto mb-3 h-9 w-9 text-slate-400" aria-hidden="true" />
            <h2 className="text-lg font-bold text-slate-900">Post unavailable</h2>
            <p className="mt-2 text-sm text-slate-600">This post may have been removed or is not available to your account.</p>
            <Link href="/community" className="mt-5 inline-flex text-sm font-semibold text-red-700 underline underline-offset-4">
              Return to community
            </Link>
          </div>
        ) : (
          <article className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <header className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-800" aria-hidden="true">
                  {post.authorName?.charAt(0).toUpperCase() || "M"}
                </div>
                <div className="min-w-0">
                  <Link href={`/profile/${post.authorId}`} className="font-semibold text-slate-900 underline-offset-4 hover:text-red-700 hover:underline">
                    {post.authorName || "Community member"}
                  </Link>
                  <p className="text-xs text-slate-500">
                    Posted {new Date(post.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
              </div>

              {canDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={busy}
                  aria-label="Delete community post"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-rose-300 hover:text-rose-800 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Delete
                </button>
              )}
            </header>

            <div className="space-y-3">
              <h2 className="text-xl font-bold leading-snug text-slate-950 sm:text-2xl">{post.title}</h2>
              <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{post.content}</p>
            </div>

            {post.tags.length > 0 && (
              <div role="group" className="flex flex-wrap gap-2 border-t border-slate-100 pt-4" aria-label="Post tags">
                {post.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    <Tag className="h-3 w-3 text-slate-500" aria-hidden="true" />
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handleToggleLike}
                disabled={busy || !canUseCommunityActions}
                aria-pressed={post.likedByMe}
                aria-describedby={actionGateHref ? "community-action-gate" : undefined}
                aria-label={post.likedByMe ? "Unlike this post" : "Like this post"}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-rose-300 hover:text-rose-800 disabled:opacity-50"
              >
                <Heart className={`h-4 w-4 ${post.likedByMe ? "fill-rose-600 text-rose-600" : "text-slate-500"}`} aria-hidden="true" />
                {post.likedByMe ? "Liked" : "Like"}
                <span className="tabular-nums text-slate-600">{post.likesCount}</span>
              </button>
              <div className="flex flex-col items-start gap-1">
                <Link href="/community" className="text-sm font-semibold text-red-700 underline underline-offset-4">
                  View more community posts
                </Link>
                {actionGateHref && (
                  <Link id="community-action-gate" href={actionGateHref} className="text-xs font-medium text-slate-600 underline underline-offset-4">
                    {actionGateLabel}
                  </Link>
                )}
              </div>
            </footer>
          </article>
        )}
      </div>
    </AppPageShell>
  );
}
