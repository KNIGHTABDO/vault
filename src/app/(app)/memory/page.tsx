"use client";

import { useState } from "react";
import { Brain, Search, Calendar, Tag, Star } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";

interface MemoryItem {
  id: string;
  type: string;
  content: string;
  metadata: { tags?: string[] };
  importance: number;
  created_at: string;
}

const MOCK_MEMORIES: MemoryItem[] = [
  {
    id: "1",
    type: "event",
    content: "Pharmacology exam on June 15, 2026",
    metadata: { tags: ["exam", "pharmacology"] },
    importance: 0.9,
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    type: "person",
    content: "Friend Ahmed — studies medicine, visiting next Friday",
    metadata: { tags: ["friend", "medicine"] },
    importance: 0.7,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "3",
    type: "preference",
    content: "Prefers dark mode, minimalist design",
    metadata: { tags: ["preference", "design"] },
    importance: 0.5,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

const TYPE_ICONS: Record<string, string> = {
  fact: "📌",
  event: "📅",
  preference: "⚙️",
  person: "👤",
  project: "📁",
  file: "📄",
};

export default function MemoryPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = MOCK_MEMORIES.filter((m) => {
    if (filter && m.type !== filter) return false;
    if (search && !m.content.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Brain className="w-5 h-5 text-vault-accent" />
          <h1 className="text-lg font-medium text-vault-text">Memory</h1>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-ghost" />
          <input
            type="text"
            placeholder="Search memories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-vault-surface border border-vault-border-subtle text-sm text-vault-text placeholder:text-vault-text-ghost outline-none focus:border-vault-border-hover transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 mb-6 flex-wrap">
          {["all", "fact", "event", "preference", "person", "project"].map(
            (type) => (
              <button
                key={type}
                onClick={() => setFilter(type === "all" ? null : type)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs transition-colors",
                  (type === "all" && !filter) || filter === type
                    ? "bg-vault-accent/10 text-vault-accent"
                    : "text-vault-text-ghost hover:text-vault-text-secondary hover:bg-vault-surface-hover"
                )}
              >
                {type === "all" ? "All" : TYPE_ICONS[type] + " " + type}
              </button>
            )
          )}
        </div>

        {/* Memory list */}
        <div className="space-y-2">
          {filtered.map((memory) => (
            <div
              key={memory.id}
              className="p-4 rounded-xl border border-vault-border-subtle bg-vault-surface hover:bg-vault-surface-hover transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">
                  {TYPE_ICONS[memory.type] || "📌"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-vault-text leading-relaxed">
                    {memory.content}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-2xs text-vault-text-ghost">
                      {formatRelativeTime(memory.created_at)}
                    </span>
                    {memory.metadata.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="text-2xs text-vault-text-ghost px-1.5 py-0.5 rounded bg-vault-surface-hover"
                      >
                        {tag}
                      </span>
                    ))}
                    {memory.importance > 0.7 && (
                      <Star className="w-3 h-3 text-vault-accent" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Brain className="w-8 h-8 text-vault-text-ghost mx-auto mb-3" />
              <p className="text-sm text-vault-text-ghost">
                {search ? "No memories match your search" : "No memories yet"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
