import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ChangelogEntry {
  version: string;
  date: string;
  changes: { type: "added" | "improved" | "fixed"; text: string }[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.1.0",
    date: "April 2026",
    changes: [
      { type: "added", text: "Chat interface with streaming responses" },
      { type: "added", text: "Multimodal file upload (images, audio, video, PDFs)" },
      { type: "added", text: "Persistent memory system with semantic search" },
      { type: "added", text: "Web search via Google Search grounding" },
      { type: "added", text: "Task creation and management" },
      { type: "added", text: "Dual AI provider support (Gemini + Copilot)" },
      { type: "added", text: "Premium dark theme design system" },
      { type: "added", text: "Landing page, Privacy, and Terms pages" },
    ],
  },
];

const CHANGE_TYPE_COLORS = {
  added: "text-vault-success",
  improved: "text-vault-accent",
  fixed: "text-vault-info",
};

const CHANGE_TYPE_LABELS = {
  added: "Added",
  improved: "Improved",
  fixed: "Fixed",
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-vault-bg">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-vault-text-tertiary hover:text-vault-text-secondary transition-colors mb-10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>

        <h1 className="font-serif text-3xl text-vault-text tracking-tight mb-2">
          Changelog
        </h1>
        <p className="text-sm text-vault-text-tertiary mb-12">
          What&apos;s new in Vault
        </p>

        <div className="space-y-12">
          {CHANGELOG.map((entry) => (
            <div key={entry.version}>
              <div className="flex items-baseline gap-3 mb-4">
                <h2 className="text-lg font-medium text-vault-text">
                  v{entry.version}
                </h2>
                <span className="text-xs text-vault-text-ghost">
                  {entry.date}
                </span>
              </div>

              <div className="space-y-2">
                {entry.changes.map((change, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span
                      className={`text-2xs font-medium uppercase tracking-wider mt-0.5 ${CHANGE_TYPE_COLORS[change.type]}`}
                    >
                      {CHANGE_TYPE_LABELS[change.type]}
                    </span>
                    <span className="text-sm text-vault-text-secondary">
                      {change.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
