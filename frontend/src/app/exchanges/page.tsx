"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { ExchangeDto } from "@skillbarter/shared";
import { ArrowLeftRight, Clock, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

export default function ExchangesListPage() {
  const { user } = useAuth();
  const [exchanges, setExchanges] = useState<ExchangeDto[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
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
    if (!user) {
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
  }, [user?.id]);

  const filtered = exchanges.filter((e) => {
    if (filter === "ALL") return true;
    if (filter === "PENDING") return e.status === "PENDING";
    if (filter === "ACTIVE") return ["ACCEPTED", "SCHEDULED", "IN_PROGRESS"].includes(e.status);
    if (filter === "COMPLETED") return e.status === "COMPLETED";
    if (filter === "CANCELLED") return ["CANCELLED", "REJECTED", "DISPUTED"].includes(e.status);
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-700">
            Lifecycle Management
          </span>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Your Skill Exchanges</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track active requests, scheduled lessons, and completed exchange milestones.
          </p>
        </div>

        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 rounded-xl bg-red-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-600 shadow-sm"
        >
          <ArrowLeftRight className="h-4 w-4" /> Start New Exchange
        </Link>
      </div>

      {/* Filter Tabs */}
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
          <h3 className="text-base font-bold text-slate-900">No exchanges found</h3>
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
  );
}
