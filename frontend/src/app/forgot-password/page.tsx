"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "../../services/api";
import { KeyRound, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.auth.forgotPassword(email);
      setSubmitted(true);
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
      <div className="auth-card w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d31d24] text-white shadow-md">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Enter your email to receive a password reset token.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {submitted ? (
          <div className="space-y-4 rounded-2xl bg-emerald-50 p-6 border border-emerald-200 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <p className="text-sm text-slate-700">
              If an account matches <strong>{email}</strong>, password reset instructions have been generated.
            </p>
            {resetToken && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-slate-500">DEVELOPMENT RESET TOKEN:</p>
                <div className="rounded-xl bg-white p-2.5 font-mono text-xs text-slate-800 break-all border border-emerald-300">
                  {resetToken}
                </div>
                <Link
                  href={`/reset-password?token=${resetToken}`}
                  className="mt-3 inline-block w-full rounded-xl bg-[#d31d24] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b71920] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
                >
                  Proceed to Reset Password
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 transition-colors focus:border-[#d31d24] focus:outline-none focus:ring-2 focus:ring-[#d31d24]/20"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#d31d24] py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#b71920] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link href="/login" className="rounded-sm text-xs font-semibold text-[#b71920] hover:text-[#d31d24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2">
            Back to Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
