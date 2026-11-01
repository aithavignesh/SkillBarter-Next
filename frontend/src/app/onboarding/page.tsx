"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { skillCategories } from "@skillbarter/shared";
import { Plus, Trash2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setUser } = useAuth();

  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const [preferredSessionFormat, setPreferredSessionFormat] = useState<"video" | "chat" | "in_person" | "any">("video");
  const [availability, setAvailability] = useState("Weeknights and weekends");

  const [offeredSkills, setOfferedSkills] = useState<
    Array<{ skillName: string; category: string; proficiency: "beginner" | "intermediate" | "advanced" | "expert"; description: string; yearsExperience: number }>
  >([
    {
      skillName: "",
      category: "Software Development",
      proficiency: "intermediate",
      description: "",
      yearsExperience: 2,
    },
  ]);

  const [wantedSkills, setWantedSkills] = useState<
    Array<{ skillName: string; category: string; proficiency: "beginner" | "intermediate" | "advanced" | "expert"; description: string; yearsExperience: number }>
  >([
    {
      skillName: "",
      category: "Software Development",
      proficiency: "beginner",
      description: "",
      yearsExperience: 0,
    },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const addOfferedSkill = () => {
    setOfferedSkills([
      ...offeredSkills,
      { skillName: "", category: "Software Development", proficiency: "intermediate", description: "", yearsExperience: 1 },
    ]);
  };

  const removeOfferedSkill = (index: number) => {
    if (offeredSkills.length > 1) {
      setOfferedSkills(offeredSkills.filter((_, i) => i !== index));
    }
  };

  const addWantedSkill = () => {
    setWantedSkills([
      ...wantedSkills,
      { skillName: "", category: "Software Development", proficiency: "beginner", description: "", yearsExperience: 0 },
    ]);
  };

  const removeWantedSkill = (index: number) => {
    if (wantedSkills.length > 1) {
      setWantedSkills(wantedSkills.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const validOffered = offeredSkills.filter((s) => s.skillName.trim().length > 0);
    const validWanted = wantedSkills.filter((s) => s.skillName.trim().length > 0);

    if (validOffered.length === 0) {
      setError("Please provide at least one skill you can teach.");
      setStep(2);
      return;
    }
    if (validWanted.length === 0) {
      setError("Please provide at least one skill you want to learn.");
      setStep(3);
      return;
    }

    setLoading(true);
    try {
      const res = await api.users.completeOnboarding({
        displayName,
        bio,
        location,
        preferredSessionFormat,
        availability,
        offeredSkills: validOffered,
        wantedSkills: validWanted,
      });
      setUser(res.user);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save onboarding profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-lg">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-[#d31d24] uppercase tracking-wider mb-2">
            <span>Step {step} of 3</span>
            <span>
              {step === 1 && "About You"}
              {step === 2 && "Skills You Teach"}
              {step === 3 && "Skills You Want to Learn"}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-[#d31d24] transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: Basic Profile Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Tell us about yourself</h2>
                <p className="mt-1 text-sm text-slate-600">
                  This will help other members know who they are exchanging with.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm transition-colors focus:border-[#d31d24] focus:outline-none focus:ring-2 focus:ring-[#d31d24]/20"
                  placeholder="e.g. Alex Chen"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Bio / Background
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm transition-colors focus:border-[#d31d24] focus:outline-none focus:ring-2 focus:ring-[#d31d24]/20"
                  placeholder="Tell others what you do, your interests, and what motivates you to share skills."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Location / City
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1.5 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm transition-colors focus:border-[#d31d24] focus:outline-none focus:ring-2 focus:ring-[#d31d24]/20"
                    placeholder="e.g. London, UK (or Remote)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Preferred Session Format
                  </label>
                  <select
                    value={preferredSessionFormat}
                    onChange={(e) => setPreferredSessionFormat(e.target.value as any)}
                    className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors focus:border-[#d31d24] focus:outline-none focus:ring-2 focus:ring-[#d31d24]/20"
                  >
                    <option value="video">Online Video Call</option>
                    <option value="chat">Chat / Asynchronous</option>
                    <option value="in_person">In-Person</option>
                    <option value="any">Flexible / Any</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  General Availability
                </label>
                <input
                  type="text"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm transition-colors focus:border-[#d31d24] focus:outline-none focus:ring-2 focus:ring-[#d31d24]/20"
                  placeholder="e.g. Tuesday evenings, Saturday mornings UTC"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-xl bg-[#d31d24] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b71920] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
                >
                  Next: Skills You Teach →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Skills You Teach (Offered) */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">What skills can you teach?</h2>
                <p className="mt-1 text-sm text-slate-600">
                  List skills you have practiced and feel confident guiding another person in.
                </p>
              </div>

              <div className="space-y-4">
                {offeredSkills.map((skill, index) => (
                  <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-[#d31d24]">
                        Skill #{index + 1}
                      </span>
                      {offeredSkills.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOfferedSkill(index)}
                          className="rounded-md p-1 text-rose-500 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          required
                          value={skill.skillName}
                          onChange={(e) => {
                            const updated = [...offeredSkills];
                            updated[index]!.skillName = e.target.value;
                            setOfferedSkills(updated);
                          }}
                          placeholder="Skill name (e.g. TypeScript, Spanish, Figma)"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm transition-colors focus:border-[#d31d24] focus:outline-none focus:ring-2 focus:ring-[#d31d24]/20"
                        />
                      </div>
                      <div>
                        <select
                          value={skill.category}
                          onChange={(e) => {
                            const updated = [...offeredSkills];
                            updated[index]!.category = e.target.value;
                            setOfferedSkills(updated);
                          }}
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm bg-white"
                        >
                          {skillCategories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold uppercase text-slate-500">Proficiency</label>
                        <select
                          value={skill.proficiency}
                          onChange={(e) => {
                            const updated = [...offeredSkills];
                            updated[index]!.proficiency = e.target.value as any;
                            setOfferedSkills(updated);
                          }}
                          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm transition-colors focus:border-[#d31d24] focus:outline-none focus:ring-2 focus:ring-[#d31d24]/20"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                          <option value="expert">Expert</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold uppercase text-slate-500">Years Experience</label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={skill.yearsExperience}
                          onChange={(e) => {
                            const updated = [...offeredSkills];
                            updated[index]!.yearsExperience = parseInt(e.target.value, 10) || 0;
                            setOfferedSkills(updated);
                          }}
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm bg-white"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={skill.description}
                      onChange={(e) => {
                        const updated = [...offeredSkills];
                        updated[index]!.description = e.target.value;
                        setOfferedSkills(updated);
                      }}
                      placeholder="Brief detail: e.g. React hooks, Next.js App Router, full-stack APIs"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm bg-white"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addOfferedSkill}
                  className="flex items-center gap-1.5 rounded-sm text-sm font-semibold text-[#d31d24] hover:text-[#b71920] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
                >
                  <Plus className="h-4 w-4" /> Add Another Skill to Teach
                </button>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d31d24] focus-visible:ring-offset-2"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded-xl bg-[#d31d24] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#b71920]"
                >
                  Next: Skills You Want →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Skills You Want to Learn */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">What do you want to learn?</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Specify which skills you are seeking mentors or practice partners in.
                </p>
              </div>

              <div className="space-y-4">
                {wantedSkills.map((skill, index) => (
                  <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-[#d31d24]">
                        Wanted Skill #{index + 1}
                      </span>
                      {wantedSkills.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeWantedSkill(index)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          required
                          value={skill.skillName}
                          onChange={(e) => {
                            const updated = [...wantedSkills];
                            updated[index]!.skillName = e.target.value;
                            setWantedSkills(updated);
                          }}
                          placeholder="Skill name (e.g. Python, UI Design, Japanese)"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm bg-white"
                        />
                      </div>
                      <div>
                        <select
                          value={skill.category}
                          onChange={(e) => {
                            const updated = [...wantedSkills];
                            updated[index]!.category = e.target.value;
                            setWantedSkills(updated);
                          }}
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm bg-white"
                        >
                          {skillCategories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={skill.description}
                      onChange={(e) => {
                        const updated = [...wantedSkills];
                        updated[index]!.description = e.target.value;
                        setWantedSkills(updated);
                      }}
                      placeholder="What are your goals? e.g. Learn data structures, conversation practice"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm bg-white"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addWantedSkill}
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#d31d24] hover:text-[#b71920]"
                >
                  <Plus className="h-4 w-4" /> Add Another Learning Goal
                </button>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-emerald-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Completing Setup..." : "Complete Profile & Start Exchanging"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
