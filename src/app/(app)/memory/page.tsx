"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type MemoryRow = {
  id: string;
  type: string;
  source: string;
  content: string;
  importance: number;
  metadata?: { key?: string };
  created_at: string;
};

export default function MemoryPage() {
  const [memories, setMemories] = useState<MemoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [error, setError] = useState("");

  async function loadMemories() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/memories");
      if (!res.ok) throw new Error("Failed to load memories");
      const data = await res.json();
      setMemories(data.memories || []);
    } catch (err: any) {
      setError(err?.message || "Unable to load memories");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMemories();
  }, []);

  const filteredMemories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return memories;
    return memories.filter((memory) => {
      const key = String(memory.metadata?.key || "").toLowerCase();
      return key.includes(q) || memory.content.toLowerCase().includes(q) || memory.type.toLowerCase().includes(q);
    });
  }, [memories, query]);

  async function handleCreateMemory(e: React.FormEvent) {
    e.preventDefault();
    if (!contentInput.trim() || saving) return;

    setSaving(true);
    setError("");
    const savingToastId = toast.loading("Saving memory...");
    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: keyInput.trim(),
          content: contentInput.trim(),
          source: "manual",
          type: "fact",
          importance: 0.6,
        }),
      });

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error || "Unable to save memory");
      }

      const payload = await res.json();
      if (payload.memory) {
        setMemories((prev) => [payload.memory, ...prev]);
      }
      setKeyInput("");
      setContentInput("");
      toast.success("Memory saved.", { id: savingToastId });
    } catch (err: any) {
      setError(err?.message || "Unable to save memory");
      toast.error(err?.message || "Unable to save memory", { id: savingToastId });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteMemory(id: string) {
    const deleteToastId = toast.loading("Deleting memory...");
    const res = await fetch(`/api/memories/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMemories((prev) => prev.filter((memory) => memory.id !== id));
      toast.success("Memory deleted.", { id: deleteToastId });
      return;
    }
    toast.error("Unable to delete memory.", { id: deleteToastId });
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl text-vault-100">Memory</h1>
          <p className="text-sm text-vault-400 mt-1">
            Store long-term context that helps Vault personalize responses across sessions.
          </p>
        </div>

        <form onSubmit={handleCreateMemory} className="bg-vault-900/50 border border-vault-800/40 rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Label (optional)"
              className="px-3 py-2.5 rounded-xl bg-vault-800/40 border border-vault-700/40 text-vault-100 placeholder-vault-500 text-sm focus:outline-none focus:border-vault-500/40"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search memories"
              className="md:col-span-2 px-3 py-2.5 rounded-xl bg-vault-800/40 border border-vault-700/40 text-vault-100 placeholder-vault-500 text-sm focus:outline-none focus:border-vault-500/40"
            />
          </div>

          <textarea
            value={contentInput}
            onChange={(e) => setContentInput(e.target.value)}
            placeholder="Write memory content"
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl bg-vault-800/40 border border-vault-700/40 text-vault-100 placeholder-vault-500 text-sm resize-none focus:outline-none focus:border-vault-500/40"
          />

          <div className="flex items-center justify-between">
            <p className="text-xs text-vault-500">{filteredMemories.length} memories shown</p>
            <button
              type="submit"
              disabled={saving || !contentInput.trim()}
              className="px-4 py-2 rounded-xl text-sm bg-vault-500/20 border border-vault-500/30 text-vault-100 hover:bg-vault-500/30 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save memory"}
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </form>

        <div className="bg-vault-900/30 border border-vault-800/30 rounded-2xl divide-y divide-vault-800/30">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-xl border border-vault-800/50 bg-vault-950/30 p-3 space-y-2">
                  <div className="skeleton h-3 w-2/5 rounded" />
                  <div className="skeleton h-3.5 w-4/5 rounded" />
                  <div className="skeleton h-3 w-3/5 rounded" />
                </div>
              ))}
            </div>
          ) : filteredMemories.length === 0 ? (
            <p className="text-sm text-vault-500 p-4">No memories found.</p>
          ) : (
            filteredMemories.map((memory) => (
              <div key={memory.id} className="p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-vault-800 text-vault-400 border border-vault-700/40">
                      {memory.metadata?.key || memory.type}
                    </span>
                    <span className="text-2xs text-vault-600">{new Date(memory.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-vault-200 leading-relaxed">{memory.content}</p>
                </div>
                <button
                  onClick={() => handleDeleteMemory(memory.id)}
                  className="text-xs px-2 py-1 rounded-md border border-vault-700/40 text-vault-500 hover:text-red-400 hover:border-red-500/30 transition-colors sm:self-start"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
