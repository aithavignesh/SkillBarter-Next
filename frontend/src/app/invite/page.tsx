"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppPageShell } from "../../components/ui/AppPageShell";
import { Copy, Check, Mail, Share2, Users } from "lucide-react";

export default function InvitePage() {
  const [copied, setCopied] = useState(false);
  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined") return "/signup?ref=peer-invite";
    const url = new URL("/signup", window.location.origin);
    url.searchParams.set("ref", "peer-invite");
    return url.toString();
  }, []);
  const inviteMessage = `I'm using SkillBarter to learn practical skills from peers while sharing what I know. Join me and create your learning profile: ${inviteUrl}`;

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  async function shareInvite() {
    try {
      if (navigator.share) await navigator.share({ title: "Join me on SkillBarter", text: "Learn a skill from a peer and teach what you know.", url: inviteUrl });
      else await copyInvite();
    } catch {
      // Sharing may be cancelled by the user.
    }
  }

  return (
    <AppPageShell eyebrow="Grow the learning network" title="Invite people to SkillBarter" description="Bring in classmates, teammates and friends with skills to share." icon={<Users className="h-4 w-4" />}>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">How it works</h2>
          <ol className="mt-5 space-y-4 text-sm text-slate-600">
            <li><strong className="text-slate-900">1. Share your invite.</strong><br />Send the link through WhatsApp, email or your preferred channel.</li>
            <li><strong className="text-slate-900">2. Build learning profiles.</strong><br />Your friends add skills they can teach and skills they want to learn.</li>
            <li><strong className="text-slate-900">3. Find better matches.</strong><br />A growing network creates more opportunities for real exchanges.</li>
          </ol>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="flex items-center gap-2 font-bold text-slate-900"><Share2 className="h-4 w-4 text-red-600" /> Your invite link</h2>
          <p className="mt-4 break-all rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">{inviteUrl}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={shareInvite} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"><Share2 className="h-4 w-4" /> Share invite</button>
            <button onClick={copyInvite} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Copied" : "Copy message"}</button>
            <a href={`mailto:?subject=${encodeURIComponent("Join me on SkillBarter")}&body=${encodeURIComponent(inviteMessage)}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"><Mail className="h-4 w-4" /> Invite by email</a>
          </div>
          <p className="mt-5 text-xs leading-5 text-slate-500">Tip: invite 3–5 people who know a skill you want to learn or could benefit from something you can teach.</p>
        </section>
      </div>
      <div className="mt-5 flex flex-wrap gap-3"><Link href="/matches" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Back to matches</Link><Link href="/discover" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Find people to learn from</Link></div>
    </AppPageShell>
  );
}
