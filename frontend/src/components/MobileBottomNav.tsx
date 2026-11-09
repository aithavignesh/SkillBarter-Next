"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Compass, MessageSquare, Repeat, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ProductNavigationMobile } from "./ProductNavigation";

export function MobileBottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const items = [
    { label: "Dashboard", href: "/dashboard", icon: Repeat, active: pathname === "/dashboard" || pathname === "/feed" },
    { label: "Discover", href: "/discover", icon: Compass, active: pathname === "/discover" || pathname === "/matches" },
    { label: "Exchanges", href: "/exchanges", icon: ArrowLeftRight, active: pathname.startsWith("/exchanges") },
    { label: "Messages", href: "/messages", icon: MessageSquare, active: pathname.startsWith("/messages") },
    { label: "Profile", href: `/profile/${user.id}`, icon: User, active: pathname.startsWith("/profile") },
  ];

  return (
    <nav
      aria-label="Mobile quick navigation"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white/95 px-2 py-1.5 shadow-lg backdrop-blur-md lg:hidden"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2 ${
              item.active ? "font-bold text-[#b71920]" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Icon aria-hidden="true" className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
      <ProductNavigationMobile />
    </nav>
  );
}
