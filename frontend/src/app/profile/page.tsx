"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function CurrentProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace(`/profile/${user.id}`);
    } else {
      router.replace("/login");
    }
  }, [loading, router, user]);

  return (
    <main className="mx-auto flex min-h-[40vh] max-w-3xl items-center justify-center px-4 py-12">
      <p role="status" aria-live="polite" className="text-sm text-slate-600">
        Loading your profile…
      </p>
    </main>
  );
}
