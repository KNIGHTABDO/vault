"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      router.push("/chat");
      router.refresh();
    } catch { setError("Network error"); setLoading(false); }
  }

  async function handleGitHubLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=/chat` },
    });
  }

  return (
    <div className="bg-vault-900/50 border border-vault-700/40 rounded-2xl p-6 backdrop-blur-sm shadow-2xl">
      <h1 className="font-display text-2xl text-vault-100 mb-1">Welcome back</h1>
      <p className="text-sm text-vault-400 mb-6">Sign in to continue to Vault</p>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

      <button onClick={handleGitHubLogin} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-vault-200 bg-vault-800/50 border border-vault-700/40 hover:bg-vault-700/50 transition-all duration-200 mb-4">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
        Continue with GitHub
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-vault-700/30" />
        <span className="text-xs text-vault-500">or</span>
        <div className="flex-1 h-px bg-vault-700/30" />
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-3">
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required
          className="w-full px-4 py-3 rounded-xl bg-vault-800/50 border border-vault-700/40 text-vault-100 placeholder-vault-500 text-sm focus:outline-none focus:border-vault-500/50 transition-colors" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required
          className="w-full px-4 py-3 rounded-xl bg-vault-800/50 border border-vault-700/40 text-vault-100 placeholder-vault-500 text-sm focus:outline-none focus:border-vault-500/50 transition-colors" />
        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-medium bg-vault-500/20 border border-vault-500/30 text-vault-200 hover:bg-vault-500/30 disabled:opacity-50 transition-all duration-200">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-center text-sm text-vault-500 mt-4">
        Don&apos;t have an account? <Link href="/signup" className="text-vault-300 hover:text-vault-200">Sign up</Link>
      </p>
    </div>
  );
}
