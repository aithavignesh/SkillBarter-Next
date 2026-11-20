"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

const protectedPrefixes = [
  "/dashboard",
  "/matches",
  "/exchanges",
  "/messages",
  "/notifications",
  "/profile/edit",
  "/skills",
  "/connections",
  "/safety",
  "/settings",
  "/admin",
  "/feed",
  "/invite",
  "/feedback",
  "/monetization",
  "/trust",
  "/workshops",
];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

function AccessGate({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center justify-center px-4 py-12">
      <section
        aria-live="polite"
        className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10"
      >
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">
          {description}
        </p>
        <Link
          href={href}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#b71920] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#98151b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b71920] focus-visible:ring-offset-2"
        >
          {action}
        </Link>
      </section>
    </main>
  );
}

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const requiresAuth = pathname === "/onboarding" || isProtectedPath(pathname);

  if (!requiresAuth) return <>{children}</>;

  if (loading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center px-4">
        <p role="status" aria-live="polite" className="text-sm font-medium text-slate-700">
          Checking your SkillBarter session...
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <AccessGate
        title="Sign in to continue"
        description="This workspace is available to signed-in SkillBarter members. Sign in or create an account to continue."
        href="/login"
        action="Sign in"
      />
    );
  }

  // Email verification must not block account creation or onboarding.
  // Members can finish onboarding first, then verify before using protected features.
  if (pathname === "/onboarding") return <>{children}</>;

  if (!user.onboardingCompleted) {
    return (
      <AccessGate
        title="Complete your learning profile"
        description="Add the skills you can teach and the skills you want to learn before opening your member workspace."
        href="/onboarding"
        action="Complete onboarding"
      />
    );
  }

  if (!user.isEmailVerified) {
    return (
      <AccessGate
        title="Verify your email to continue"
        description="Your profile is saved. Verify your email address to unlock exchanges, messages, skills management, and other protected features."
        href="/verify-email"
        action="Verify email"
      />
    );
  }

  return <>{children}</>;
}
