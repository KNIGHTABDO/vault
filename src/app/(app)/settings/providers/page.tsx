"use client";

import { useState } from "react";

export default function ProvidersSettings() {
  const [showGemini, setShowGemini] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="font-display text-2xl text-vault-100 mb-6">AI Providers</h1>
      <div className="space-y-4">
        <div className="bg-vault-900/50 border border-vault-800/40 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-lg">🔷</div>
            <div>
              <p className="text-sm font-medium text-vault-200">Google Gemini</p>
              <p className="text-xs text-vault-500">Default provider</p>
            </div>
            <span className="ml-auto text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Configured</span>
          </div>
          <div className="flex items-center gap-2">
            <input type={showGemini ? "text" : "password"} value={process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "Set in .env.local"} readOnly
              className="flex-1 px-3 py-2 rounded-lg bg-vault-800/50 border border-vault-700/30 text-vault-400 text-xs font-mono" />
            <button onClick={() => setShowGemini(!showGemini)} className="p-2 rounded-lg hover:bg-vault-800/50 text-vault-500">
              {showGemini ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <div className="bg-vault-900/50 border border-vault-800/40 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-lg">🐙</div>
            <div>
              <p className="text-sm font-medium text-vault-200">GitHub Copilot</p>
              <p className="text-xs text-vault-500">Via copilot-api proxy</p>
            </div>
            <span className="ml-auto text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Optional</span>
          </div>
          <div className="flex items-center gap-2">
            <input type={showCopilot ? "text" : "password"} value={process.env.NEXT_PUBLIC_COPILOT_API_URL || "http://localhost:4141/v1"} readOnly
              className="flex-1 px-3 py-2 rounded-lg bg-vault-800/50 border border-vault-700/30 text-vault-400 text-xs font-mono" />
            <button onClick={() => setShowCopilot(!showCopilot)} className="p-2 rounded-lg hover:bg-vault-800/50 text-vault-500">
              {showCopilot ? "🙈" : "👁️"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
