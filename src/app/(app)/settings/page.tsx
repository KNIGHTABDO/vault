import Link from "next/link";
import { Settings, User, Key, Brain, Palette } from "lucide-react";

export default function SettingsPage() {
  const sections = [
    { href: "/settings/profile", icon: User, label: "Profile", description: "Your name and preferences" },
    { href: "/settings/providers", icon: Key, label: "AI Providers", description: "Configure Gemini and Copilot" },
    { href: "/settings/memory", icon: Brain, label: "Memory", description: "Manage what Vault remembers" },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto py-8 px-6">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-5 h-5 text-vault-accent" />
          <h1 className="text-lg font-medium text-vault-text">Settings</h1>
        </div>

        <div className="space-y-1">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="flex items-center gap-4 p-4 rounded-xl border border-vault-border-subtle bg-vault-surface hover:bg-vault-surface-hover transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-vault-surface-hover flex items-center justify-center flex-shrink-0">
                <section.icon className="w-4 h-4 text-vault-text-tertiary" />
              </div>
              <div>
                <p className="text-sm text-vault-text">{section.label}</p>
                <p className="text-xs text-vault-text-ghost">{section.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-vault-border-subtle">
          <p className="text-2xs text-vault-text-ghost text-center">
            Vault v0.1.0 · Built with care
          </p>
        </div>
      </div>
    </div>
  );
}
