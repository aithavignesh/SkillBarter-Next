"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { AlertCircle, CheckCircle2, KeyRound, LogIn, Mail, Phone } from "lucide-react";

type Mode = "phone" | "emailOtp" | "password";

export default function LoginPage() {
  const router = useRouter();
  const { login, requestPhoneOtp, verifyPhoneOtp, requestEmailOtp, verifyEmailOtp, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<Mode>("phone");
  const [phone, setPhone] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const busy = loading || authLoading;

  useEffect(() => {
    const verified = new URLSearchParams(window.location.search).get("verified");
    if (verified === "1") setNotice("Your email has been verified. You can now sign in.");
    if (verified === "0") setError("This verification link is invalid or expired.");
  }, []);

  const run = async (action: () => Promise<void>) => {
    setError(null); setNotice(null); setLoading(true);
    try { await action(); } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to sign in. Please try again.");
    } finally { setLoading(false); }
  };

  const submitPhone = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15) throw new Error("Enter a valid mobile number with country code, e.g. +919876543210.");
      const normalized = phone.trim().startsWith("+") ? phone.trim().replace(/[\s()-]/g, "") : `+91${digits}`;
      if (!/^\+[1-9]\d{7,14}$/.test(normalized)) throw new Error("Enter a valid mobile number with country code.");
      const result = await requestPhoneOtp(normalized);
      setPhone(result.phone || normalized);
      setChallengeId(result.challengeId);
      setNotice("If this number belongs to a registered account, an OTP has been requested. Check your SMS.");
    });
  };

  const verifyPhone = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      if (!challengeId) throw new Error("Request a new OTP first.");
      await verifyPhoneOtp(phone.trim(), phoneOtp.trim(), challengeId);
      router.push("/dashboard");
    });
  };

  const submitEmailOtp = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      if (!emailOtpSent) {
        await requestEmailOtp(email.trim());
        setEmailOtpSent(true);
        setNotice("If an account exists for this email, a one-time code has been sent.");
        return;
      }
      if (!/^\d{6}$/.test(emailOtp.trim())) throw new Error("Enter the complete 6-digit email OTP.");
      await verifyEmailOtp(email.trim(), emailOtp.trim());
      router.push("/dashboard");
    });
  };

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      await login({ email: email.trim(), password });
      router.push("/dashboard");
    });
  };

  const tabClass = (active: boolean) => `flex-1 rounded-lg px-2 py-3 text-sm font-semibold transition ${active ? "bg-indigo-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`;
  const inputClass = "mt-1.5 block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600";

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-7 rounded-3xl border border-slate-200 bg-white p-7 shadow-lg sm:p-9">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md"><LogIn className="h-6 w-6" /></div>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in to your SkillBarter account</p>
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Sign-in method">
          <button type="button" role="tab" aria-selected={mode === "phone"} onClick={() => { setMode("phone"); setError(null); setNotice(null); }} className={tabClass(mode === "phone")}><Phone className="mr-1 inline h-4 w-4" />Mobile OTP</button>
          <button type="button" role="tab" aria-selected={mode === "emailOtp"} onClick={() => { setMode("emailOtp"); setError(null); setNotice(null); }} className={tabClass(mode === "emailOtp")}><Mail className="mr-1 inline h-4 w-4" />Email OTP</button>
          <button type="button" role="tab" aria-selected={mode === "password"} onClick={() => { setMode("password"); setError(null); setNotice(null); }} className={tabClass(mode === "password")}><KeyRound className="mr-1 inline h-4 w-4" />Password</button>
        </div>

        {notice && <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><p>{notice}</p></div>}
        {error && <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p>{error}</p></div>}

        {mode === "phone" && (
          <form className="space-y-5" onSubmit={challengeId ? verifyPhone : submitPhone}>
            <div><label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Mobile number</label><input id="phone" type="tel" autoComplete="tel" required value={phone} onChange={e => { setPhone(e.target.value); setChallengeId(""); }} className={inputClass} placeholder="+91 98765 43210" /></div>
            {challengeId && <div><label htmlFor="phoneOtp" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">6-digit SMS OTP</label><input id="phoneOtp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={phoneOtp} onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} className={inputClass} placeholder="Enter OTP" /></div>}
            <button disabled={busy} type="submit" className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50">{busy ? "Please wait…" : challengeId ? "Verify OTP & Sign In" : "Send OTP"}</button>
            {challengeId && <button type="button" onClick={() => { setChallengeId(""); setPhoneOtp(""); setNotice(null); }} className="w-full text-sm font-semibold text-indigo-600 hover:text-indigo-500">Change number / resend OTP</button>}
          </form>
        )}

        {mode === "emailOtp" && (
          <form className="space-y-5" onSubmit={submitEmailOtp}>
            <div><label htmlFor="emailOtpAddress" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Email address</label><input id="emailOtpAddress" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" /></div>
            {emailOtpSent && <div><label htmlFor="emailOtp" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">6-digit email OTP</label><input id="emailOtp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={emailOtp} onChange={e => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} className={inputClass} placeholder="Enter OTP" /></div>}
            <button disabled={busy} type="submit" className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50">{busy ? "Please wait…" : emailOtpSent ? "Verify OTP & Sign In" : "Send Email OTP"}</button>
            {emailOtpSent && <button type="button" onClick={() => { setEmailOtpSent(false); setEmailOtp(""); setNotice(null); }} className="w-full text-sm font-semibold text-indigo-600 hover:text-indigo-500">Use a different email / request a new code</button>}
          </form>
        )}

        {mode === "password" && (
          <form className="space-y-5" onSubmit={submitPassword}>
            <div><label htmlFor="passwordEmail" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Email address</label><input id="passwordEmail" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" /></div>
            <div><div className="flex items-center justify-between"><label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Password</label><Link href="/forgot-password" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">Forgot password?</Link></div><input id="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className={inputClass} placeholder="Your password" /></div>
            <button disabled={busy} type="submit" className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50">{busy ? "Signing in…" : "Sign In"}</button>
          </form>
        )}

        <p className="text-center text-sm text-slate-600">New to SkillBarter? <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">Create an account</Link></p>
      </div>
    </div>
  );
}
