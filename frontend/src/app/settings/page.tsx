"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { AppPageShell } from "../../components/ui/AppPageShell";
import { api } from "../../services/api";
import { ShieldCheck, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isProfilePublic, setIsProfilePublic] = useState(user?.isProfilePublic ?? true);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [privacyError, setPrivacyError] = useState<string | null>(null);
  const [privacySuccess, setPrivacySuccess] = useState(false);

  useEffect(() => {
    if (user) setIsProfilePublic(user.isProfilePublic ?? true);
  }, [user]);

  const handlePrivacySave = async () => {
    setPrivacySaving(true);
    setPrivacyError(null);
    setPrivacySuccess(false);
    try {
      const result = await api.users.updateProfile({ isProfilePublic });
      setUser(result.user);
      setPrivacySuccess(true);
    } catch (err: unknown) {
      setPrivacyError(err instanceof Error ? err.message : "Unable to update profile visibility.");
    } finally {
      setPrivacySaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.auth.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppPageShell title="Account Settings" eyebrow="Preferences" description="Manage your account security and profile details." icon={<ShieldCheck className="h-4 w-4" />}>
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-red-600">
          Preferences
        </span>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Account Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your security credentials and profile privacy.</p>
      </div>

      {/* Account Info Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">Account Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block">Email Address</span>
            <span className="font-bold text-slate-900 mt-1 block">{user?.email}</span>
            <span className="inline-flex items-center gap-1 mt-2 text-emerald-600 font-semibold">
              <CheckCircle2 className="h-3 w-3" />
              {user?.isEmailVerified ? "Verified Account" : "Pending Verification"}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block">Account Role</span>
            <span className="font-bold text-slate-900 mt-1 block uppercase">{user?.role}</span>
            <span className="text-slate-400 block mt-2">
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "2026"}
            </span>
          </div>
        </div>
      </div>

      {/* Profile visibility controls */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5 shadow-sm" aria-labelledby="profile-visibility-heading">
        <div>
          <h2 id="profile-visibility-heading" className="text-base font-bold text-slate-900">Profile visibility</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Choose whether your profile can appear in member discovery and be opened by other members. Your email address and phone number are never shown on public profiles.</p>
        </div>
        {privacyError && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">{privacyError}</p>}
        {privacySuccess && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700" role="status">Profile visibility saved.</p>}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label htmlFor="profile-visibility" className="flex items-start gap-3 text-sm text-slate-700">
            <input
              id="profile-visibility"
              type="checkbox"
              checked={isProfilePublic}
              onChange={(event) => setIsProfilePublic(event.target.checked)}
              className="mt-0.5 h-5 w-5 rounded border-slate-300 text-red-600 focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
            />
            <span>
              <span className="block font-semibold text-slate-900">Show my profile in discovery</span>
              <span className="mt-1 block text-sm text-slate-500">{isProfilePublic ? "Other members can discover and open your profile." : "Your profile is hidden from member discovery and other members cannot open it."}</span>
            </span>
          </label>
          <button
            type="button"
            onClick={handlePrivacySave}
            disabled={privacySaving || !user}
            className="min-h-11 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
          >
            {privacySaving ? "Saving..." : "Save visibility"}
          </button>
        </div>
      </section>

      {/* Change Password Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Change Password</h2>
            <p className="text-xs text-slate-500">Update your security password.</p>
          </div>
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
            <p>Your password has been successfully updated!</p>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
              placeholder="At least 8 chars, 1 uppercase, 1 number"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-red-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
    </AppPageShell>
  );
}