"use client";

import { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../services/api";
import { ExchangeDto, ExchangeSessionDto } from "@skillbarter/shared";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  Star,
  Plus,
  Video,
} from "lucide-react";

export default function ExchangeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldOpenReview = searchParams.get("review") === "1";
  const { user } = useAuth();

  const [exchange, setExchange] = useState<ExchangeDto | null>(null);
  const [sessions, setSessions] = useState<ExchangeSessionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Session proposal modal state
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionStartTime, setSessionStartTime] = useState("");
  const [sessionEndTime, setSessionEndTime] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [proposingSession, setProposingSession] = useState(false);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [exRes, sessRes] = await Promise.all([
        api.exchanges.getById(id),
        api.exchanges.listSessions(id),
      ]);
      setExchange(exRes.exchange);
      setSessions(sessRes.sessions);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load exchange");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (shouldOpenReview && exchange?.status === "COMPLETED") {
      setShowReviewModal(true);
    }
  }, [shouldOpenReview, exchange?.status]);

  useEffect(() => {
    // These IDs were static screens in the legacy app, not exchange records.
    // Route them to the real exchange workspace instead of querying MongoDB
    // with a non-ObjectId slug.
    if (["active-exchange", "exchange-history", "exchange-rating"].includes(id)) {
      router.replace("/exchanges");
      return;
    }
    if (["schedule", "calendar"].includes(id)) {
      router.replace("/exchanges/calendar");
      return;
    }
    void fetchData();
  }, [fetchData, id, router]);

  const handleUpdateStatus = async (status: any, reason?: string) => {
    setActionError(null);
    try {
      await api.exchanges.updateStatus(id, { status, reason });
      await fetchData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Action failed. Please try again.");
    }
  };

  const handleConfirmCompletion = async () => {
    setActionError(null);
    try {
      await api.exchanges.complete(id);
      await fetchData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to confirm completion. Please try again.");
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    const start = new Date(sessionStartTime);
    const end = new Date(sessionEndTime);
    if (!sessionStartTime || !sessionEndTime || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setActionError("Choose a valid start and end time for the session.");
      return;
    }
    if (end <= start) {
      setActionError("The session end time must be later than its start time.");
      return;
    }
    if (start <= new Date()) {
      setActionError("Choose a session start time in the future.");
      return;
    }
    setProposingSession(true);
    try {
      await api.exchanges.createSession(id, {
        exchangeId: id,
        title: sessionTitle,
        startTime: new Date(sessionStartTime).toISOString(),
        endTime: new Date(sessionEndTime).toISOString(),
        notes: sessionNotes,
        meetingLink,
      });
      setShowSessionModal(false);
      setSessionTitle("");
      await fetchData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to propose session. Please try again.");
    } finally {
      setProposingSession(false);
    }
  };

  const handleConfirmSession = async (sessionId: string) => {
    setActionError(null);
    try {
      await api.exchanges.updateSessionStatus(id, sessionId, { status: "CONFIRMED" });
      await fetchData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to confirm session. Please try again.");
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setSubmittingReview(true);
    try {
      await api.reviews.create({
        exchangeId: id,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewSuccess(true);
      setTimeout(() => setShowReviewModal(false), 1200);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-slate-500">Loading exchange details...</div>;
  }

  if (error || !exchange) {
    return (
      <div className="p-12 text-center">
        <p className="text-rose-700 font-semibold">{error || "Exchange not found"}</p>
        <Link href="/exchanges" className="mt-4 inline-block text-xs font-bold text-indigo-600">
          ← Back to Exchanges
        </Link>
      </div>
    );
  }

  const isRequester = exchange.requesterId === user?.id;
  const isRecipient = exchange.recipientId === user?.id;
  const otherUserId = isRequester ? exchange.recipientId : exchange.requesterId;
  const otherUserName = isRequester ? exchange.recipientName : exchange.requesterName;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <Link
        href="/exchanges"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Exchanges
      </Link>

      {actionError && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p>{actionError}</p>
          <button type="button" onClick={() => setActionError(null)} className="shrink-0 font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700">Dismiss</button>
        </div>
      )}

      {/* Main Status & Header Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  exchange.status === "COMPLETED"
                    ? "bg-emerald-100 text-emerald-800"
                    : exchange.status === "PENDING"
                    ? "bg-amber-100 text-amber-800"
                    : exchange.status === "CANCELLED"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-indigo-100 text-indigo-800"
                }`}
              >
                STATUS: {exchange.status}
              </span>
              <span className="text-xs text-slate-400">
                Created {new Date(exchange.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
              Exchange with {otherUserName || "Peer"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/messages?partner=${encodeURIComponent(otherUserId)}`}
              className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              <MessageSquare className="h-4 w-4" /> Open Conversation
            </Link>
          </div>
        </div>

        {/* Skills Being Exchanged */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
            <span className="text-xs font-bold uppercase text-emerald-700">Offered Skill</span>
            <p className="mt-1 text-lg font-bold text-slate-900">{exchange.offeredSkillName}</p>
            <p className="text-xs text-slate-500">Taught by {exchange.requesterName}</p>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
            <span className="text-xs font-bold uppercase text-indigo-700">Skill in Return</span>
            <p className="mt-1 text-lg font-bold text-slate-900">{exchange.wantedSkillName}</p>
            <p className="text-xs text-slate-500">Taught by {exchange.recipientName}</p>
          </div>
        </div>

        {/* Proposal Description */}
        <div>
          <span className="text-xs font-semibold uppercase text-slate-500">Proposal Description</span>
          <p className="mt-1 text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
            {exchange.proposalDescription}
          </p>
        </div>

        {/* Lifecycle Actions */}
        <div className="border-t border-slate-100 pt-6 flex flex-wrap items-center gap-3">
          {exchange.status === "PENDING" && isRecipient && (
            <>
              <button
                type="button"
                onClick={() => handleUpdateStatus("ACCEPTED")}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4" /> Accept Proposal
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus("REJECTED")}
                className="flex items-center gap-1.5 rounded-xl border border-rose-300 px-5 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
              >
                <XCircle className="h-4 w-4" /> Decline
              </button>
            </>
          )}

          {exchange.status === "PENDING" && isRequester && (
            <button
              type="button"
              onClick={() => handleUpdateStatus("CANCELLED", "Withdrawn by requester")}
              className="rounded-xl border border-rose-300 px-5 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
            >
              Withdraw Request
            </button>
          )}

          {["ACCEPTED", "SCHEDULED", "IN_PROGRESS"].includes(exchange.status) && (
            <>
              <button
                type="button"
                onClick={() => setShowSessionModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 shadow-sm"
              >
                <Plus className="h-4 w-4" /> Propose Session
              </button>

              <button
                type="button"
                onClick={handleConfirmCompletion}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isRequester && exchange.completionStatus.requesterConfirmed
                  ? "You Confirmed Completion"
                  : isRecipient && exchange.completionStatus.recipientConfirmed
                  ? "You Confirmed Completion"
                  : "Confirm Completion"}
              </button>

              <button
                type="button"
                onClick={() => {
                  const reason = prompt("Enter cancellation or dispute reason:");
                  if (reason) handleUpdateStatus("CANCELLED", reason);
                }}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel Exchange
              </button>
            </>
          )}

          {exchange.status === "COMPLETED" && (
            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-semibold text-white hover:bg-amber-600 shadow-sm"
            >
              <Star className="h-4 w-4" /> Leave Review & Rating
            </button>
          )}
        </div>
      </div>

      {/* Scheduled Sessions Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Exchange Sessions</h2>
            <p className="mt-1 text-xs text-slate-500">Agreed times for lessons and mutual practice.</p>
          </div>
          {["ACCEPTED", "SCHEDULED", "IN_PROGRESS"].includes(exchange.status) && (
            <button
              type="button"
              onClick={() => setShowSessionModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-3.5 w-3.5" /> Schedule Session
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
            No sessions proposed yet. Click &apos;Propose Session&apos; above to agree on a time!
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">{s.title}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        s.status === "CONFIRMED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(s.startTime).toLocaleString()} - {new Date(s.endTime).toLocaleTimeString()}
                  </p>
                  {s.meetingLink && (
                    <a
                      href={s.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                    >
                      <Video className="h-3.5 w-3.5" /> Join Meeting Link
                    </a>
                  )}
                  {s.notes && <p className="mt-1 text-xs text-slate-500 italic">{s.notes}</p>}
                </div>

                {s.status === "PROPOSED" && s.proposedById !== user?.id && (
                  <button
                    type="button"
                    onClick={() => handleConfirmSession(s.id)}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                  >
                    Confirm Session
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Propose Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Propose Session Time</h3>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Session Title
                </label>
                <input
                  type="text"
                  required
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="e.g. Session 1: TypeScript Setup & Practice"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={sessionStartTime}
                    onChange={(e) => setSessionStartTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={sessionEndTime}
                    onChange={(e) => setSessionEndTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Meeting Link (Google Meet, Zoom, etc.)
                </label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Notes / Agenda
                </label>
                <textarea
                  rows={2}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Topics to focus on during this lesson..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={proposingSession}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {proposingSession ? "Scheduling..." : "Propose Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-title"
            className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-4"
          >
            <h3 id="review-title" className="text-xl font-bold text-slate-900">Review {otherUserName}</h3>
            {reviewSuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
                <p className="font-bold text-sm text-slate-900">Thank you for your review!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <fieldset>
                  <legend className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Rating (1 to 5 Stars)
                  </legend>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        aria-label={`${star} star${star === 1 ? "" : "s"}`}
                        aria-pressed={star === reviewRating}
                        onClick={() => setReviewRating(star)}
                        className="p-1"
                      >
                        <Star
                          aria-hidden="true"
                          className={`h-6 w-6 ${
                            star <= reviewRating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label htmlFor="review-comment" className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Written Feedback
                  </label>
                  <textarea
                    id="review-comment"
                    rows={4}
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="How was your exchange experience? Did you learn effectively?"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
