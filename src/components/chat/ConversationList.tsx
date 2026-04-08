"use client";

import { useState } from "react";
import { motion } from "motion/react";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const grouped: Record<string, Conversation[]> = {};
  conversations.forEach((c) => {
    const key = formatDate(c.updated_at);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
            bg-gradient-to-r from-vault-500/20 to-vault-400/10 border border-vault-500/20
            text-vault-300 hover:border-vault-400/40 hover:text-vault-200
            transition-all duration-300 group"
        >
          <svg
            className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-4 scrollbar-thin">
        {Object.entries(grouped).map(([label, convs]) => (
          <div key={label}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-vault-500 px-2 mb-1.5">
              {label}
            </p>
            <div className="space-y-0.5">
              {conversations.map((conv) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="group relative"
                  onMouseEnter={() => setHoveredId(conv.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <button
                    onClick={() => onSelect(conv.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 truncate ${
                      activeId === conv.id
                        ? "bg-vault-500/15 text-vault-200 border border-vault-500/20"
                        : "text-vault-400 hover:bg-vault-800/50 hover:text-vault-300 border border-transparent"
                    }`}
                  >
                    {conv.title || "New Chat"}
                  </button>
                  {hoveredId === conv.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(conv.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded
                        text-vault-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
        {conversations.length === 0 && (
          <p className="text-vault-600 text-xs text-center py-8">No conversations yet</p>
        )}
      </div>
    </div>
  );
}
