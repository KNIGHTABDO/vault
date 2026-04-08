"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, RotateCcw, Bookmark, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
interface MessageBubbleProps {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attachments?: any;
  toolCalls?: { name: string; args: Record<string, unknown> }[];
  onRetry?: () => void;
  onSaveToMemory?: () => void;
}

export function MessageBubble({
  role,
  content,
  attachments,
  toolCalls,
  onRetry,
  onSaveToMemory,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end group">
        <div className="max-w-[80%] space-y-2">
          <div className="px-4 py-2.5 rounded-2xl rounded-br-md bg-vault-surface-hover text-vault-text text-[15px] leading-relaxed">
            {content}
          </div>
          {/* Attached files */}
          {attachments && Array.isArray(attachments) && (attachments as unknown[]).length > 0 && (
            <div className="flex gap-1.5 justify-end">
              {(attachments as { name: string }[]).map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-vault-surface border border-vault-border-subtle text-2xs text-vault-text-secondary"
                >
                  <span className="truncate max-w-[100px]">{file.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex justify-start group">
      <div className="max-w-[80%] space-y-2">
        {/* Tool calls */}
        {toolCalls && toolCalls.length > 0 && (
          <div className="space-y-1.5">
            {toolCalls.map((tool, i) => (
              <ToolCallCard key={i} name={tool.name} args={tool.args} />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="prose-vault">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>

        {/* Actions — visible on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-vault-surface-hover text-vault-text-ghost hover:text-vault-text-secondary transition-colors"
            title="Copy"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-vault-success" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          {onRetry && (
            <button
              onClick={onRetry}
              className="p-1.5 rounded-md hover:bg-vault-surface-hover text-vault-text-ghost hover:text-vault-text-secondary transition-colors"
              title="Retry"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {onSaveToMemory && (
            <button
              onClick={onSaveToMemory}
              className="p-1.5 rounded-md hover:bg-vault-surface-hover text-vault-text-ghost hover:text-vault-text-secondary transition-colors"
              title="Save to memory"
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Tool call display
function ToolCallCard({
  name,
  args,
}: {
  name: string;
  args: Record<string, unknown>;
}) {
  const toolIcons: Record<string, string> = {
    search_web: "🔍",
    search_memory: "🧠",
    save_memory: "💾",
    analyze_file: "📎",
    create_task: "📋",
    list_tasks: "📋",
    read_url: "🌐",
  };

  const toolLabels: Record<string, (args: Record<string, unknown>) => string> = {
    search_web: (a) => `Searched: "${a.query}"`,
    search_memory: (a) => `Checked memory: "${a.query}"`,
    save_memory: (a) => `Saved: "${a.content}"`,
    analyze_file: () => "Analyzed file",
    create_task: (a) => `Created task: "${a.content}"`,
    list_tasks: () => "Fetched tasks",
    read_url: (a) => `Read: ${a.url}`,
  };

  const icon = toolIcons[name] || "⚡";
  const label = toolLabels[name]?.(args) || name;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-vault-surface border border-vault-border-subtle text-xs text-vault-text-secondary">
      <span className="text-sm">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}
