"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { AppPageShell } from "../../components/ui/AppPageShell";
import { CommunityPostDto } from "@skillbarter/shared";
import { MessageSquare, Plus, Trash2, Tag, AlertCircle } from "lucide-react";

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPostDto[]>([]);
  const [loading, setLoading] = useState(true);

  // New post modal state
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      const data = await api.community.listPosts(1);
      setPosts(data);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    try {
      await api.community.createPost({ title, content, tags });
      setShowModal(false);
      setTitle("");
      setContent("");
      setTagsInput("");
      await fetchPosts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Delete this community post?")) return;
    try {
      await api.community.deletePost(id);
      await fetchPosts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete post");
    }
  };

  return (
    <AppPageShell
      eyebrow="Open Knowledge Forum"
      title="Community Feed"
      description="Share learning milestones, exchange study roadmaps, and connect with fellow members."
      icon={<MessageSquare className="h-3.5 w-3.5" />}
      actions={user ? <button type="button" onClick={() => setShowModal(true)} className="sb-button-primary inline-flex items-center gap-1.5 px-4 py-2.5 text-xs"><Plus className="h-4 w-4" /> Share a Post</button> : undefined}
    >
      <div className="space-y-8">
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500">Loading community discussions...</div>
      ) : posts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-slate-400 mb-2" />
          <h3 className="text-base font-bold text-slate-900">No posts yet</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Be the first to share an exchange tip or ask a study question!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => {
            const canDelete = user && (user.id === p.authorId || user.role === "admin");
            return (
              <div
                key={p.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 font-bold text-red-700 text-xs">
                      {p.authorName?.charAt(0).toUpperCase() || "M"}
                    </div>
                    <div>
                      <Link
                        href={`/profile/${p.authorId}`}
                        className="font-bold text-sm text-slate-900 hover:text-red-600"
                      >
                        {p.authorName || "Member"}
                      </Link>
                      <span className="text-[11px] text-slate-400 block">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeletePost(p.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Delete post"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {p.content}
                  </p>
                </div>

                {p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                    {p.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600"
                      >
                        <Tag className="h-2.5 w-2.5 text-slate-400" /> #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Post Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Create Community Post</h3>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Best resources for learning Next.js App Router"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Content
                </label>
                <textarea
                  rows={5}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your thoughts, advice, or questions with the community..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="react, typescript, beginner-tips"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-red-600 px-5 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {creating ? "Posting..." : "Publish Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
      </div>
    </AppPageShell>
  );
}
