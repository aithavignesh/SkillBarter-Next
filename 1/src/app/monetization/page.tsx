import Link from "next/link";
import { AppPageShell } from "../../components/ui/AppPageShell";
import { BadgeCheck, Building2, Coins, GraduationCap, Megaphone, Rocket, Sparkles, Target } from "lucide-react";

const ideas = [
  { title: "Featured skill listings", description: "Optional visibility boosts for skill profiles.", icon: Rocket, status: "Not enabled" },
  { title: "Verified skill badges", description: "A review process to strengthen profile trust.", icon: BadgeCheck, status: "Planned" },
  { title: "Priority matching", description: "Surface higher-fit learning opportunities.", icon: Sparkles, status: "Planned" },
  { title: "Sponsored listings", description: "Relevant promotions from skill-related partners.", icon: Megaphone, status: "Planned" },
  { title: "Paid workshops", description: "Help creators offer structured learning sessions.", icon: GraduationCap, status: "Planned" },
  { title: "Team plans", description: "Support organizations running learning programs.", icon: Building2, status: "Planned" },
  { title: "Skill credits", description: "A possible credit system for optional premium actions.", icon: Coins, status: "Not enabled" },
  { title: "Professional leads", description: "Opt-in discovery for relevant service requests.", icon: Target, status: "Planned" },
];

export default function MonetizationPage() {
  return (
    <AppPageShell eyebrow="Platform roadmap" title="SkillBarter monetization" description="A transparent overview of possible future premium features. Basic skill barter remains the core experience." icon={<Coins className="h-4 w-4" />}>
      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Payments and premium entitlements are not enabled on this page. No purchase, charge, or credit balance can be created here.</div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ideas.map(({title,description,icon:Icon,status}) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><Icon className="h-5 w-5 text-red-600" /><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{status}</span></div><h2 className="mt-4 font-bold text-slate-900">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></article>)}
      </div>
      <div className="mt-5"><Link href="/settings" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Go to settings</Link></div>
    </AppPageShell>
  );
}
