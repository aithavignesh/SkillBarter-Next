"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ChevronDown, HelpCircle } from "lucide-react";
import { AppPageShell } from "../../../components/ui/AppPageShell";

const sections = [
  {
    id: "account",
    title: "Account",
    questions: [
      {
        question: "How do I create and verify my account?",
        answer: "Register with your email address and the required profile details. SkillBarter sends a verification link to that address. Open the link and complete the verification step before signing in.",
      },
      {
        question: "Can I sign in before verifying my email?",
        answer: "No. Email verification is required before an account can establish an authenticated session. If the message is missing, check your spam folder and request a fresh verification message from the sign-in flow.",
      },
    ],
  },
  {
    id: "exchanges",
    title: "Exchanges",
    questions: [
      {
        question: "How does a skill exchange work?",
        answer: "Add the skills you can teach and the skills you want to learn. Discover members with complementary skills, send an exchange request, agree on the exchange and schedule sessions together. After completing the exchange, both members can leave a review.",
      },
      {
        question: "Do I need to pay to use SkillBarter?",
        answer: "The core exchange model is peer-to-peer: members trade time and knowledge rather than paying one another for a lesson. Agree on the scope and time commitment before accepting an exchange.",
      },
      {
        question: "How are suggested matches calculated?",
        answer: "Suggestions use the compatibility of offered and wanted skills, learning goals and the available profile preferences. Review the proposed skill pairing with the other member before sending a request.",
      },
      {
        question: "How do scheduling and session confirmation work?",
        answer: "After an exchange is accepted, one member can propose a session with its time and details. The other member confirms or responds to the proposal. Check the exchange workspace for the current session status.",
      },
    ],
  },
  {
    id: "community",
    title: "Community & safety",
    questions: [
      {
        question: "What should I do if another member behaves inappropriately?",
        answer: "Do not continue an interaction that makes you feel unsafe. Use the reporting and blocking controls in the Safety Centre so the issue can be reviewed and the member can no longer contact you through supported blocked interactions.",
      },
      {
        question: "How do I report or block a member?",
        answer: "Open the relevant member or interaction and use the available report or block action. Include a clear reason when submitting a report. You can review the platform's safety guidance from the Safety Centre.",
      },
    ],
  },
];

export default function FAQPage() {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  return (
    <AppPageShell
      eyebrow="Help centre"
      title="Frequently asked questions"
      description="Answers about accounts, skill exchanges, scheduling and community safety."
      icon={<HelpCircle className="h-3.5 w-3.5" />}
      actions={
        <Link
          href="/support/support"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Help centre
        </Link>
      }
    >
      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`}>
            <h2 id={`${section.id}-heading`} className="mb-3 text-base font-bold text-slate-900">
              {section.title}
            </h2>
            <div className="space-y-2">
              {section.questions.map((item, index) => {
                const questionId = `${section.id}-question-${index}`;
                const panelId = `${questionId}-answer`;
                const expanded = openQuestion === questionId;
                return (
                  <article key={questionId} className="sb-surface overflow-hidden">
                    <h3>
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={panelId}
                        onClick={() => setOpenQuestion(expanded ? null : questionId)}
                        className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-700"
                      >
                        <span>{item.question}</span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`}
                          aria-hidden="true"
                        />
                      </button>
                    </h3>
                    <div id={panelId} hidden={!expanded} className="border-t border-slate-100 px-4 py-4">
                      <p className="text-sm leading-6 text-slate-600">{item.answer}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </AppPageShell>
  );
}
