"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../services/api";
import { AppPageShell } from "../../components/ui/AppPageShell";
import { NotificationDto } from "@skillbarter/shared";
import { Bell, CheckCheck, ArrowRight } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const data = await api.notifications.list(1);
      setNotifications(data);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to mark all read");
    }
  };

  const handleMarkOne = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {}
  };

  return (
    <AppPageShell
      eyebrow="Activity Updates"
      title="Notifications"
      icon={<Bell className="h-3.5 w-3.5" />}
      actions={notifications.some((n) => !n.read) ? <button type="button" onClick={handleMarkAllRead} className="sb-control inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"><CheckCheck className="h-4 w-4" /> Mark All as Read</button> : undefined}
    >
      <div className="space-y-6">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500" role="status">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Bell className="mx-auto mb-2 h-10 w-10 text-slate-400" aria-hidden="true" />
            <h3 className="text-base font-bold text-slate-900">All caught up!</h3>
            <p className="mt-1 text-xs text-slate-500">
              You don&apos;t have any notifications right now.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <article
                key={n.id}
                className={`flex items-start justify-between gap-4 rounded-2xl border p-5 transition-colors ${
                  n.read
                    ? "border-slate-200 bg-white text-slate-700"
                    : "border-red-200 bg-red-50/70 text-slate-900 shadow-sm"
                }`}
              >
                <button
                  type="button"
                  onClick={() => void handleMarkOne(n.id)}
                  disabled={n.read}
                  aria-label={n.read ? `${n.title}, already read` : `Mark ${n.title} as read`}
                  className="min-w-0 flex-1 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 disabled:cursor-default disabled:focus-visible:ring-0"
                >
                  <span className="block space-y-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{n.title}</span>
                      {!n.read && (
                        <span
                          className="h-2 w-2 rounded-full bg-red-600"
                          aria-label="Unread"
                          role="img"
                        />
                      )}
                    </span>
                    <span className="block text-xs leading-relaxed text-slate-600">
                      {n.message}
                    </span>
                    <time
                      className="block pt-1 text-[10px] text-slate-400"
                      dateTime={n.createdAt}
                    >
                      {new Date(n.createdAt).toLocaleString()}
                    </time>
                  </span>
                </button>

                {n.link && (
                  <Link
                    href={n.link}
                    aria-label={`View ${n.title}`}
                    className="flex min-h-10 shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
                  >
                    View <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </AppPageShell>
  );
}
