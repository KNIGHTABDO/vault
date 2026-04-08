"use client";

import { Sparkles } from "lucide-react";

interface EmptyStateProps {
  onPromptClick?: (prompt: string) => void;
}

const SUGGESTIONS = [
  "What do you remember about me?",
  "I have an exam next week, remind me to study",
  "Summarize this PDF for me",
  "What should I cook tonight?",
  "Set a reminder for tomorrow morning",
];

export function EmptyState({ onPromptClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center px-6">
      {/* Brand */}
      <div className="w-12 h-12 rounded-2xl bg-vault-surface border border-vault-border-subtle flex items-center justify-center mb-6">
        <Sparkles className="w-6 h-6 text-vault-accent" />
      </div>

      <h1 className="font-serif text-3xl text-vault-text tracking-tight mb-2">
        Vault
      </h1>
      <p className="text-sm text-vault-text-tertiary mb-10 leading-relaxed">
        Your AI, that actually knows you.
        <br />
        Drop files, ask questions, build your memory.
      </p>

      {/* Suggestions */}
      <div className="w-full space-y-1.5">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onPromptClick?.(suggestion)}
            className="w-full text-left px-4 py-3 rounded-xl text-sm text-vault-text-secondary hover:text-vault-text hover:bg-vault-surface-hover border border-transparent hover:border-vault-border-subtle transition-all duration-150"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
