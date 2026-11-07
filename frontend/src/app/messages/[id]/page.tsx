"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppPageShell } from "../../../components/ui/AppPageShell";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../services/api";
import { AlertCircle, MessageSquare } from "lucide-react";

export default function LegacyConversationRedirect() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const startedForPartner = useRef<string | null>(null);
  const partnerId = params.id;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!user.isEmailVerified) {
      router.replace(
        user.onboardingCompleted
          ? `/verify-email?email=${encodeURIComponent(user.email)}`
          : "/onboarding"
      );
      return;
    }
    if (!partnerId || partnerId === user.id) {
      router.replace("/messages");
      return;
    }
    if (startedForPartner.current === partnerId) return;

    startedForPartner.current = partnerId;
    setError(null);
    void api.messages
      .getOrCreateConversation(partnerId)
      .then((result) => {
        router.replace(`/messages?c=${encodeURIComponent(result.conversation.id)}`);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Unable to open this conversation.");
      });
  }, [authLoading, partnerId, router, user]);

  return (
    <AppPageShell
      eyebrow="Direct messages"
      title="Opening conversation"
      description="Connecting you to the member from this conversation link."
      icon={<MessageSquare className="h-4 w-4" aria-hidden="true" />}
    >
      {error ? (
        <section className="rounded-2xl border border-red-200 bg-white p-6" role="alert">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden="true" />
            <div>
              <h2 className="font-semibold text-slate-900">Conversation unavailable</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{error}</p>
              <Link href="/messages" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">
                Open messages
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600" role="status" aria-live="polite">
          Opening your conversation…
        </div>
      )}
    </AppPageShell>
  );
}
