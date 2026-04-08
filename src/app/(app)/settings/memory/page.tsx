"use client";

import { ArrowLeft, Brain, Trash2, Download, Shield } from "lucide-react";
import Link from "next/link";

export default function MemorySettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-lg mx-auto py-8 px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/settings"
            className="p-1.5 rounded-lg hover:bg-vault-surface-hover text-vault-text-ghost hover:text-vault-text-secondary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Brain className="w-5 h-5 text-vault-accent" />
          <h1 className="text-lg font-medium text-vault-text">Memory</h1>
        </div>

        <p className="text-sm text-vault-text-tertiary mb-8">
          Control how Vault remembers and stores information about you.
        </p>

        {/* Memory stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="p-4 rounded-xl border border-vault-border-subtle bg-vault-surface text-center">
            <p className="text-lg font-medium text-vault-text">12</p>
            <p className="text-2xs text-vault-text-ghost mt-0.5">Memories</p>
          </div>
          <div className="p-4 rounded-xl border border-vault-border-subtle bg-vault-surface text-center">
            <p className="text-lg font-medium text-vault-text">3</p>
            <p className="text-2xs text-vault-text-ghost mt-0.5">People</p>
          </div>
          <div className="p-4 rounded-xl border border-vault-border-subtle bg-vault-surface text-center">
            <p className="text-lg font-medium text-vault-text">2</p>
            <p className="text-2xs text-vault-text-ghost mt-0.5">Events</p>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-1">
          <div className="flex items-center justify-between p-4 rounded-xl border border-vault-border-subtle bg-vault-surface">
            <div>
              <p className="text-sm text-vault-text">Auto-save memories</p>
              <p className="text-xs text-vault-text-ghost mt-0.5">
                Automatically extract and save memories from conversations
              </p>
            </div>
            <div className="w-10 h-5 rounded-full bg-vault-accent relative cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-black absolute top-0.5 right-0.5" />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-vault-border-subtle bg-vault-surface">
            <div>
              <p className="text-sm text-vault-text">Memory recall in chat</p>
              <p className="text-xs text-vault-text-ghost mt-0.5">
                Search memory before responding to provide context
              </p>
            </div>
            <div className="w-10 h-5 rounded-full bg-vault-accent relative cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-black absolute top-0.5 right-0.5" />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-vault-border-subtle bg-vault-surface">
            <div>
              <p className="text-sm text-vault-text">Weekly compression</p>
              <p className="text-xs text-vault-text-ghost mt-0.5">
                Summarize old memories to keep storage lean
              </p>
            </div>
            <div className="w-10 h-5 rounded-full bg-vault-surface-hover relative cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-vault-text-ghost absolute top-0.5 left-0.5" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-3">
          <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-vault-border-subtle bg-vault-surface hover:bg-vault-surface-hover transition-colors text-left">
            <Download className="w-4 h-4 text-vault-text-tertiary" />
            <div>
              <p className="text-sm text-vault-text">Export memories</p>
              <p className="text-2xs text-vault-text-ghost">
                Download all memories as JSON
              </p>
            </div>
          </button>

          <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-vault-border-subtle bg-vault-surface hover:bg-vault-surface-hover transition-colors text-left">
            <Shield className="w-4 h-4 text-vault-text-tertiary" />
            <div>
              <p className="text-sm text-vault-text">Data privacy</p>
              <p className="text-2xs text-vault-text-ghost">
                Learn how your memory data is stored
              </p>
            </div>
          </button>
        </div>

        {/* Danger */}
        <div className="mt-8 pt-6 border-t border-vault-border-subtle">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs text-vault-error border border-vault-error/20 hover:bg-vault-error/5 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
            Clear all memories
          </button>
          <p className="text-2xs text-vault-text-ghost mt-2">
            This will permanently delete all stored memories. This cannot be undone.
          </p>
        </div>
      </div>
    </div>
  );
}
