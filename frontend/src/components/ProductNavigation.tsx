"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Bell,
  BookOpen,
  Compass,
  GraduationCap,
  LayoutGrid,
  LifeBuoy,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Users,
  X,
  ChevronDown,
} from "lucide-react";

const featureGroups = [
  {
    label: "Discover & Match",
    icon: Compass,
    items: [
      { label: "Find People & Skills", href: "/discover" },
      { label: "Skill Matches", href: "/matches" },
      { label: "My Skills", href: "/skills" },
    ],
  },
  {
    label: "Skill Exchange",
    icon: ArrowLeftRight,
    items: [
      { label: "My Exchanges", href: "/exchanges" },
      { label: "Connections", href: "/connections" },
    ],
  },
  {
    label: "Communication",
    icon: MessageSquare,
    items: [
      { label: "Messages", href: "/messages" },
      { label: "Notifications", href: "/notifications" },
    ],
  },
  {
    label: "Community & Learning",
    icon: GraduationCap,
    items: [
      { label: "Community", href: "/community" },
      { label: "Workshops", href: "/workshops/workshops" },
      { label: "Invite Peers", href: "/invite" },
      { label: "Beta Feedback", href: "/feedback" },
    ],
  },
  {
    label: "Trust & Support",
    icon: ShieldCheck,
    items: [
      { label: "Trust & Reputation", href: "/trust" },
      { label: "Safety Centre", href: "/safety" },
      { label: "Monetization", href: "/monetization" },
      { label: "Settings", href: "/settings" },
      { label: "Help Centre", href: "/support/support" },
      { label: "FAQ", href: "/support/faq" },
    ],
  },
] as const;

function isCurrentPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function useEscapeToClose(open: boolean, close: () => void, triggerRef: React.RefObject<HTMLButtonElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close, triggerRef]);
}

export function ProductNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const filteredGroups = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return featureGroups;
    return featureGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(term) ||
            group.label.toLowerCase().includes(term),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [query]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };
  useEscapeToClose(open, close, triggerRef);

  return (
    <div className="relative hidden md:block">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
      >
        <LayoutGrid aria-hidden="true" className="h-4 w-4" />
        All features
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
          {featureGroups.reduce((count, group) => count + group.items.length, 0)}
        </span>
        <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close all features menu"
            onClick={close}
            className="fixed inset-0 z-40 cursor-default bg-slate-950/10"
          />
          <section
            id={panelId}
            aria-label="All SkillBarter features"
            className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="border-b border-slate-100 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">All features</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Browse the main SkillBarter workspaces.</p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close all features menu"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24]"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
              <label className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-[#d31d24] focus-within:ring-2 focus-within:ring-red-100">
                <Search aria-hidden="true" className="h-4 w-4 text-slate-400" />
                <span className="sr-only">Search features</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search features"
                  className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </label>
            </div>
            <div className="max-h-[min(60vh,28rem)] overflow-y-auto bg-slate-50/70 p-2">
              {filteredGroups.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-500">No features found. Try another search.</p>
              ) : (
                filteredGroups.map((group, index) => {
                  const Icon = group.icon;
                  const groupId = `${panelId}-group-${index}`;
                  const active = group.items.some((item) => isCurrentPath(pathname, item.href));
                  const expanded = Boolean(query.trim()) || expandedGroup === group.label || active;
                  return (
                    <div key={group.label} className="mb-1 last:mb-0">
                      <button
                        type="button"
                        onClick={() => setExpandedGroup((current) => current === group.label ? null : group.label)}
                        aria-expanded={expanded}
                        aria-controls={groupId}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] ${active ? "bg-red-50 text-[#b71920]" : "bg-white text-slate-700 hover:bg-slate-100"}`}
                      >
                        <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                        <span className="min-w-0 flex-1 text-xs font-semibold">{group.label}</span>
                        <span className="text-[10px] text-slate-400">{group.items.length}</span>
                        <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
                      </button>
                      {expanded && (
                        <nav id={groupId} aria-label={group.label} className="ml-5 mt-1 space-y-0.5 border-l border-slate-200 py-1 pl-3">
                          {group.items.map((item) => {
                            const itemActive = isCurrentPath(pathname, item.href);
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                aria-current={itemActive ? "page" : undefined}
                                onClick={close}
                                className={`block rounded-lg px-3 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] ${itemActive ? "bg-red-50 font-semibold text-[#b71920]" : "text-slate-600 hover:bg-white hover:text-slate-900"}`}
                              >
                                {item.label}
                              </Link>
                            );
                          })}
                        </nav>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export function ProductNavigationMobile() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const filteredGroups = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return featureGroups;
    return featureGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(term) ||
            group.label.toLowerCase().includes(term),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [query]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };
  useEscapeToClose(open, close, triggerRef);

  const active = featureGroups.some((group) =>
    group.items.some((item) => isCurrentPath(pathname, item.href)),
  );

  return (
    <div className="relative min-w-0 flex-1">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="More features"
        className={`flex w-full flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-[10px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2 ${active || open ? "font-bold text-[#b71920]" : "text-slate-500"}`}
      >
        <LayoutGrid aria-hidden="true" className="h-5 w-5" />
        <span>More</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close more features menu"
            onClick={close}
            className="fixed inset-0 z-40 bg-slate-950/20"
          />
          <section
            id={panelId}
            aria-label="More SkillBarter features"
            className="fixed bottom-16 left-2 right-2 z-50 max-h-[70vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">All features</h2>
                <p className="text-[11px] text-slate-500">Open another workspace.</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close more features menu"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24]"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <label className="mx-3 mt-3 flex items-center gap-2 rounded-lg border border-slate-200 px-3 focus-within:border-[#d31d24] focus-within:ring-2 focus-within:ring-red-100">
              <Search aria-hidden="true" className="h-4 w-4 text-slate-400" />
              <span className="sr-only">Search features</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search features"
                className="h-9 min-w-0 flex-1 text-sm outline-none"
              />
            </label>
            <div className="max-h-[calc(70vh-7rem)] overflow-y-auto p-3">
              {filteredGroups.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">No features found. Try another search.</p>
              ) : (
                filteredGroups.map((group) => {
                  const Icon = group.icon;
                  return (
                    <section key={group.label} className="mb-4 last:mb-0">
                      <h3 className="mb-2 flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                        {group.label}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {group.items.map((item) => {
                          const itemActive = isCurrentPath(pathname, item.href);
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              aria-current={itemActive ? "page" : undefined}
                              onClick={close}
                              className={`rounded-lg border px-3 py-2.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] ${itemActive ? "border-red-200 bg-red-50 font-semibold text-[#b71920]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                            >
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    </section>
                  );
                })
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
