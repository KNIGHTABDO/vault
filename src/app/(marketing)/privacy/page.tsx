import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-sm text-vault-text-tertiary mb-10">
          Last updated: April 2026
        </p>

        <div className="space-y-8 text-sm text-vault-text-secondary leading-relaxed">
          <section>
            <h2 className="text-base font-medium text-vault-text mb-3">
              Your Data
            </h2>
            <p>
              Vault stores all your data in your own Supabase instance. We do
              not have access to your conversations, memories, or uploaded files.
              Your data is yours.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-vault-text mb-3">
              AI Processing
            </h2>
            <p>
              When you use Vault, your messages are sent to Google Gemini and
              GitHub Copilot APIs for processing. These providers process your
              data according to their own privacy policies. We do not store API
              responses beyond your local session.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-vault-text mb-3">
              Memory Storage
            </h2>
            <p>
              Vault extracts and stores memories from your conversations to
              provide personalized responses. All memories are stored in your
              Supabase database and can be deleted at any time from the Memory
              page.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-vault-text mb-3">
              File Uploads
            </h2>
            <p>
              Uploaded files are stored in your Supabase Storage bucket and
              temporarily sent to the Gemini Files API for analysis. Files are
              deleted from Gemini&apos;s servers within 48 hours.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-vault-text mb-3">
              Analytics
            </h2>
            <p>
              Vault does not use any analytics or tracking services. We do not
              collect usage data, telemetry, or behavioral information.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-vault-text mb-3">
              Contact
            </h2>
            <p>
              If you have questions about this privacy policy, please open an
              issue on GitHub.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
