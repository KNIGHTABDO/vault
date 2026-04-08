import Link from "next/link";
import { ArrowRight, Brain, Shield, Sparkles, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-vault-bg">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-vault-border-subtle">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-vault-accent flex items-center justify-center">
              <span className="text-xs font-bold text-black">V</span>
            </div>
            <span className="text-sm font-medium text-vault-text tracking-tight">
              Vault
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/changelog"
              className="text-sm text-vault-text-tertiary hover:text-vault-text-secondary transition-colors"
            >
              Changelog
            </Link>
            <Link
              href="/login"
              className="text-sm text-vault-text-tertiary hover:text-vault-text-secondary transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/chat"
              className="text-sm px-4 py-1.5 rounded-lg bg-vault-surface-hover text-vault-text-secondary hover:text-vault-text border border-vault-border-subtle hover:border-vault-border transition-all duration-150"
            >
              Open App →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-serif text-5xl md:text-6xl text-vault-text tracking-tight leading-[1.1] mb-6">
            Your AI, that
            <br />
            actually knows you.
          </h1>
          <p className="text-base text-vault-text-secondary leading-relaxed mb-10 max-w-md mx-auto">
            Vault remembers everything you share — files, notes, voice, photos —
            and becomes the most personal AI you&apos;ve ever used.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-vault-accent hover:bg-vault-accent-hover text-black text-sm font-medium transition-colors duration-150"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Screenshot placeholder */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="rounded-xl border border-vault-border-subtle bg-vault-surface overflow-hidden shadow-2xl">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-vault-border-subtle">
              <div className="w-2.5 h-2.5 rounded-full bg-vault-text-ghost" />
              <div className="w-2.5 h-2.5 rounded-full bg-vault-text-ghost" />
              <div className="w-2.5 h-2.5 rounded-full bg-vault-text-ghost" />
            </div>
            <div className="p-8 flex items-center justify-center h-[300px]">
              <div className="text-center">
                <Sparkles className="w-10 h-10 text-vault-accent mx-auto mb-4 opacity-50" />
                <p className="text-sm text-vault-text-ghost">
                  [App preview will appear here]
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Brain}
              title="Remembers everything"
              description="Every conversation, file, and detail is stored in memory. Vault never forgets."
            />
            <FeatureCard
              icon={Zap}
              title="Takes action"
              description="Search the web, create tasks, analyze files. Vault does things, not just talks."
            />
            <FeatureCard
              icon={Shield}
              title="Your data, your control"
              description="Everything is stored in your own Supabase instance. No data leaves your hands."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-md mx-auto text-center">
          <h2 className="font-serif text-2xl text-vault-text tracking-tight mb-4">
            Start building your memory.
          </h2>
          <p className="text-sm text-vault-text-tertiary mb-8">
            The more you use Vault, the smarter it gets about you.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-vault-accent hover:bg-vault-accent-hover text-black text-sm font-medium transition-colors duration-150"
          >
            Open Vault
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-vault-border-subtle py-8 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-vault-text-ghost">
          <span>© 2026 Vault</span>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-vault-text-tertiary transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-vault-text-tertiary transition-colors">
              Terms
            </Link>
            <Link href="/changelog" className="hover:text-vault-text-tertiary transition-colors">
              Changelog
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl border border-vault-border-subtle bg-vault-surface hover:bg-vault-surface-hover transition-colors duration-150">
      <Icon className="w-5 h-5 text-vault-accent mb-4" />
      <h3 className="text-sm font-medium text-vault-text mb-2">{title}</h3>
      <p className="text-sm text-vault-text-tertiary leading-relaxed">
        {description}
      </p>
    </div>
  );
}
