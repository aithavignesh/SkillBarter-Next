"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../../services/api";
import { KeyRound, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const qToken = searchParams.get("token");
    if (qToken) setToken(qToken);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.auth.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-lg">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d31d24] text-white shadow-md">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
            Set New Password
          </h2>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success ? (
          <div className="space-y-4 rounded-2xl bg-emerald-50 p-6 text-center border border-emerald-200">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-900">Password Reset Complete!</h3>
            <p className="text-sm text-slate-600">Redirecting to sign in...</p>
            <Link
              href="/login"
              className="inline-block mt-2 rounded-xl bg-[#d31d24] px-6 py-2.5 text-sm font-semibold text-white"
            >
              Sign In Now
            </Link>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Reset Token
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-mono focus:border-[#d31d24] focus:outline-none focus:ring-1 focus:ring-[#d31d24]"
                placeholder="Paste reset token here"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-[#d31d24] focus:outline-none focus:ring-1 focus:ring-[#d31d24]"
                placeholder="At least 8 chars, 1 uppercase, 1 number"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#d31d24] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#b71920] disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
