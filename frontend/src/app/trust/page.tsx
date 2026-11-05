"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { PublicUserProfile, ReviewDto, ExchangeDto } from "@skillbarter/shared";
import { AppPageShell } from "../../components/ui/AppPageShell";
import { ArrowRight, RefreshCw, ShieldCheck, Star } from "lucide-react";

export default function TrustPage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [exchanges, setExchanges] = useState<ExchangeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      api.users.getProfile(user.id),
      api.reviews.getUserReviews(user.id),
      api.exchanges.list(),
    ])
      .then(([profileResult, reviewResult, exchangeResult]) => {
        if (!active) return;
        setProfile(profileResult.profile);
        setReviews(reviewResult.reviews);
        setExchanges(exchangeResult.exchanges);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load your trust summary.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, user?.id, reloadKey]);

  const reputationScore = profile?.reputationScore ?? user?.reputationScore ?? 0;
  const completedExchanges = profile?.completedExchangesCount ?? user?.completedExchangesCount ?? 0;
  const averageRating = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
    : null;
  const completedExchangeRecords = exchanges.filter((exchange) => exchange.status === "COMPLETED").length;

  return (
    <AppPageShell
      eyebrow="Trust & reputation"
      title="Your community trust"
      description="Review the reputation, completed exchanges and feedback recorded on your SkillBarter account."
      icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
      actions={
        <Link
          href="/safety"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
        >
          Safety Centre <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      }
    >
      {authLoading || loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600" role="status" aria-live="polite">
          Loading your trust summary…
        </div>
      ) : !user ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900">Sign in to view your trust summary</h2>
          <p className="mt-2 text-sm text-slate-600">Your reputation and exchange history are available after you sign in.</p>
          <Link href="/login" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">
            Sign in
          </Link>
        </section>
      ) : error ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6" role="alert">
          <h2 className="font-semibold text-red-950">Trust summary unavailable</h2>
          <p className="mt-1 text-sm text-red-900">{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
          </button>
        </section>
      ) : (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Trust metrics">
            <article className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-500">Community reputation</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">{reputationScore.toFixed(1)} <span className="text-base font-semibold text-slate-500">/ 5</span></p>
              <p className="mt-1 text-xs text-slate-500">Current platform reputation score</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-500">Completed exchanges</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">{completedExchanges}</p>
              <p className="mt-1 text-xs text-slate-500">{completedExchangeRecords} completed exchange records returned</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-500">Reviews received</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">{reviews.length}</p>
              <p className="mt-1 text-xs text-slate-500">Feedback from other members</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-500">Average review rating</p>
              <p className="mt-2 flex items-center gap-2 text-3xl font-bold text-slate-900 tabular-nums">
                {averageRating === null ? "—" : averageRating.toFixed(1)}
                {averageRating !== null && <Star className="h-5 w-5 fill-amber-400 text-amber-500" aria-hidden="true" />}
                {averageRating !== null && <span className="text-base font-semibold text-slate-500">/ 5</span>}
              </p>
              <p className="mt-1 text-xs text-slate-500">Calculated from reviews received</p>
            </article>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="font-semibold text-slate-900">Recent community reviews</h2>
              <p className="mt-1 text-sm text-slate-500">Feedback recorded for completed skill exchanges.</p>
            </div>
            {reviews.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No reviews yet. Complete exchanges and invite your partners to leave feedback.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {reviews.slice(0, 8).map((review) => (
                  <li key={review.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{review.reviewerName || "SkillBarter member"}</p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{review.comment}</p>
                      <time className="mt-2 block text-xs text-slate-400" dateTime={review.createdAt}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </time>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-slate-700" aria-label={`Rating: ${review.rating} out of 5`}>
                      <Star className="h-4 w-4 fill-amber-400 text-amber-500" aria-hidden="true" /> {review.rating}/5
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="text-xs leading-5 text-slate-500">
            This summary uses the reputation score, exchange count and reviews currently stored by the platform. Detailed reliability or skill-quality sub-scores are not exposed by the current API, so they are not estimated here.
          </p>
        </div>
      )}
    </AppPageShell>
  );
}
