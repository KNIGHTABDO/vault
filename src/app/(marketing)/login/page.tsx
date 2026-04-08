import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-vault-bg flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10 justify-center">
          <div className="w-8 h-8 rounded-lg bg-vault-accent flex items-center justify-center">
            <span className="text-sm font-bold text-black">V</span>
          </div>
          <span className="text-lg font-medium text-vault-text tracking-tight">
            Vault
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-xl font-medium text-vault-text text-center mb-1.5">
          Welcome back
        </h1>
        <p className="text-sm text-vault-text-tertiary text-center mb-8">
          Sign in to your Vault
        </p>

        {/* Form */}
        <form className="space-y-4">
          <div>
            <label className="block text-xs text-vault-text-secondary mb-1.5">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-vault-surface border border-vault-border-subtle text-sm text-vault-text placeholder:text-vault-text-ghost outline-none focus:border-vault-border-hover transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-vault-text-secondary">
                Password
              </label>
              <button
                type="button"
                className="text-2xs text-vault-text-ghost hover:text-vault-accent transition-colors"
              >
                Forgot?
              </button>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-vault-surface border border-vault-border-subtle text-sm text-vault-text placeholder:text-vault-text-ghost outline-none focus:border-vault-border-hover transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-vault-accent hover:bg-vault-accent-hover text-black text-sm font-medium transition-colors duration-150"
          >
            Sign in
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-vault-border-subtle" />
          <span className="text-2xs text-vault-text-ghost uppercase tracking-wider">
            or
          </span>
          <div className="flex-1 h-px bg-vault-border-subtle" />
        </div>

        {/* GitHub OAuth */}
        <button className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-vault-surface border border-vault-border-subtle hover:border-vault-border text-sm text-vault-text-secondary hover:text-vault-text transition-all duration-150">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Continue with GitHub
        </button>

        {/* Footer */}
        <p className="text-xs text-vault-text-ghost text-center mt-8">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-vault-accent hover:text-vault-accent-hover transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
