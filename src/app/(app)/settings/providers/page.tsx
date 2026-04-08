"use client";

import { ArrowLeft, Key, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface Provider {
  id: string;
  name: string;
  description: string;
  models: string[];
  status: "connected" | "not_connected" | "error";
}

const PROVIDERS: Provider[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Multimodal AI — handles images, audio, video, PDFs, and web search",
    models: ["gemini-2.5-flash", "gemini-2.5-pro"],
    status: "not_connected",
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    description: "GPT-4o via copilot-api proxy — writing, reasoning, conversation",
    models: ["gpt-4o"],
    status: "not_connected",
  },
];

export default function ProvidersPage() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const toggleKey = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
          <Key className="w-5 h-5 text-vault-accent" />
          <h1 className="text-lg font-medium text-vault-text">AI Providers</h1>
        </div>

        <p className="text-sm text-vault-text-tertiary mb-8">
          Vault uses two AI providers. Configure your API keys below.
        </p>

        {/* Provider cards */}
        <div className="space-y-4">
          {PROVIDERS.map((provider) => (
            <div
              key={provider.id}
              className="p-5 rounded-xl border border-vault-border-subtle bg-vault-surface"
            >
              {/* Provider header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-medium text-vault-text">
                      {provider.name}
                    </h2>
                    {provider.status === "connected" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-vault-success" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-vault-text-ghost" />
                    )}
                  </div>
                  <p className="text-xs text-vault-text-tertiary mt-0.5">
                    {provider.description}
                  </p>
                </div>
              </div>

              {/* Models */}
              <div className="mb-4">
                <p className="text-2xs text-vault-text-ghost uppercase tracking-wider mb-1.5">
                  Models
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {provider.models.map((model) => (
                    <span
                      key={model}
                      className="text-2xs text-vault-text-secondary px-2 py-0.5 rounded-md bg-vault-surface-hover border border-vault-border-subtle font-mono"
                    >
                      {model}
                    </span>
                  ))}
                </div>
              </div>

              {/* API Key input */}
              <div>
                <p className="text-2xs text-vault-text-ghost uppercase tracking-wider mb-1.5">
                  API Key
                </p>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showKeys[provider.id] ? "text" : "password"}
                      placeholder={
                        provider.id === "gemini"
                          ? "AIza..."
                          : "your-copilot-token"
                      }
                      className="w-full px-3.5 py-2 rounded-lg bg-vault-bg border border-vault-border-subtle text-sm text-vault-text placeholder:text-vault-text-ghost outline-none focus:border-vault-border-hover transition-colors font-mono"
                    />
                  </div>
                  <button
                    onClick={() => toggleKey(provider.id)}
                    className="p-2 rounded-lg hover:bg-vault-surface-hover text-vault-text-ghost hover:text-vault-text-secondary transition-colors"
                  >
                    {showKeys[provider.id] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Save */}
        <div className="mt-6">
          <button className="px-5 py-2.5 rounded-xl bg-vault-accent hover:bg-vault-accent-hover text-black text-sm font-medium transition-colors duration-150">
            Save API keys
          </button>
        </div>

        {/* Help */}
        <div className="mt-8 p-4 rounded-xl bg-vault-surface border border-vault-border-subtle">
          <p className="text-xs text-vault-text-secondary mb-2 font-medium">
            How to get your keys
          </p>
          <ul className="space-y-1.5 text-xs text-vault-text-tertiary">
            <li>
              <span className="text-vault-text-secondary">Gemini →</span>{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-vault-accent hover:underline"
              >
                Google AI Studio
              </a>
            </li>
            <li>
              <span className="text-vault-text-secondary">Copilot →</span>{" "}
              <a
                href="https://github.com/ericc-ch/copilot-api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-vault-accent hover:underline"
              >
                copilot-api proxy
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
