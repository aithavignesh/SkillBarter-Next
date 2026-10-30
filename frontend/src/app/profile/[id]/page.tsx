"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../services/api";
import { PublicUserProfile, ReviewDto } from "@skillbarter/shared";
import {
  Award,
  Calendar,
  MapPin,
  Video,
  UserPlus,
  MessageSquare,
  ShieldAlert,
  ArrowLeftRight,
  Edit,
  Star,
  CheckCircle2,
} from "lucide-react";

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    Promise.all([
      api.users.getProfile(id),
      api.reviews.getUserReviews(id),
    ])
      .then(([pRes, rRes]) => {
        setProfile(pRes.profile);
        setReviews(rRes.reviews);
      })
      .catch((err) => setError(err.message || "Failed to load profile"))
      .finally(() => setLoading(false));
  }, [id]);

  const isOwner = user?.id === id;

  const handleConnect = async () => {
    try {
      await api.community.requestConnection(id);
      setConnected(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to send connection request");
    }
  };

  const handleStartMessage = async () => {
    try {
      const res = await api.messages.getOrCreateConversation(id);
      router.push(`/messages?c=${res.conversation.id}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to open conversation");
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-slate-500">Loading user profile...</div>;
  }

  if (error || !profile) {
    return (
      <div className="p-12 text-center">
        <p className="text-rose-600 font-semibold">{error || "User not found"}</p>
        <Link href="/discover" className="mt-4 inline-block text-xs font-bold text-indigo-600">
          ← Back to Discover
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header Profile Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-600 text-2xl font-bold text-white shadow-md">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {profile.displayName}
              </h1>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-3">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {profile.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Video className="h-3.5 w-3.5" /> {profile.preferredSessionFormat} format
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isOwner ? (
              <Link
                href="/profile/edit"
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 shadow-sm"
              >
                <Edit className="h-3.5 w-3.5" /> Edit Profile
              </Link>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={connected}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {connected ? "Request Sent" : "Connect"}
                </button>
                <button
                  type="button"
                  onClick={handleStartMessage}
                  className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Message
                </button>
                <Link
                  href={`/discover`}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-sm"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" /> Exchange
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mt-6 text-sm leading-6 text-slate-700 border-t border-slate-100 pt-6">
            {profile.bio}
          </p>
        )}

        {/* Stats Row */}
        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-100 pt-6 text-center">
          <div>
            <span className="block text-xl font-bold text-slate-900">
              ★ {profile.reputationScore.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500">Reputation Score</span>
          </div>
          <div>
            <span className="block text-xl font-bold text-slate-900">
              {profile.completedExchangesCount}
            </span>
            <span className="text-xs text-slate-500">Exchanges Completed</span>
          </div>
          <div>
            <span className="block text-xl font-bold text-slate-900">
              {reviews.length}
            </span>
            <span className="text-xs text-slate-500">Reviews</span>
          </div>
        </div>
      </div>

      {/* Skills Offered & Wanted Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Offered Skills */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Skills Offered to Teach ({profile.offeredSkills.length})
            </h2>
            {isOwner && (
              <Link href="/skills" className="text-xs font-semibold text-indigo-600 hover:underline">
                Manage
              </Link>
            )}
          </div>

          {profile.offeredSkills.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No skills offered yet.</p>
          ) : (
            <div className="space-y-3">
              {profile.offeredSkills.map((s) => (
                <div key={s.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">{s.name}</h3>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                      {s.proficiency}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">{s.category}</span>
                  {s.description && (
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">{s.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wanted Skills */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              Skills Wanted to Learn ({profile.wantedSkills.length})
            </h2>
            {isOwner && (
              <Link href="/skills" className="text-xs font-semibold text-indigo-600 hover:underline">
                Manage
              </Link>
            )}
          </div>

          {profile.wantedSkills.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No learning goals listed yet.</p>
          ) : (
            <div className="space-y-3">
              {profile.wantedSkills.map((s) => (
                <div key={s.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">{s.name}</h3>
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 uppercase">
                      {s.proficiency}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">{s.category}</span>
                  {s.description && (
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">{s.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6">
        <h2 className="text-lg font-bold text-slate-900">Exchange Reviews & Feedback</h2>

        {reviews.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            No reviews yet. Reviews are submitted after completing verified skill exchanges.
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900">
                    {r.reviewerName || "Member"}
                  </span>
                  <div className="flex items-center text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-700 leading-relaxed">&ldquo;{r.comment}&rdquo;</p>
                <span className="mt-2 block text-[10px] text-slate-400">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
