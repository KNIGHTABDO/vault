import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-vault-bg flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-2xl bg-vault-surface border border-vault-border-subtle flex items-center justify-center mx-auto mb-6">
          <Compass className="w-6 h-6 text-vault-text-ghost" />
        </div>

        <h1 className="font-serif text-4xl text-vault-text tracking-tight mb-2">
          404
        </h1>
        <p className="text-sm text-vault-text-tertiary mb-8 leading-relaxed">
          This page doesn&apos;t exist.
          <br />
          Maybe it was moved, or maybe you mistyped.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-vault-surface border border-vault-border-subtle hover:border-vault-border text-sm text-vault-text-secondary hover:text-vault-text transition-all duration-150"
        >
          <ArrowLeft className="w-4 h-4" />
          Go home
        </Link>
      </div>
    </div>
  );
}
