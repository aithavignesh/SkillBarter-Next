"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { api } from "../services/api";
import { ProductNavigation } from "./ProductNavigation";
import {
  Repeat,
  Compass,
  ArrowLeftRight,
  MessageSquare,
  Users,
  ShieldCheck,
  Bell,
  AlertTriangle,
  History,
  LogOut,
  Menu,
  X,
  BookOpen,
} from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [activeAdminSection, setActiveAdminSection] = useState("overview");
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
    if (pathname === "/admin") {
      setActiveAdminSection(new URLSearchParams(window.location.search).get("section") || "overview");
    }
  }, [pathname]);

  useEffect(() => {
    const syncAdminSection = () => {
      if (window.location.pathname === "/admin") {
        setActiveAdminSection(new URLSearchParams(window.location.search).get("section") || "overview");
      }
    };
    window.addEventListener("popstate", syncAdminSection);
    return () => window.removeEventListener("popstate", syncAdminSection);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setUnreadCount(0);
      return;
    }

    api.notifications
      .unreadCount()
      .then((res) => {
        if (!cancelled) setUnreadCount(res.unreadCount);
      })
      .catch(() => {
        if (!cancelled) setUnreadCount(0);
      });

    return () => {
      cancelled = true;
    };
  }, [user, pathname]);

  const navLinks = user
    ? [
        { href: "/discover", label: "Discover", icon: Compass },
        { href: "/exchanges", label: "Exchanges", icon: ArrowLeftRight },
        { href: "/messages", label: "Messages", icon: MessageSquare },
        { href: "/community", label: "Community", icon: Users },
        ...(["admin", "owner"].includes(user.role)
          ? [
              { href: "/admin?section=overview", label: "Admin Overview", icon: ShieldCheck },
              { href: "/admin?section=users", label: "People", icon: Users },
              { href: "/admin?section=reports", label: "Reports", icon: AlertTriangle },
              { href: "/admin?section=audit", label: "Audit Trail", icon: History },
            ]
          : []),
      ]
    : [
        { href: "/about", label: "How It Works", icon: BookOpen },
        { href: "/discover", label: "Browse Skills", icon: Compass },
      ];

  const isActive = (href: string) => {
    const [path, query] = href.split("?");
    if (!(pathname === path || pathname.startsWith(`${path}/`))) return false;
    if (!query) return pathname === path;
    const section = new URLSearchParams(query).get("section");
    return activeAdminSection === section;
  };

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2 ${
      active
        ? "bg-red-50 text-[#b71920]"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
            aria-label="SkillBarter home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d31d24] text-white shadow-sm">
              <Repeat aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              SkillBarter
            </span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  
                  className={navLinkClass(active)}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <ProductNavigation />
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link
                href="/notifications"
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
                className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
              >
                <Bell aria-hidden="true" className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              <div className="flex items-center gap-2 border-l border-slate-200 pl-2">
                <Link
                  href={`/profile/${user.id}`}
                  className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                    {user.displayName.charAt(0).toUpperCase()}
                  </span>
                  <span>{user.displayName.split(" ")[0]}</span>
                </Link>

                <button
                  type="button"
                  onClick={() => logout()}
                  className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
                  aria-label="Log out"
                  title="Log out"
                >
                  <LogOut aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-[#d31d24] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#b71920] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {user && (
            <Link
              href="/notifications"
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
              className="relative rounded-lg p-2 text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
            >
              <Bell aria-hidden="true" className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="rounded-lg p-2 text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="skillbarter-mobile-menu"
          >
            {mobileMenuOpen ? <X aria-hidden="true" className="h-6 w-6" /> : <Menu aria-hidden="true" className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav
          id="skillbarter-mobile-menu"
          aria-label="Mobile navigation"
          className="space-y-1 border-t border-slate-200 bg-white px-4 pb-4 pt-2 md:hidden"
        >
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              onClick={() => { const section = new URLSearchParams(item.href.split("?")[1] || "").get("section"); if (section) setActiveAdminSection(section); setMobileMenuOpen(false); }}
              className={`block rounded-lg px-3 py-2 text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2 ${
                isActive(item.href)
                  ? "bg-red-50 text-[#b71920]"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                href={`/profile/${user.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
              >
                My Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
              >
                Settings
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-base font-medium text-rose-600 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
              >
                Log Out
              </button>
            </>
          ) : (
            <div className="space-y-2 border-t border-slate-200 pt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full rounded-lg border border-slate-300 py-2 text-center text-sm font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full rounded-lg bg-[#d31d24] py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-[#b71920] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
