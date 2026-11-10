"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../services/api";
import { AppPageShell } from "../../components/ui/AppPageShell";
import { useAuth } from "../../context/AuthContext";
import { ExchangeDto } from "@skillbarter/shared";
import { ArrowLeftRight, AlertCircle, ArrowRight, CalendarDays } from "lucide-react";

export default function ExchangesListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;
  const [exchanges, setExchanges] = useState<ExchangeDto[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [direction, setDirection] = useState<"ALL" | "INCOMING" | "SENT">("ALL");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const requestIdRef = useRef(0);

  const loadExchanges = async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setLoadError(false);
    try {
      const res = await api.exchanges.list();
      if (requestId === requestIdRef.current) setExchanges(res.exchanges);
    } catch {
      if (requestId === requestIdRef.current) setLoadError(true);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    const syncDirectionFromUrl = () => {
      const view = new URLSearchParams(window.location.search).get("view");
      if (view === "incoming" || view === "sent") {
        setDirection(view === "incoming" ? "INCOMING" : "SENT");
        setFilter("PENDING");
      } else {
        setDirection("ALL");
        setFilter("ALL");
      }
    };

    syncDirectionFromUrl();
    window.addEventListener("popstate", syncDirectionFromUrl);
    return () => window.removeEventListener("popstate", syncDirectionFromUrl);
  }, []);

  function selectDirection(next: "ALL" | "INCOMING" | "SENT") {
    setDirection(next);
    setFilter(next === "ALL" ? "ALL" : "PENDING");
    const query = next === "ALL" ? "" : "?view=" + next.toLowerCase();
    router.replace("/exchanges" + query, { scroll: false });
  }

  useEffect(() => {
    if (!userId) {
      setExchanges([]);
      setLoading(false);
      setLoadError(false);
      requestIdRef.current += 1;
      return;
    }

    void loadExchanges();
    return () => {
      requestIdRef.current += 1;
    };
  }, [userId]);

  const directionFiltered = exchanges.filter((exchange) => {
    if (direction === "INCOMING") return exchange.recipientId === userId;
    if (direction === "SENT") return exchange.requesterId === userId;
    return true;
  });
  const filtered = directionFiltered.filter((e) => {
    if (filter === "ALL") return true;
    if (filter === "PENDING") return e.status === "PENDING";
    if (filter === "ACTIVE") return ["ACCEPTED", "SCHEDULED", "IN_PROGRESS"].includes(e.status);
    if (filter === "COMPLETED") return e.status === "COMPLETED";
    if (filter === "CANCELLED") return ["CANCELLED", "REJECTED", "DISPUTED"].includes(e.status);
    return true;
  });
  const incomingCount = exchanges.filter((exchange) => exchange.recipientId === userId && exchange.status === "PENDING").length;
  const sentCount = exchanges.filter((exchange) => exchange.requesterId === userId && exchange.status === "PENDING").length;

  return (
    <AppPageShell
      eyebrow="Lifecycle Management"
      title="Your Skill Exchanges"
      description={direction === "INCOMING" ? "Review pending skill exchange requests sent to you." : direction === "SENT" ? "Track the skill exchange requests you have sent to other members." : "Track incoming and sent requests, scheduled lessons, and completed exchange milestones."}
      icon={<ArrowLeftRight className="h-3.5 w-3.5" />}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/exchanges/calendar" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">
            <CalendarDays className="h-4 w-4" aria-hidden="true" /> Calendar
          </Link>
          <Link href="/discover" className="sb-button-primary inline-flex min-h-11 items-center gap-1.5 px-4 py-2.5 text-xs">
            <ArrowLeftRight className="h-4 w-4" /> Start New Exchange
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
      <section aria-label="Exchange request direction" className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Request inbox</h2>
        <div className="flex flex-wrap gap-2">
          {([
            { value: "ALL", label: "All exchanges" },
            { value: "INCOMING", label: "Incoming requests (" + incomingCount + ")" },
            { value: "SENT", label: "Sent requests (" + sentCount + ")" },
          ] as const).map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={direction === tab.value}
              onClick={() => selectDirection(tab.value)}
              className={`min-h-10 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                direction === tab.value
                  ? "bg-red-700 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Status filters */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        {["ALL", "PENDING", "ACTIVE", "COMPLETED", "CANCELLED"].map((tab) => (
          <button
            key={tab}
            type="button"
            aria-pressed={filter === tab}
            onClick={() => setFilter(tab)}
            className={`rounded-xl px-4 py-2 transition-all ${
              filter === tab
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500">Loading your exchanges...</div>
      ) : loadError ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-white p-10 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-600" />
          <h2 className="font-bold text-slate-900">Couldn&apos;t load your exchanges</h2>
          <p className="mt-2 text-sm text-slate-600">The exchange service may be temporarily unavailable. You can retry without leaving this page.</p>
          <button type="button" onClick={() => void loadExchanges()} className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">{loading ? "Retrying..." : "Try again"}</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <ArrowLeftRight className="mx-auto h-10 w-10 text-slate-400 mb-2" />
          <h3 className="text-base font-bold text-slate-900">{direction === "INCOMING" ? "No incoming requests found" : direction === "SENT" ? "No sent requests found" : "No exchanges found"}</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            You don&apos;t have any exchanges in this category. Browse skills to initiate an exchange!
          </p>
          <Link
            href="/discover"
            className="inline-block mt-4 rounded-xl bg-red-700 px-5 py-2 text-xs font-semibold text-white"
          >
            Discover Matches
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((ex) => {
            const isRequester = ex.requesterId === user?.id;
            const otherName = isRequester ? ex.recipientName : ex.requesterName;

            return (
              <Link
                key={ex.id}
                href={`/exchanges/${ex.id}`}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-red-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        ex.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700"
                          : ex.status === "PENDING"
                          ? "bg-amber-50 text-amber-700"
                          : ex.status === "CANCELLED"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {ex.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(ex.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-bold text-slate-900">
                    With {otherName || "Peer"}
                  </h3>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-slate-500 block">Offered:</span>
                      <span className="font-semibold text-slate-900">{ex.offeredSkillName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Wanted:</span>
                      <span className="font-semibold text-slate-900">{ex.wantedSkillName}</span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-600 line-clamp-2 italic">
                    &ldquo;{ex.proposalDescription}&rdquo;
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-red-700">
                  <span>View Details & Actions</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
    </AppPageShell>
  );
}
