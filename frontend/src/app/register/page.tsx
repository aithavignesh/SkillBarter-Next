"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = await register({ displayName, email, phone, password });
      if (token) {
        setVerificationToken(token);
      } else {
        setEmailSent(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="auth-card w-full max-w-md space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d31d24] text-white shadow-md">
            <UserPlus className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
            Create an account
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="rounded-sm font-semibold text-[#b71920] hover:text-[#d31d24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2">
              Sign in
            </Link>
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {verificationToken ? (
          <div className="space-y-4 rounded-2xl bg-emerald-50 p-6 border border-emerald-200 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-900">Account Created!</h3>
            <p className="text-sm text-slate-600">
              Development verification token (production users receive an email link):
            </p>
            <div className="rounded-xl bg-white p-3 font-mono text-xs text-slate-800 break-all select-all border border-emerald-300">
              {verificationToken}
            </div>
            <Link
              href={`/verify-email?token=${encodeURIComponent(verificationToken)}`}
              className="inline-block w-full rounded-xl bg-[#d31d24] py-2.5 text-sm font-semibold text-white hover:bg-[#b71920] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
            >
              Verify Email & Continue
            </Link>
          </div>
        ) : emailSent ? (
          <div className="space-y-4 rounded-2xl bg-emerald-50 p-6 border border-emerald-200 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-900">Check your email</h3>
            <p className="text-sm text-slate-700">
              Your account has been created. We sent a verification link to <strong>{email}</strong>.
              Open that email to verify your address before continuing.
            </p>
            <Link
              href="/login"
              className="inline-block w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Go to Sign In
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Full / Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#d31d24] focus:outline-none focus:ring-1 focus:ring-[#d31d24]"
                  placeholder="Alex Morgan"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#d31d24] focus:outline-none focus:ring-1 focus:ring-[#d31d24]"
                  placeholder="alex@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Mobile number
                </label>
                <input
                  type="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#d31d24] focus:outline-none focus:ring-1 focus:ring-[#d31d24]"
                  placeholder="+91 98765 43210"
                />
                <p className="mt-1 text-[11px] text-slate-500">Include your country code. You can use this number to sign in with OTP.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#d31d24] focus:outline-none focus:ring-1 focus:ring-[#d31d24]"
                  placeholder="At least 8 chars, 1 uppercase, 1 number"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Must be at least 8 characters with upper, lower, and numbers.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#d31d24] py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#b71920] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
