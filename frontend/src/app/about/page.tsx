import Link from "next/link";
import { ArrowLeft, Check, Shield, Award, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#d31d24] hover:text-[#b71920] mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
        About SkillBarter-Next
      </h1>
      <p className="mt-4 text-xl text-slate-600">
        Empowering equitable knowledge exchange through true peer collaboration.
      </p>

      <div className="mt-12 space-y-12">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Our Mission</h2>
          <p className="mt-4 leading-7 text-slate-600">
            Traditional learning platforms often place steep financial barriers between passionate
            learners and expert mentors. SkillBarter was founded on a simple insight:{" "}
            <strong>every person has something valuable to teach</strong>.
          </p>
          <p className="mt-4 leading-7 text-slate-600">
            By exchanging one skill for another—such as web development for graphic design, or
            conversational Japanese for data analysis—both participants grow together without
            financial transaction friction.
          </p>
        </section>

        <section id="guidelines" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Exchange Guidelines & Ethics</h2>
          <div className="mt-6 space-y-4">
            {[
              {
                title: "Mutual Respect & Punctuality",
                desc: "Honor scheduled session times. If rescheduling is needed, provide adequate advance notice.",
              },
              {
                title: "Balanced Time Commitments",
                desc: "Aim for parity in time and attention dedicated to each participant's learning objectives.",
              },
              {
                title: "Constructive & Honest Feedback",
                desc: "Reviews should be genuine, encouraging, and reflect actual session participation.",
              },
              {
                title: "Zero Tolerance for Harassment",
                desc: "Our platform provides instant blocking and reporting mechanisms to protect all members.",
              },
            ].map((rule) => (
              <div key={rule.title} className="flex gap-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900">{rule.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-center pt-6">
          <Link
            href="/register"
            className="rounded-xl bg-[#d31d24] px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-[#b71920]"
          >
            Create Your Skill Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
