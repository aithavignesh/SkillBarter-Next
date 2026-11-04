"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { PlatformStatsDto, ReportDto } from "@skillbarter/shared";
import {
  ShieldCheck,
  Users,
  ArrowLeftRight,
  BookOpen,
  AlertTriangle,
  History,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<PlatformStatsDto | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [reports, setReports] = useState<ReportDto[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [tab, setTab] = useState<"users" | "reports" | "audit">("users");
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      // Load each admin section independently so one failed endpoint does not
      // leave every dashboard table empty.
      const results = await Promise.allSettled([
        api.admin.stats(),
        api.admin.users(1),
        api.admin.reports(1),
        api.admin.auditLogs(1),
      ]);
      const [statsResult, usersResult, reportsResult, auditResult] = results;

      if (statsResult.status === "fulfilled") setStats(statsResult.value.stats);
      else console.error("Admin stats could not be loaded:", statsResult.reason);

      if (usersResult.status === "fulfilled") setUsersList(usersResult.value);
      else console.error("Admin users could not be loaded:", usersResult.reason);

      if (reportsResult.status === "fulfilled") setReports(reportsResult.value);
      else console.error("Admin reports could not be loaded:", reportsResult.reason);

      if (auditResult.status === "fulfilled") setAuditLogs(auditResult.value);
      else console.error("Admin audit logs could not be loaded:", auditResult.reason);
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "admin" && user.role !== "owner") {
        router.push("/dashboard");
        return;
      }
      fetchAdminData();
    }
  }, [user, authLoading, router]);

  const handleToggleSuspend = async (targetUser: any) => {
    const action = targetUser.isSuspended ? "restore" : "suspend";
    if (!confirm(`Are you sure you want to ${action} ${targetUser.displayName}?`)) return;

    try {
      await api.admin.updateUser(targetUser.id, {
        isSuspended: !targetUser.isSuspended,
        suspensionReason: targetUser.isSuspended ? undefined : "Suspended by admin",
      });
      await fetchAdminData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Action failed");
    }
  };

  const handleResolveReport = async (reportId: string, status: any, actionTaken: any) => {
    const notes = prompt("Enter moderation notes:");
    try {
      await api.admin.handleReport(reportId, {
        status,
        actionTaken,
        moderationNotes: notes || undefined,
      });
      await fetchAdminData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to resolve report");
    }
  };

  if (authLoading || loading) {
    return <div className="p-12 text-center text-sm text-slate-500">Loading admin portal...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
          <ShieldCheck className="h-3.5 w-3.5" /> Administrative Control Panel
        </span>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Platform Governance & Moderation</h1>
        <p className="mt-1 text-sm text-slate-500">
          Supervise user safety, resolve moderation reports, and monitor platform metrics.
        </p>
      </div>

      {/* Platform Metric Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <span className="block text-2xl font-extrabold text-slate-900">{stats.totalUsers}</span>
            <span className="text-xs text-slate-500">Total Users</span>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <span className="block text-2xl font-extrabold text-slate-900">{stats.totalExchanges}</span>
            <span className="text-xs text-slate-500">Total Exchanges</span>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <span className="block text-2xl font-extrabold text-emerald-600">
              {stats.completedExchanges}
            </span>
            <span className="text-xs text-slate-500">Completed</span>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <span className="block text-2xl font-extrabold text-[#d31d24]">
              {stats.activeSessions}
            </span>
            <span className="text-xs text-slate-500">Active Sessions</span>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <span className="block text-2xl font-extrabold text-slate-900">{stats.totalSkills}</span>
            <span className="text-xs text-slate-500">Skills Catalog</span>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 text-center shadow-sm">
            <span className="block text-2xl font-extrabold text-rose-600">
              {stats.pendingReports}
            </span>
            <span className="text-xs font-semibold text-rose-700">Pending Reports</span>
          </div>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 pt-3 gap-4 text-xs font-bold">
          <button
            onClick={() => setTab("users")}
            className={`pb-3 border-b-2 transition-all ${
              tab === "users" ? "border-[#d31d24] text-[#d31d24]" : "border-transparent text-slate-500"
            }`}
          >
            User Management ({usersList.length})
          </button>
          <button
            onClick={() => setTab("reports")}
            className={`pb-3 border-b-2 transition-all ${
              tab === "reports" ? "border-[#d31d24] text-[#d31d24]" : "border-transparent text-slate-500"
            }`}
          >
            Safety Reports ({reports.length})
          </button>
          <button
            onClick={() => setTab("audit")}
            className={`pb-3 border-b-2 transition-all ${
              tab === "audit" ? "border-[#d31d24] text-[#d31d24]" : "border-transparent text-slate-500"
            }`}
          >
            Audit Trail ({auditLogs.length})
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: USERS */}
          {tab === "users" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">User</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Email Status</th>
                    <th className="pb-3">Exchanges</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-sm text-slate-500">
                        No users returned by the admin API. Check the admin API request and database connection.
                      </td>
                    </tr>
                  ) : usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="py-3 font-bold text-slate-900">{u.displayName}</td>
                      <td className="py-3 text-slate-600">{u.email}</td>
                      <td className="py-3 uppercase text-[10px] font-bold text-red-700">{u.role === "owner" ? "Platform Owner" : u.role}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${u.isEmailVerified ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                          {u.isEmailVerified ? "Verified" : "Unverified"}
                        </span>
                      </td>
                      <td className="py-3 text-slate-700">{u.completedExchangesCount}</td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            u.isSuspended
                              ? "bg-rose-100 text-rose-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {u.isSuspended ? "Suspended" : "Active"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex flex-wrap justify-end gap-2">
                          {u.id !== user?.id && (
                            <>
                              {user?.role === "owner" && <button
                                type="button"
                                onClick={async () => {
                                  const nextRole = u.role === "admin" ? "user" : "admin";
                                  const action = nextRole === "admin" ? "grant administrator access to" : "remove administrator access from";
                                  if (!confirm(`Are you sure you want to ${action} ${u.displayName}? Admins can manage users and moderation reports.`)) return;
                                  try {
                                    await api.admin.updateUser(u.id, { role: nextRole });
                                    await fetchAdminData();
                                  } catch (err: unknown) {
                                    alert(err instanceof Error ? err.message : "Role update failed");
                                  }
                                }}
                                disabled={u.role !== "admin" && !u.isEmailVerified}
                                title={u.role !== "admin" && !u.isEmailVerified ? "Verify this teammate's email before granting admin access" : undefined}
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
                                  u.role === "admin"
                                    ? "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                    : "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                }`}
                              >
                                {u.role === "admin" ? "Remove Admin" : "Make Admin"}
                              </button>}
                              <button
                                type="button"
                                onClick={() => handleToggleSuspend(u)}
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                                  u.isSuspended
                                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                                }`}
                              >
                                {u.isSuspended ? "Restore" : "Suspend"}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: REPORTS */}
          {tab === "reports" && (
            <div className="space-y-4">
              {reports.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No reports submitted.</p>
              ) : (
                reports.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-slate-200 p-4 space-y-2 bg-slate-50/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-bold uppercase">
                        {r.targetType}: {r.reason}
                      </span>
                      <span className="text-[11px] text-slate-400">{r.status}</span>
                    </div>
                    <p className="text-xs text-slate-700">{r.description}</p>
                    <span className="text-[10px] text-slate-400 block">
                      Target ID: {r.targetId} • Reported by: {r.reporterName}
                    </span>
                    {r.status === "PENDING" && (
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleResolveReport(r.id, "RESOLVED", "account_suspended")}
                          className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-500"
                        >
                          Suspend Target & Resolve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveReport(r.id, "DISMISSED", "none")}
                          className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: AUDIT TRAIL */}
          {tab === "audit" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3">Actor</th>
                    <th className="pb-3">Action</th>
                    <th className="pb-3">Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60">
                      <td className="py-3 text-slate-400 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 font-semibold text-slate-800">{log.actorName || log.actorEmail}</td>
                      <td className="py-3 font-mono font-bold text-red-700">{log.action}</td>
                      <td className="py-3 text-slate-600">
                        {log.targetType} ({log.targetId})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
