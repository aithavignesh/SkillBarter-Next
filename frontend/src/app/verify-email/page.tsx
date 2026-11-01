"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../../services/api";
import { CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleVerify = async (tok: string) => {
    setStatus("loading");
    try {
      const res = await api.auth.verifyEmail(tok);
      if (typeof window !== "undefined") localStorage.removeItem("skillbarter_token");
      setStatus("success");
      setMessage(res.message || "Your email has been successfully verified!");
      setTimeout(() => router.push("/login?verified=1"), 1800);
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Verification failed. Token may be invalid or expired.");
    }
  };

  useEffect(() => {
    // Do not consume a verification token on page load: email security scanners
    // may prefetch links. Require an explicit user click to verify the account.
    const queryToken = searchParams.get("token");
    if (queryToken) setToken(queryToken);
  }, [searchParams]);

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 text-center shadow-lg">
        {status === "success" ? (
          <div className="space-y-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h2 className="text-2xl font-bold text-slate-900">Email Verified!</h2>
            <p className="text-sm text-slate-600">{message}</p>
            <p className="text-xs text-slate-400">Redirecting to sign in...</p>
            <Link href="/login?verified=1" className="mt-4 inline-block rounded-xl bg-[#d31d24] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b71920] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2">
              Continue to Sign In
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Verify Your Email</h2>
            <p className="text-sm text-slate-600">
              Confirm the token below, then click Verify Account. This explicit action prevents email link scanners from consuming your single-use token.
            </p>
            {status === "error" && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" /><p>{message}</p>
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); if (token.trim()) void handleVerify(token.trim()); }} className="space-y-4">
              <input type="text" required value={token} onChange={(e) => setToken(e.target.value)} placeholder="Enter verification token" className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-mono placeholder:font-sans transition-colors focus:border-[#d31d24] focus:outline-none focus:ring-2 focus:ring-[#d31d24]/20" />
              <button type="submit" disabled={status === "loading" || !token.trim()} className="w-full rounded-xl bg-[#d31d24] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#b71920] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                {status === "loading" ? "Verifying..." : "Verify Account"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading...</div>}><VerifyEmailContent /></Suspense>;
}
