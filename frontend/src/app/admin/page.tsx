"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { PlatformStatsDto, ReportDto } from "@skillbarter/shared";
import { ShieldCheck } from "lucide-react";

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<PlatformStatsDto | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [reports, setReports] = useState<ReportDto[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [tab, setTab] = useState<"overview" | "users" | "reports" | "audit">("overview");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [reportStatusFilter, setReportStatusFilter] = useState("all");
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [auditFromDate, setAuditFromDate] = useState("");
  const [auditToDate, setAuditToDate] = useState("");
  const [usersPage, setUsersPage] = useState(1);
  const [reportsPage, setReportsPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [usersMeta, setUsersMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [reportsMeta, setReportsMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [auditMeta, setAuditMeta] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });

  useEffect(() => {
    const section = searchParams.get("section");
    if (section === "reports" || section === "audit" || section === "users" || section === "overview") setTab(section);
    else setTab("overview");
  }, [searchParams]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = useCallback(async () => {
    try {
      // Load each admin section independently so one failed endpoint does not
      // leave every dashboard table empty.
      const results = await Promise.allSettled([
        api.admin.stats(),
        api.admin.users(usersPage, userSearch.trim() || undefined, userRoleFilter),
        api.admin.reports(reportsPage, reportStatusFilter),
        api.admin.auditLogs(auditPage, auditActionFilter === "all" ? undefined : auditActionFilter, auditFromDate || undefined, auditToDate || undefined),
      ]);
      const [statsResult, usersResult, reportsResult, auditResult] = results;

      if (statsResult.status === "fulfilled") setStats(statsResult.value.stats);
      else console.error("Admin stats could not be loaded:", statsResult.reason);

      if (usersResult.status === "fulfilled") { setUsersList(usersResult.value.items); setUsersMeta(usersResult.value.meta); }
      else console.error("Admin users could not be loaded:", usersResult.reason);

      if (reportsResult.status === "fulfilled") { setReports(reportsResult.value.items); setReportsMeta(reportsResult.value.meta); }
      else console.error("Admin reports could not be loaded:", reportsResult.reason);

      if (auditResult.status === "fulfilled") { setAuditLogs(auditResult.value.items); setAuditMeta(auditResult.value.meta); }
      else console.error("Admin audit logs could not be loaded:", auditResult.reason);
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [auditActionFilter, auditFromDate, auditPage, auditToDate, reportStatusFilter, reportsPage, userRoleFilter, userSearch, usersPage]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "admin" && user.role !== "owner") {
        router.push("/dashboard");
        return;
      }
      fetchAdminData();
    }
  }, [user, authLoading, router, fetchAdminData]);


  const changeUsersPage = async (nextPage: number) => {
    const result = await api.admin.users(nextPage, userSearch.trim() || undefined, userRoleFilter);
    setUsersList(result.items); setUsersMeta(result.meta); setUsersPage(nextPage);
  };
  const changeReportsPage = async (nextPage: number) => {
    const result = await api.admin.reports(nextPage, reportStatusFilter);
    setReports(result.items); setReportsMeta(result.meta); setReportsPage(nextPage);
  };
  const changeAuditPage = async (nextPage: number) => {
    const result = await api.admin.auditLogs(nextPage, auditActionFilter === "all" ? undefined : auditActionFilter, auditFromDate || undefined, auditToDate || undefined);
    setAuditLogs(result.items); setAuditMeta(result.meta); setAuditPage(nextPage);
  };
  const pagination = (meta: { page: number; totalPages: number; total: number }, onPage: (page: number) => void) => (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
      <span>{"Showing page " + meta.page + " of " + Math.max(meta.totalPages, 1) + " · " + meta.total + " records"}</span>
      <div className="flex gap-2">
        <button type="button" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
        <button type="button" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
      </div>
    </div>
  );

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

      {/* Main website navigation controls the active admin section. */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">{tab === "overview" ? "Overview" : tab === "users" ? "People" : tab === "reports" ? "Safety Reports" : "Audit Trail"}</h2>
          <p className="mt-1 text-xs text-slate-500">{tab === "overview" ? "A quick view of platform moderation and recent administrative activity." : tab === "users" ? "Manage platform members and their access." : tab === "reports" ? "Review and resolve community safety reports." : "Review administrative activity across the platform."}</p>
        </div>
        <div className="p-6">
          {/* ADMIN OVERVIEW */}
          {tab === "overview" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Pending moderation</h3>
                    <p className="text-xs text-slate-500">Reports that still need review.</p>
                  </div>
                  <Link href="/admin?section=reports" className="text-xs font-semibold text-red-700 hover:text-red-800">View all reports</Link>
                </div>
                {reports.filter((report) => report.status === "PENDING").length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">No pending reports in the latest results.</div>
                ) : (
                  reports.filter((report) => report.status === "PENDING").slice(0, 5).map((report) => (
                    <div key={report.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold uppercase text-rose-700">{report.targetType}: {report.reason}</span>
                        <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">Pending</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-700">{report.description}</p>
                      <p className="mt-2 text-[11px] text-slate-400">Reported by {report.reporterName || "Community member"}</p>
                    </div>
                  ))
                )}
              </section>
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Recent admin activity</h3>
                    <p className="text-xs text-slate-500">Latest recorded governance actions.</p>
                  </div>
                  <Link href="/admin?section=audit" className="text-xs font-semibold text-red-700 hover:text-red-800">Open audit trail</Link>
                </div>
                {auditLogs.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">No administrative activity has been recorded yet.</div>
                ) : (
                  auditLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-slate-800">{log.actorName || log.actorEmail || "Administrator"}</span>
                        <time className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</time>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-red-700">{log.action}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{log.targetType} · {log.targetId}</p>
                    </div>
                  ))
                )}
              </section>
            </div>
          )}

          {/* TAB 1: USERS */}
          {tab === "users" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  aria-label="Search people by name or email"
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") fetchAdminData(); }}
                  placeholder="Search by name or email..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
                <select
                  aria-label="Filter people by role"
                  value={userRoleFilter}
                  onChange={(event) => setUserRoleFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="all">All roles</option>
                  <option value="user">Users</option>
                  <option value="admin">Admins</option>
                  <option value="owner">Platform Owner</option>
                </select>
                <button type="button" onClick={() => { setUsersPage(1); api.admin.users(1, userSearch.trim() || undefined, userRoleFilter).then((result) => { setUsersList(result.items); setUsersMeta(result.meta); }).catch((err) => alert(err instanceof Error ? err.message : "Could not load users")); }} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">Search</button>
              </div>
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
              {pagination(usersMeta, changeUsersPage)}
            </div>
          )}

          {/* TAB 2: REPORTS */}
          {tab === "reports" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <select
                  aria-label="Filter reports by status"
                  value={reportStatusFilter}
                  onChange={(event) => { setReportStatusFilter(event.target.value); }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="all">All reports</option>
                  <option value="PENDING">Pending</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="DISMISSED">Dismissed</option>
                </select>
                <button type="button" onClick={() => { setReportsPage(1); api.admin.reports(1, reportStatusFilter).then((result) => { setReports(result.items); setReportsMeta(result.meta); }).catch((err) => alert(err instanceof Error ? err.message : "Could not load reports")); }} className="ml-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50">Apply</button>
              </div>
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
              {pagination(reportsMeta, changeReportsPage)}
            </div>
          )}

          {/* TAB 3: AUDIT TRAIL */}
          {tab === "audit" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <select
                  aria-label="Filter audit actions"
                  value={auditActionFilter}
                  onChange={(event) => setAuditActionFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="all">All actions</option>
                  <option value="ADMIN_UPDATE_USER">User account updates</option>
                  <option value="ADMIN_RESOLVE_REPORT">Report moderation</option>
                </select>
                <input
                  aria-label="Audit start date"
                  type="date"
                  value={auditFromDate}
                  max={auditToDate || undefined}
                  onChange={(event) => setAuditFromDate(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                />
                <input
                  aria-label="Audit end date"
                  type="date"
                  value={auditToDate}
                  min={auditFromDate || undefined}
                  onChange={(event) => setAuditToDate(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                />
                <button type="button" onClick={() => { setAuditPage(1); api.admin.auditLogs(1, auditActionFilter === "all" ? undefined : auditActionFilter, auditFromDate || undefined, auditToDate || undefined).then((result) => { setAuditLogs(result.items); setAuditMeta(result.meta); }).catch((err) => alert(err instanceof Error ? err.message : "Could not load audit logs")); }} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">Apply filters</button>
              </div>
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
              {pagination(auditMeta, changeAuditPage)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-slate-500">Loading admin section...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
