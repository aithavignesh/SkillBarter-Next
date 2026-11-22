"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "../../services/api";
import { AppPageShell } from "../../components/ui/AppPageShell";
import { useAuth } from "../../context/AuthContext";
import { NotificationDto } from "@skillbarter/shared";
import { Bell, CheckCheck, ArrowRight, RefreshCw } from "lucide-react";

type NotificationPreferences = {
  requests: boolean;
  messages: boolean;
  sessions: boolean;
  community: boolean;
};

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  requests: true,
  messages: true,
  sessions: true,
  community: false,
};

const NOTIFICATION_PREFERENCE_OPTIONS: {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}[] = [
  { key: "requests", label: "Requests", description: "Updates when another member sends or responds to an exchange request." },
  { key: "messages", label: "Messages", description: "Updates about new messages in your conversations." },
  { key: "sessions", label: "Sessions", description: "Reminders and changes to scheduled exchange sessions." },
  { key: "community", label: "Community", description: "Updates about community posts and replies." },
];

export default function NotificationsPage() {
  return (
    <Suspense fallback={<AppPageShell eyebrow="Activity Updates" title="Notifications" icon={<Bell className="h-3.5 w-3.5" />}><div role="status" className="p-12 text-center text-sm text-slate-500">Loading notifications...</div></AppPageShell>}>
      <NotificationsPageContent />
    </Suspense>
  );
}

function NotificationsPageContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") === "settings" ? "settings" : "activity";
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [preferencesSaved, setPreferencesSaved] = useState(false);
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

  useEffect(() => {
    if (!user?.id) {
      setPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
      return;
    }

    const storageKey = "skillbarter:notification-preferences:" + user.id;
    try {
      const stored = window.localStorage.getItem(storageKey);
      setPreferences(stored
        ? { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(stored) }
        : DEFAULT_NOTIFICATION_PREFERENCES);
    } catch {
      setPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
    }
    setPreferencesSaved(false);
  }, [user?.id]);

  const handleSavePreferences = () => {
    if (!user?.id) {
      setActionError("Sign in to save notification preferences.");
      return;
    }

    try {
      window.localStorage.setItem(
        "skillbarter:notification-preferences:" + user.id,
        JSON.stringify(preferences),
      );
      setActionError(null);
      setPreferencesSaved(true);
    } catch {
      setPreferencesSaved(false);
      setActionError("These preferences could not be saved in this browser.");
    }
  };

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
      title={view === "settings" ? "Notification preferences" : "Notifications"}
      description={view === "settings" ? "Choose which activity updates you want to keep visible on this browser." : undefined}
      icon={<Bell className="h-3.5 w-3.5" />}
      actions={
        view === "activity" && hasUnread ? (
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
        <nav aria-label="Notification views" className="flex flex-wrap gap-2">
          <Link href="/notifications" aria-current={view === "activity" ? "page" : undefined} className={view === "activity" ? "inline-flex min-h-10 items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white" : "inline-flex min-h-10 items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"}>Activity history</Link>
          <Link href="/notifications?view=settings" aria-current={view === "settings" ? "page" : undefined} className={view === "settings" ? "inline-flex min-h-10 items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white" : "inline-flex min-h-10 items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"}>Preferences</Link>
        </nav>
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

        {view === "settings" ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="notification-preferences-heading">
            <div>
              <h2 id="notification-preferences-heading" className="text-lg font-bold text-slate-900">Choose your notification categories</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Choose the activity categories you want to keep visible in your notification experience.</p>
              <p className="mt-2 text-xs leading-5 text-amber-800">These settings are saved in this browser for your account. Server-side email and SMS delivery preferences are not connected yet.</p>
            </div>
            <div className="mt-5 space-y-3">
              {NOTIFICATION_PREFERENCE_OPTIONS.map((option) => (
                <label key={option.key} htmlFor={"notification-preference-" + option.key} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900">{option.label}</span>
                    <span className="mt-1 block text-sm leading-5 text-slate-600">{option.description}</span>
                  </span>
                  <input
                    id={"notification-preference-" + option.key}
                    type="checkbox"
                    checked={preferences[option.key]}
                    onChange={(event) => {
                      setPreferences((current) => ({ ...current, [option.key]: event.target.checked }));
                      setPreferencesSaved(false);
                    }}
                    className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-red-700 focus:ring-2 focus:ring-red-700 focus:ring-offset-2"
                  />
                </label>
              ))}
            </div>
            {preferencesSaved && <p className="mt-4 text-sm text-emerald-700" role="status" aria-live="polite">Preferences saved on this browser.</p>}
            <div className="mt-5 flex justify-end">
              <button type="button" onClick={handleSavePreferences} className="inline-flex min-h-11 items-center rounded-xl bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">Save preferences</button>
            </div>
          </section>
        ) : (loading ? (
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
        ))}

      </div>
    </AppPageShell>
  );
}
