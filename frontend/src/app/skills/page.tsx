"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { AppPageShell } from "../../components/ui/AppPageShell";
import { api } from "../../services/api";
import { UserSkillDto, skillCategories } from "@skillbarter/shared";
import { Plus, Trash2, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";

export default function SkillsPage() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<UserSkillDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Add skill form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [skillType, setSkillType] = useState<"offered" | "wanted">("offered");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Software Development");
  const [proficiency, setProficiency] = useState<"beginner" | "intermediate" | "advanced" | "expert">("intermediate");
  const [yearsExperience, setYearsExperience] = useState(1);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSkills = async () => {
    try {
      const res = await api.skills.mySkills();
      setSkills(res.skills);
    } catch {
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await api.skills.addMySkill({
        name,
        category,
        type: skillType,
        proficiency,
        yearsExperience,
        description,
      });
      setShowAddModal(false);
      setName("");
      setDescription("");
      await fetchSkills();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add skill");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSkill = async (id: string) => {
    if (!confirm("Are you sure you want to remove this skill association?")) return;
    try {
      await api.skills.removeMySkill(id);
      await fetchSkills();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to remove skill");
    }
  };

  const offered = skills.filter((s) => s.type === "offered");
  const wanted = skills.filter((s) => s.type === "wanted");

  return (
    <AppPageShell title="Manage Your Skills" eyebrow="Skills Inventory" description="Manage the skills you offer to teach and the skills you want to learn." icon={<BookOpen className="h-4 w-4" />}>
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-600">
            Skills Inventory
          </span>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Manage Your Skills</h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure the skills you offer to teach and the skills you are looking to learn.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSkillType("offered");
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Skill to Teach
          </button>
          <button
            type="button"
            onClick={() => {
              setSkillType("wanted");
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-500 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Learning Goal
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500">Loading your skills...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Offered Skills */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Skills You Teach ({offered.length})
              </h2>
            </div>

            {offered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                You haven&apos;t added any skills to teach yet. Click above to add your first skill!
              </div>
            ) : (
              <div className="space-y-3">
                {offered.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-start justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{s.name}</h3>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                          {s.proficiency}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">{s.category} • {s.yearsExperience} yrs</span>
                      {s.description && (
                        <p className="mt-1.5 text-xs text-slate-600">{s.description}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Remove skill"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Wanted Skills */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                Skills You Want to Learn ({wanted.length})
              </h2>
            </div>

            {wanted.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                You haven&apos;t added any learning goals yet. Click above to add what you want to learn!
              </div>
            ) : (
              <div className="space-y-3">
                {wanted.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-start justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{s.name}</h3>
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 uppercase">
                          {s.proficiency}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">{s.category}</span>
                      {s.description && (
                        <p className="mt-1.5 text-xs text-slate-600">{s.description}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Remove goal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Skill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                {skillType === "offered" ? "Offer New Skill" : "New Learning Goal"}
              </span>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">
                {skillType === "offered" ? "Add Skill You Teach" : "Add Skill You Want"}
              </h3>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleAddSkill} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Skill Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Python, Docker, Figma, Spanish"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm bg-white"
                >
                  {skillCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Proficiency
                  </label>
                  <select
                    value={proficiency}
                    onChange={(e) => setProficiency(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm bg-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
                {skillType === "offered" && (
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                      Years Exp.
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(parseInt(e.target.value, 10) || 0)}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Description / Focus Areas
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What specifically can you guide or want to learn?"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-red-600 px-5 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Skill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </AppPageShell>
  );
}
