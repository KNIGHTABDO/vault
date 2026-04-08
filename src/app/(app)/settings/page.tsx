import Link from "next/link";

export default function SettingsPage() {
  const sections = [
    { href: "/settings/profile", label: "Profile", desc: "Name, avatar, preferences", icon: "👤" },
    { href: "/settings/providers", label: "AI Providers", desc: "Configure API keys and models", icon: "🤖" },
    { href: "/settings/memory", label: "Memory", desc: "Manage stored memories", icon: "🧠" },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="font-display text-2xl text-vault-100 mb-6">Settings</h1>
      <div className="space-y-2">
        {sections.map(s => (
          <Link key={s.href} href={s.href}
            className="flex items-center gap-4 p-4 rounded-xl bg-vault-900/50 border border-vault-800/40 hover:border-vault-700/50 transition-all group">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-sm font-medium text-vault-200 group-hover:text-vault-100">{s.label}</p>
              <p className="text-xs text-vault-500">{s.desc}</p>
            </div>
            <svg className="w-4 h-4 text-vault-600 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
