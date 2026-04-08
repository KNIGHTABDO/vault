import Link from "next/link";
import { privacySections } from "@/lib/site-content";

const effectiveDate = "April 8, 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-vault-950 text-vault-100">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display text-4xl text-vault-100 mb-2">Privacy Policy</h1>
        <p className="text-sm text-vault-500 mb-8">Effective date: {effectiveDate}</p>

        <div className="space-y-6 text-sm leading-relaxed text-vault-300">
          {privacySections.map((section) => (
            <section key={section.title}>
              <h2 className="font-medium text-vault-100 mb-2">{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>

        <Link href="/" className="inline-block mt-8 text-sm text-vault-300 hover:text-vault-200">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
