"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { AppPageShell } from "../../components/ui/AppPageShell";
import { ConnectionDto } from "@skillbarter/shared";
import { Users, UserCheck, X, MessageSquare } from "lucide-react";

export default function ConnectionsPage() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<ConnectionDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = async () => {
    try {
      const res = await api.community.listConnections();
      setConnections(res.connections);
    } catch {
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleAccept = async (id: string) => {
    try {
      await api.community.acceptConnection(id);
      await fetchConnections();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to accept");
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Are you sure you want to remove this connection?")) return;
    try {
      await api.community.removeConnection(id);
      await fetchConnections();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to remove");
    }
  };

  const pending = connections.filter(
    (c) => c.status === "PENDING" && c.recipientId === user?.id
  );
  const accepted = connections.filter((c) => c.status === "ACCEPTED");

  return (
    <AppPageShell
      eyebrow="Peer Network"
      title="Connections"
      description="People you collaborate with, learn from, and stay in touch with across exchanges."
      icon={<Users className="h-3.5 w-3.5" />}
    >
      <div className="space-y-8">

      {/* Pending Requests */}
      {pending.length > 0 && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 space-y-4">
          <h2 className="text-sm font-bold text-amber-900 uppercase tracking-wider">
            Pending Connection Requests ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-2xl bg-white p-4 border border-amber-200"
              >
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {c.otherUser?.displayName || "A Member"}
                  </h3>
                  <p className="text-xs text-slate-500">{c.otherUser?.bio || "Wants to connect"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAccept(c.id)}
                    className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(c.id)}
                    className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accepted Connections */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          Connected Members ({accepted.length})
        </h2>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading connections...</div>
        ) : accepted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
            You don&apos;t have any connections yet. Connect with members while discovering skills!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {accepted.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-3 bg-slate-50/50"
              >
                <Link
                  href={c.otherUser ? `/profile/${c.otherUser.id}` : "#"}
                  className="flex items-center gap-3 min-w-0"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 text-xs">
                    {c.otherUser?.displayName?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 truncate">
                      {c.otherUser?.displayName || "Member"}
                    </h3>
                    <p className="text-[11px] text-slate-500">★ {c.otherUser?.reputationScore?.toFixed(1) || "5.0"}</p>
                  </div>
                </Link>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/messages`}
                    className="p-2 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-white"
                    title="Send message"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemove(c.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white"
                    title="Remove connection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppPageShell>
  );
}
