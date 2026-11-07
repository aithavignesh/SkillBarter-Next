"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../services/api";
import { ArrowLeft, Save, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, setUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const [preferredSessionFormat, setPreferredSessionFormat] = useState<"video" | "chat" | "in_person" | "any">("video");
  const [availability, setAvailability] = useState(user?.availability || "Flexible");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setBio(user.bio || "");
      setLocation(user.location || "");
      setAvailability(user.availability || "Flexible");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await api.users.updateProfile({
        displayName,
        bio,
        location,
        preferredSessionFormat,
        availability,
      });
      setUser(res.user);
      setSuccess(true);
      setTimeout(() => router.push(`/profile/${res.user.id}`), 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <Link
        href={user ? `/profile/${user.id}` : "/dashboard"}
        className="inline-flex items-center gap-1.5 rounded-md text-xs font-semibold text-[#d31d24] hover:text-[#b71920] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Profile
      </Link>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Update your public biography and session preferences.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-xs text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <p>Profile updated successfully! Redirecting...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="profile-display-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Display Name
            </label>
            <input
              id="profile-display-name"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm transition-colors focus:border-[#d31d24] focus:outline-none focus:ring-2 focus:ring-[#d31d24]/20"
            />
          </div>

          <div>
            <label htmlFor="profile-bio" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Bio
            </label>
            <textarea
              id="profile-bio"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm transition-colors focus:border-[#d31d24] focus:outline-none focus:ring-2 focus:ring-[#d31d24]/20"
              placeholder="Tell others about your professional background and interests."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-location" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Location
              </label>
              <input
                id="profile-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm transition-colors focus:border-[#d31d24] focus:outline-none focus:ring-2 focus:ring-[#d31d24]/20"
                placeholder="e.g. San Francisco, CA"
              />
            </div>
            <div>
              <label htmlFor="profile-session-format" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Session Format
              </label>
              <select
                id="profile-session-format"
                value={preferredSessionFormat}
                onChange={(e) => setPreferredSessionFormat(e.target.value as any)}
                className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors focus:border-[#d31d24] focus:outline-none focus:ring-2 focus:ring-[#d31d24]/20"
              >
                <option value="video">Online Video</option>
                <option value="chat">Chat / Async</option>
                <option value="in_person">In Person</option>
                <option value="any">Flexible / Any</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="profile-availability" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Availability
            </label>
            <input
              id="profile-availability"
              type="text"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm transition-colors focus:border-[#d31d24] focus:outline-none focus:ring-2 focus:ring-[#d31d24]/20"
              placeholder="e.g. Weekday evenings, Saturdays"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Link
              href={user ? `/profile/${user.id}` : "/dashboard"}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#d31d24] px-6 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#b71920] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
