"use client";

import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { ShieldAlert, UserX, AlertCircle, CheckCircle2 } from "lucide-react";

export default function SafetyPage() {
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Report form state
  const [targetType, setTargetType] = useState<"user" | "message" | "review" | "community_post">("user");
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const fetchBlocked = async () => {
    try {
      const res = await api.safety.listBlocked();
      setBlockedUsers(res.blockedUsers);
    } catch {
      setBlockedUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocked();
  }, []);

  const handleUnblock = async (userId: string) => {
    if (!confirm("Unblock this user?")) return;
    try {
      await api.safety.unblock(userId);
      await fetchBlocked();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to unblock");
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setReportError(null);
    setReportSuccess(false);

    try {
      await api.safety.createReport({
        targetType,
        targetId: targetId.trim(),
        reason: reason.trim(),
        description: description.trim(),
      });
      setReportSuccess(true);
      setTargetId("");
      setReason("");
      setDescription("");
    } catch (err: unknown) {
      setReportError(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
          Trust & Safety
        </span>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Safety & Moderation</h1>
        <p className="mt-1 text-sm text-slate-500">
          Report policy violations, protect your account, and manage blocked users.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Submit Report */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Submit a Report</h2>
              <p className="text-xs text-slate-500">Our moderation team reviews all reports.</p>
            </div>
          </div>

          {reportError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{reportError}</p>
            </div>
          )}

          {reportSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-xs text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p>Your report has been submitted to moderators.</p>
            </div>
          )}

          <form onSubmit={handleReport} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Report Type
              </label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-white"
              >
                <option value="user">User Account</option>
                <option value="message">Inappropriate Message</option>
                <option value="review">False or Abusive Review</option>
                <option value="community_post">Community Post Violation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Target User ID or Content ID
              </label>
              <input
                type="text"
                required
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="Paste the ID of the user or content"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Reason
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Harassment, Spam, No-show behavior"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Detailed Description
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what occurred with as much context as possible..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-rose-600 py-2.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </form>
        </div>

        {/* Blocked Users */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <UserX className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Blocked Users</h2>
              <p className="text-xs text-slate-500">Blocked members cannot match or message you.</p>
            </div>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400">Loading blocked users...</p>
          ) : blockedUsers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
              You haven&apos;t blocked any members.
            </div>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">{b.displayName}</h3>
                    {b.reason && <p className="text-[11px] text-slate-500 italic">{b.reason}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnblock(b.userId)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
