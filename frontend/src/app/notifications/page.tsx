"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../services/api";
import { AppPageShell } from "../../components/ui/AppPageShell";
import { NotificationDto } from "@skillbarter/shared";
import { Bell, CheckCheck, ArrowRight, RefreshCw } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [markingIds, setMarkingIds] = useState<string[]>([]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api.notifications.list(1);
      setNotifications(data);
    } catch (error: unknown) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "We couldn’t load your notifications. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    if (markingAllRead) return;
    setMarkingAllRead(true);
    setActionError(null);
    try {
      await api.notifications.markAllRead();
      setNotifications((previous) =>
        previous.map((notification) => ({ ...notification, read: true }))
      );
    } catch (error: unknown) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Couldn’t mark all notifications as read. Please try again."
      );
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleMarkOne = async (id: string) => {
    if (markingIds.includes(id)) return;
    setMarkingIds((previous) => [...previous, id]);
    setActionError(null);
    try {
      await api.notifications.markRead(id);
      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (error: unknown) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Couldn’t update that notification. Please try again."
      );
    } finally {
      setMarkingIds((previous) => previous.filter((item) => item !== id));
    }
  };

  const hasUnread = notifications.some((notification) => !notification.read);

  return (
    <AppPageShell
      eyebrow="Activity Updates"
      title="Notifications"
      icon={<Bell className="h-3.5 w-3.5" />}
      actions={
        hasUnread ? (
          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            disabled={markingAllRead}
            className="sb-control inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCheck className="h-4 w-4" />
            {markingAllRead ? "Updating..." : "Mark All as Read"}
          </button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {actionError && (
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <p>{actionError}</p>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="rounded-lg px-2 py-1 font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500" role="status">
            Loading notifications...
          </div>
        ) : loadError ? (
          <div className="rounded-3xl border border-red-200 bg-white p-10 text-center">
            <Bell className="mx-auto mb-3 h-10 w-10 text-red-400" aria-hidden="true" />
            <h3 className="text-base font-bold text-slate-900">
              Notifications couldn’t be loaded
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{loadError}</p>
            <button
              type="button"
              onClick={() => void fetchNotifications()}
              className="sb-control mt-5 inline-flex min-h-10 items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
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
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`flex items-start justify-between gap-4 rounded-2xl border p-5 transition-colors ${
                  notification.read
                    ? "border-slate-200 bg-white text-slate-700"
                    : "border-red-200 bg-red-50/70 text-slate-900 shadow-sm"
                }`}
              >
                <button
                  type="button"
                  onClick={() => void handleMarkOne(notification.id)}
                  disabled={notification.read || markingIds.includes(notification.id)}
                  aria-label={
                    notification.read
                      ? `${notification.title}, already read`
                      : `Mark ${notification.title} as read`
                  }
                  className="min-w-0 flex-1 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 disabled:cursor-default disabled:focus-visible:ring-0"
                >
                  <span className="block space-y-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {notification.title}
                      </span>
                      {!notification.read && (
                        <span
                          className="h-2 w-2 rounded-full bg-red-600"
                          aria-label="Unread"
                          role="img"
                        />
                      )}
                      {markingIds.includes(notification.id) && (
                        <span className="text-xs text-slate-500" role="status">
                          Updating...
                        </span>
                      )}
                    </span>
                    <span className="block text-xs leading-relaxed text-slate-600">
                      {notification.message}
                    </span>
                    <time
                      className="block pt-1 text-[10px] text-slate-400"
                      dateTime={notification.createdAt}
                    >
                      {new Date(notification.createdAt).toLocaleString()}
                    </time>
                  </span>
                </button>

                {notification.link && (
                  <Link
                    href={notification.link}
                    aria-label={`View ${notification.title}`}
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
