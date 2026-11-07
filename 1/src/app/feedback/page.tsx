"use client";

import { useState } from "react";
import Link from "next/link";
import { AppPageShell } from "../../components/ui/AppPageShell";
import { Bug, CheckCircle2, Lightbulb, MessageSquare, Send } from "lucide-react";

const MAX_MESSAGE_LENGTH = 1000;

export default function FeedbackPage() {
  const [type, setType] = useState<"GENERAL" | "BUG" | "IDEA">("GENERAL");
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const trimmedMessage = message.trim();
  const canSubmit = trimmedMessage.length > 0 && trimmedMessage.length <= MAX_MESSAGE_LENGTH;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    // This legacy flow only tracked the event client-side; do not imply server persistence.
    window.dispatchEvent(new CustomEvent("skillbarter:beta-feedback", { detail: { type, rating, message: trimmedMessage } }));
    setSent(true);
    setMessage("");
  }

  return (
    <AppPageShell eyebrow="Beta feedback" title="Help improve the first learning exchange" description="Tell us what worked, what felt confusing, or what would make SkillBarter more useful." icon={<MessageSquare className="h-4 w-4" />}>
      {sent ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
          <h2 className="mt-3 font-bold text-slate-900">Thanks for the feedback.</h2>
          <p className="mt-1 text-sm text-slate-600">Your response has been captured in this session. Server-side feedback storage is not connected yet.</p>
          <button onClick={() => setSent(false)} className="mt-5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">Send another response</button>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-red-600">1. Feedback type</p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {([{value:"GENERAL",label:"General",Icon:MessageSquare},{value:"BUG",label:"Bug",Icon:Bug},{value:"IDEA",label:"Feature idea",Icon:Lightbulb}] as const).map(({value,label,Icon}) => (
                <button key={value} type="button" onClick={() => setType(value)} aria-pressed={type===value} className={`rounded-xl border p-3 text-left text-sm ${type===value ? "border-red-500 bg-red-50" : "border-slate-200"}`}><Icon className="mb-2 h-4 w-4 text-red-600" /><span className="font-semibold text-slate-800">{label}</span></button>
              ))}
            </div>
            <p className="mt-7 text-xs font-bold uppercase tracking-wider text-red-600">2. Experience rating</p>
            <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Experience rating">
              {[1,2,3,4,5].map(value => <button key={value} type="button" role="radio" aria-checked={rating===value} aria-label={`${value} out of 5`} onClick={() => setRating(value)} className={`h-10 w-10 rounded-lg border text-sm font-bold ${rating===value ? "border-red-600 bg-red-600 text-white" : "border-slate-200 text-slate-600"}`}>{value}</button>)}
            </div>
            <p className="mt-2 text-xs text-slate-500">1 = frustrating · 5 = very useful</p>
          </div>
          <div>
            <label htmlFor="feedback-message" className="text-xs font-bold uppercase tracking-wider text-red-600">3. Tell us what happened</label>
            <textarea id="feedback-message" value={message} onChange={event => setMessage(event.target.value.slice(0, MAX_MESSAGE_LENGTH))} required maxLength={MAX_MESSAGE_LENGTH} rows={8} placeholder="Where did you get stuck? What should we improve?" className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-red-500" />
            <div className="mt-2 flex justify-between gap-3 text-xs text-slate-500"><span>Avoid passwords, OTPs and sensitive information.</span><span aria-live="polite">{message.length}/{MAX_MESSAGE_LENGTH}</span></div>
            <button type="submit" disabled={!canSubmit} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" /> Send beta feedback</button>
          </div>
        </form>
      )}
      <div className="mt-5"><Link href="/feed" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Back to learning feed</Link></div>
    </AppPageShell>
  );
}
