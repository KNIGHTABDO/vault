"use client";

import { useState, useEffect } from "react";

export default function MemorySettings() {
  const [memories, setMemories] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/memories");
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="font-display text-2xl text-vault-100 mb-2">Memory</h1>
      <p className="text-sm text-vault-400 mb-6">Vault remembers things so your AI doesn&apos;t have to start from zero.</p>
      <div className="bg-vault-900/50 border border-vault-800/40 rounded-xl p-5">
        <p className="text-sm text-vault-300 mb-2">{memories.length} memories stored</p>
        <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
          {memories.map((m: any) => (
            <div key={m.id} className="p-3 rounded-lg bg-vault-800/30 border border-vault-700/20">
              <p className="text-xs font-medium text-vault-300">{m.key}</p>
              <p className="text-xs text-vault-400 mt-1 truncate">{m.content}</p>
            </div>
          ))}
          {memories.length === 0 && <p className="text-xs text-vault-500 text-center py-4">No memories yet. Start chatting to create some!</p>}
        </div>
      </div>
    </div>
  );
}
