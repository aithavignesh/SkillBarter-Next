"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "../../../services/api";
import { AppPageShell } from "../../../components/ui/AppPageShell";
import { useAuth } from "../../../context/AuthContext";
import { ExchangeDto, ExchangeSessionDto } from "@skillbarter/shared";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

type CalendarEntry = {
  exchange: ExchangeDto;
  session: ExchangeSessionDto;
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Time to be confirmed"
    : date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function statusClass(status: ExchangeSessionDto["status"]): string {
  if (status === "CONFIRMED") return "bg-emerald-50 text-emerald-800";
  if (status === "CANCELLED") return "bg-rose-50 text-rose-800";
  if (status === "COMPLETED") return "bg-slate-100 text-slate-700";
  return "bg-amber-50 text-amber-800";
}

export default function ExchangeCalendarPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    setWarning(null);

    try {
      const { exchanges } = await api.exchanges.list();
      const results = await Promise.allSettled(
        exchanges.map(async (exchange) => {
          const result = await api.exchanges.listSessions(exchange.id);
          return result.sessions.map((session) => ({ exchange, session }));
        }),
      );

      const nextEntries = results.flatMap((result) =>
        result.status === "fulfilled" ? result.value : [],
      );
      nextEntries.sort(
        (left, right) =>
          new Date(left.session.startTime).getTime() -
          new Date(right.session.startTime).getTime(),
      );

      setEntries(nextEntries);
      if (results.some((result) => result.status === "rejected")) {
        setWarning("Some exchange sessions could not be loaded. Refresh to try again.");
      }
    } catch (err: unknown) {
      setEntries([]);
      setError(err instanceof Error ? err.message : "Unable to load your exchange calendar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) void loadSessions();
  }, [loadSessions, userId]);

  const entriesByDate = useMemo(() => {
    const grouped = new Map<string, CalendarEntry[]>();
    for (const entry of entries) {
      const key = dateKey(new Date(entry.session.startTime));
      const dayEntries = grouped.get(key) ?? [];
      dayEntries.push(entry);
      grouped.set(key, dayEntries);
    }
    return grouped;
  }, [entries]);

  const calendarDays = useMemo(() => {
    const firstWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

    return Array.from({ length: cellCount }, (_, index) => {
      const day = index - firstWeekday + 1;
      return day < 1 || day > daysInMonth
        ? null
        : new Date(month.getFullYear(), month.getMonth(), day);
    });
  }, [month]);

  const selectedEntries = entriesByDate.get(dateKey(selectedDate)) ?? [];
  const monthTitle = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const todayKey = dateKey(new Date());

  function changeMonth(offset: number) {
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(nextMonth);
    setSelectedDate(nextMonth);
  }

  function selectToday() {
    const today = new Date();
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  }

  function participantName(exchange: ExchangeDto): string {
    return exchange.requesterId === userId
      ? exchange.recipientName || "Your exchange partner"
      : exchange.requesterName || "Your exchange partner";
  }

  return (
    <AppPageShell
      eyebrow="Exchange planning"
      title="Exchange Calendar"
      description="See proposed, confirmed and completed sessions from your real SkillBarter exchanges."
      icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
      actions={
        <Link
          href="/exchanges"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
        >
          All exchanges <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      }
    >
      {warning && (
        <p role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {warning}
        </p>
      )}

      {error ? (
        <section role="alert" className="rounded-2xl border border-red-200 bg-white p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden="true" />
            <div>
              <h2 className="font-semibold text-slate-900">Your calendar could not be loaded</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{error}</p>
              <button
                type="button"
                onClick={() => void loadSessions()}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" /> Retry
              </button>
            </div>
          </div>
        </section>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.85fr)]">
          <section aria-label="Monthly exchange calendar" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  aria-label="Previous month"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <h2 id="calendar-month-title" className="min-w-36 text-center text-base font-bold text-slate-900 sm:text-lg">
                  {monthTitle}
                </h2>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  aria-label="Next month"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <button
                type="button"
                onClick={selectToday}
                className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
              >
                Today
              </button>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1" aria-labelledby="calendar-month-title">
              {weekdays.map((day) => (
                <div key={day} className="py-2 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {day}
                </div>
              ))}
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={"empty-" + index} aria-hidden="true" className="min-h-16 rounded-lg sm:min-h-24" />;
                }

                const key = dateKey(date);
                const dayEntries = entriesByDate.get(key) ?? [];
                const isSelected = key === dateKey(selectedDate);
                const isToday = key === todayKey;

                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedDate(date)}
                    className={[
                      "flex min-h-16 min-w-0 flex-col items-start rounded-lg border p-1.5 text-left transition-colors sm:min-h-24 sm:p-2",
                      isSelected ? "border-red-600 bg-red-50" : "border-slate-100 hover:border-slate-300 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <span className={[
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                      isToday ? "bg-slate-900 text-white" : "text-slate-700",
                    ].join(" ")} id={"calendar-day-" + key}>
                      {date.getDate()}
                    </span>
                    <span
                      id={"calendar-count-" + key}
                      className={dayEntries.length > 0
                        ? "mt-1 max-w-full truncate text-[10px] font-semibold text-red-700 sm:text-xs"
                        : "sr-only"}
                    >
                      {dayEntries.length} {dayEntries.length === 1 ? "session" : "sessions"}
                    </span>
                    <span id={"calendar-date-" + key} className="sr-only">
                      {formatDate(date)}
                    </span>
                    {dayEntries.length > 0 && (
                      <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 rounded-full bg-red-600" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-600" /> Scheduled session</span>
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-slate-900" /> Today</span>
            </div>
          </section>

          <section aria-labelledby="selected-day-heading" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-red-700">Selected day</p>
                <h2 id="selected-day-heading" className="mt-1 text-lg font-bold text-slate-900">
                  {formatDate(selectedDate)}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => void loadSessions()}
                disabled={loading}
                aria-label="Refresh calendar sessions"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {loading ? (
              <p role="status" aria-live="polite" className="mt-6 text-sm text-slate-600">Loading sessions…</p>
            ) : selectedEntries.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-5 text-center">
                <CalendarDays className="mx-auto h-7 w-7 text-slate-400" aria-hidden="true" />
                <p className="mt-2 text-sm font-semibold text-slate-800">No sessions on this day</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Choose another date or propose a session from an accepted exchange.</p>
              </div>
            ) : (
              <ul className="mt-5 space-y-3">
                {selectedEntries.map(({ exchange, session }) => (
                  <li key={session.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                        <Clock className="h-4 w-4 text-slate-500" aria-hidden="true" />
                        {formatTime(session.startTime)} – {formatTime(session.endTime)}
                      </span>
                      <span className={"rounded-full px-2.5 py-1 text-[11px] font-bold " + statusClass(session.status)}>
                        {session.status}
                      </span>
                    </div>
                    <h3 className="mt-3 break-words font-bold text-slate-900">{session.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">With {participantName(exchange)}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {exchange.offeredSkillName || "Skill exchange"} ↔ {exchange.wantedSkillName || "Learning goal"}
                    </p>
                    {session.notes && <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-600">{session.notes}</p>}
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={"/exchanges/" + exchange.id}
                        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-red-700 hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
                      >
                        Open exchange <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      {session.meetingLink && (
                        <a
                          href={session.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
                        >
                          Join session <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <p role="status" className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          No exchange sessions have been created yet. Once a participant proposes a session, it will appear here.
        </p>
      )}
    </AppPageShell>
  );
}
