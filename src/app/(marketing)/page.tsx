"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { VaultLogo } from "@/components/VaultLogo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-vault-950 text-vault-100 flex flex-col relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-150 h-150 rounded-full bg-vault-500/[0.04] blur-3xl" />
        <div className="absolute top-0 right-0 w-100 h-100 rounded-full bg-vault-400/[0.03] blur-3xl" />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <VaultLogo size="sm" animate={false} />
          <span className="font-display text-lg text-vault-300">vault</span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-sm text-vault-500">
          <Link href="/changelog" className="hover:text-vault-300 transition-colors">Changelog</Link>
          <Link href="/privacy" className="hover:text-vault-300 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-vault-300 transition-colors">Terms</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-vault-400 hover:text-vault-200 transition-colors">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm px-4 py-2 rounded-lg bg-vault-500/15 border border-vault-500/30 text-vault-300
              hover:bg-vault-500/25 hover:border-vault-400/40 transition-all duration-300"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <div className="relative z-10 md:hidden px-6 -mt-1 mb-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-vault-500">
          <Link href="/changelog" className="hover:text-vault-300 transition-colors">Changelog</Link>
          <Link href="/privacy" className="hover:text-vault-300 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-vault-300 transition-colors">Terms</Link>
        </div>
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="mb-8 inline-block"
          >
            <div className="w-24 h-24 mx-auto rounded-2xl bg-vault-500/15 border border-vault-500/30 flex items-center justify-center
              shadow-[0_0_60px_rgba(168,139,107,0.15)]">
              <VaultLogo size="lg" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="font-display text-5xl md:text-6xl lg:text-7xl text-vault-100 mb-6 leading-tight"
          >
            Your AI, that actually{" "}
            <span className="text-vault-400">knows you.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-lg md:text-xl text-vault-400 mb-10 max-w-xl mx-auto leading-relaxed"
          >
            Private. Contextual. Yours. Vault remembers so your AI doesn&apos;t have to start from zero every time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/signup"
              className="px-8 py-3.5 rounded-xl font-medium text-sm
                bg-vault-500/20 border border-vault-500/30 text-vault-200
                hover:bg-vault-500/30 hover:border-vault-400/40
                shadow-[0_0_30px_rgba(168,139,107,0.1)] hover:shadow-[0_0_40px_rgba(168,139,107,0.2)]
                transition-all duration-300"
            >
              Start Building →
            </Link>
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-xl font-medium text-sm text-vault-400
                border border-vault-800 hover:border-vault-600 hover:text-vault-300
                transition-all duration-300"
            >
              Sign In
            </Link>
          </motion.div>
        </motion.div>
      </main>

      <footer className="relative z-10 py-6 text-center text-xs text-vault-600 space-y-2">
        <div className="flex items-center justify-center gap-4">
          <Link href="/changelog" className="hover:text-vault-300 transition-colors">Changelog</Link>
          <Link href="/privacy" className="hover:text-vault-300 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-vault-300 transition-colors">Terms</Link>
        </div>
        <p>Built with open source — because your data shouldn&apos;t be locked away.</p>
      </footer>
    </div>
  );
}
