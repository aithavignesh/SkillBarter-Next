"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { UserPlus, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ displayName, email, phone, password });
      router.push("/onboarding");
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
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">Create an account</h2>
          <p className="mt-2 text-sm text-slate-600">
            Create your account and start exchanging skills. Already registered?{" "}
            <Link href="/login" className="rounded-sm font-semibold text-[#b71920] hover:text-[#d31d24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2">
              Sign in
            </Link>
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Full / Display Name</label>
              <input type="text" required value={displayName} onChange={e => setDisplayName(e.target.value)} className="mt-1.5 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#d31d24] focus:outline-none focus:ring-2 focus:ring-[#d31d24]/20" placeholder="Alex Morgan" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Email address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#d31d24] focus:outline-none focus:ring-2 focus:ring-[#d31d24]/20" placeholder="alex@example.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Mobile number</label>
              <input type="tel" autoComplete="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="mt-1.5 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#d31d24] focus:outline-none focus:ring-2 focus:ring-[#d31d24]/20" placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-1.5 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#d31d24] focus:outline-none focus:ring-2 focus:ring-[#d31d24]/20" placeholder="At least 8 chars, 1 uppercase, 1 number" />
              <p className="mt-1 text-[11px] text-slate-500">Must be at least 8 characters with upper, lower, and numbers.</p>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#d31d24] py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#b71920] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
