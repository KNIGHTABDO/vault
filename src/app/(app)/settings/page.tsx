import Link from "next/link";
import { Settings, User, Key, Brain, Palette, Bell, Shield, LogOut } from "lucide-react";

export default function SettingsPage() {
  const sections = [
    {
      group: "Account",
      items: [
        { href: "/settings/profile", icon: User, label: "Profile", description: "Name, avatar, language" },
        { href: "/settings/providers", icon: Key, label: "AI Providers", description: "Configure Gemini and Copilot API keys" },
      ],
    },
    {
      group: "Intelligence",
      items: [
        { href: "/settings/memory", icon: Brain, label: "Memory", description: "Control what Vault remembers" },
      ],
    },
    {
      group: "App",
      items: [
        { href: "/privacy", icon: Shield, label: "Privacy Policy", description: "How your data is handled" },
        { href: "/terms", icon: Shield, label: "Terms of Service", description: "Usage terms" },
        { href: "/changelog", icon: Bell, label: "Changelog", description: "What's new in Vault" },
      ],
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-lg mx-auto py-8 px-6">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-5 h-5 text-vault-accent" />
          <h1 className="text-lg font-medium text-vault-text">Settings</h1>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.group}>
              <p className="text-2xs text-vault-text-ghost uppercase tracking-wider mb-2 px-1">
                {section.group}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-vault-surface-hover transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-vault-surface border border-vault-border-subtle flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-vault-text-tertiary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-vault-text">{item.label}</p>
                      <p className="text-2xs text-vault-text-ghost truncate">{item.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sign out */}
        <div className="mt-8 pt-6 border-t border-vault-border-subtle">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-vault-text-tertiary hover:text-vault-error hover:bg-vault-error/5 transition-colors">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>

        {/* Version */}
        <div className="mt-8">
          <p className="text-2xs text-vault-text-ghost text-center">
            Vault v0.1.1 · Built with care
          </p>
        </div>
      </div>
    </div>
  );
}
