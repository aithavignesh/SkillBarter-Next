"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { ExchangeDto, NotificationDto } from "@skillbarter/shared";
import {
  Compass,
  ArrowLeftRight,
  MessageSquare,
  Award,
  Clock,
  ArrowRight,
  Plus,
  BookOpen,
  CheckCircle2,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [exchanges, setExchanges] = useState<ExchangeDto[]>([]);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadDashboard = async () => {
    setLoadError(false);
    const [exchangeResult, notificationResult] = await Promise.allSettled([
      api.exchanges.list(),
      api.notifications.list(1),
    ]);

    if (exchangeResult.status === "fulfilled") {
      setExchanges(exchangeResult.value.exchanges);
    }
    if (notificationResult.status === "fulfilled") {
      setNotifications(notificationResult.value.slice(0, 3));
    }
    setLoadError(
      exchangeResult.status === "rejected" ||
      notificationResult.status === "rejected"
    );
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user && !user.onboardingCompleted) {
      router.push("/onboarding");
      return;
    }

    if (user) {
      void loadDashboard();
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm font-medium text-slate-500">Loading your dashboard...</div>
      </div>
    );
  }

  const activeExchanges = exchanges.filter((e) =>
    ["PENDING", "ACCEPTED", "SCHEDULED", "IN_PROGRESS"].includes(e.status)
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {loadError && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-red-800">Some dashboard data couldn't be loaded.</p>
            <p className="mt-1 text-sm text-red-700">Your account is still available. Retry to load exchanges and notifications.</p>
          </div>
          <button type="button" onClick={() => { setLoading(true); void loadDashboard(); }} className="shrink-0 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">Retry</button>
        </div>
      )}
      {/* Top Welcome Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-red-700">
              Welcome Back
            </span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">
              Hello, {user?.displayName}!
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Ready to learn and share skills today?
            </p>
          </div>

          <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-6">
            <div className="text-center">
              <span className="block text-xl font-extrabold text-slate-900">
                ★ {user?.reputationScore.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500">Reputation</span>
            </div>
            <div className="text-center">
              <span className="block text-xl font-extrabold text-slate-900">
                {user?.completedExchangesCount}
              </span>
              <span className="text-xs text-slate-500">Completed</span>
            </div>
          </div>
        </div>

        {/* Quick action cards */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/discover"
            className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-red-50 hover:border-red-200 transition-all text-center"
          >
            <Compass className="h-6 w-6 text-red-700 mb-2" />
            <span className="text-sm font-bold text-slate-900">Find Matches</span>
            <span className="text-[11px] text-slate-500">Explore complementary skills</span>
          </Link>

          <Link
            href="/exchanges"
            className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-red-50 hover:border-red-200 transition-all text-center"
          >
            <ArrowLeftRight className="h-6 w-6 text-red-700 mb-2" />
            <span className="text-sm font-bold text-slate-900">Exchanges</span>
            <span className="text-[11px] text-slate-500">{activeExchanges.length} ongoing</span>
          </Link>

          <Link
            href="/messages"
            className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-red-50 hover:border-red-200 transition-all text-center"
          >
            <MessageSquare className="h-6 w-6 text-red-700 mb-2" />
            <span className="text-sm font-bold text-slate-900">Messages</span>
            <span className="text-[11px] text-slate-500">Direct peer chats</span>
          </Link>

          <Link
            href="/skills"
            className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-red-50 hover:border-red-200 transition-all text-center"
          >
            <BookOpen className="h-6 w-6 text-red-700 mb-2" />
            <span className="text-sm font-bold text-slate-900">My Skills</span>
            <span className="text-[11px] text-slate-500">Manage teach / learn</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Active Exchanges & Recent Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Active Exchanges */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Active Skill Exchanges</h2>
            <Link
              href="/exchanges"
              className="text-xs font-semibold text-red-700 hover:text-red-700 flex items-center gap-1"
            >
              View all ({exchanges.length}) <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {activeExchanges.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <ArrowLeftRight className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No active exchanges yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Discover members teaching skills you want to learn and send your first exchange proposal!
              </p>
              <Link
                href="/discover"
                className="inline-flex items-center gap-1.5 mt-4 rounded-xl bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600"
              >
                <Compass className="h-3.5 w-3.5" /> Discover Matches
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeExchanges.slice(0, 4).map((ex) => (
                <Link
                  key={ex.id}
                  href={`/exchanges/${ex.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-indigo-300 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold bg-red-50 text-red-700">
                      {ex.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(ex.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-slate-500">Offered:</span>
                      <p className="font-semibold text-slate-900">{ex.offeredSkillName || "Skill"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Wanted in return:</span>
                      <p className="font-semibold text-slate-900">{ex.wantedSkillName || "Skill"}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-slate-600 line-clamp-1 italic">
                    &ldquo;{ex.proposalDescription}&rdquo;
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Recent Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Notifications</h2>
            <Link
              href="/notifications"
              className="text-xs font-semibold text-red-700 hover:text-red-700"
            >
              See all
            </Link>
          </div>

          {notifications.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
              No new notifications.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link || "/notifications"}
                  className={`block rounded-2xl border p-4 text-xs transition-all ${
                    n.read ? "border-slate-200 bg-white text-slate-600" : "border-red-200 bg-red-50/60 text-slate-900 font-medium"
                  }`}
                >
                  <div className="font-semibold">{n.title}</div>
                  <div className="mt-1 text-slate-600 line-clamp-2">{n.message}</div>
                  <div className="mt-2 text-[10px] text-slate-400">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
