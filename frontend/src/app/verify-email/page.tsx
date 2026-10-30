"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const queryToken = searchParams.get("token");
    if (queryToken) {
      setToken(queryToken);
      handleVerify(queryToken);
    }
  }, [searchParams]);

  const handleVerify = async (tok: string) => {
    setStatus("loading");
    try {
      const res = await api.auth.verifyEmail(tok);
      await refreshUser();
      setStatus("success");
      setMessage(res.message || "Your email has been successfully verified!");
      setTimeout(() => router.push("/onboarding"), 2000);
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Verification failed. Token may be invalid or expired.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 text-center shadow-lg">
        {status === "success" ? (
          <div className="space-y-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h2 className="text-2xl font-bold text-slate-900">Email Verified!</h2>
            <p className="text-sm text-slate-600">{message}</p>
            <p className="text-xs text-slate-400">Redirecting to profile onboarding...</p>
            <Link
              href="/onboarding"
              className="inline-block mt-4 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white"
            >
              Continue to Onboarding
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Verify Your Email</h2>
            <p className="text-sm text-slate-600">
              Enter the single-use verification code sent to your email to activate your account.
            </p>

            {status === "error" && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{message}</p>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (token.trim()) handleVerify(token.trim());
              }}
              className="space-y-4"
            >
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter verification token"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-mono placeholder:font-sans focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
              <button
                type="submit"
                disabled={status === "loading" || !token.trim()}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
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
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
