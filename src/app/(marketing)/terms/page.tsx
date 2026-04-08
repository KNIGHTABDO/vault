import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-sm text-vault-text-tertiary mb-10">
          Last updated: April 2026
        </p>

        <div className="space-y-8 text-sm text-vault-text-secondary leading-relaxed">
          <section>
            <h2 className="text-base font-medium text-vault-text mb-3">
              Acceptance
            </h2>
            <p>
              By using Vault, you agree to these terms. If you do not agree,
              please do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-vault-text mb-3">
              Use of Service
            </h2>
            <p>
              Vault is provided as-is. You are responsible for your own data and
              API keys. We are not liable for any damages resulting from the use
              of this service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-vault-text mb-3">
              API Costs
            </h2>
            <p>
              Vault uses third-party AI APIs (Google Gemini, GitHub Copilot).
              You are responsible for any costs incurred through your use of
              these services.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-vault-text mb-3">
              Content
            </h2>
            <p>
              You retain all rights to the content you create and upload to
              Vault. We claim no ownership over your data.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-vault-text mb-3">
              Changes
            </h2>
            <p>
              We may update these terms from time to time. Continued use of
              Vault after changes constitutes acceptance of the new terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
