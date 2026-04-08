import Link from "next/link";
import { getChangelogEntries } from "@/lib/changelog";

export default async function ChangelogPage() {
  const releases = await getChangelogEntries();

  return (
    <div className="min-h-screen bg-vault-950 text-vault-100">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="font-display text-4xl text-vault-100">Changelog</h1>
          <p className="text-sm text-vault-400 mt-2">Product updates and improvements shipped in Vault.</p>
        </div>

        <div className="space-y-4">
          {releases.map((release) => (
            <section key={release.version} className="rounded-2xl border border-vault-800/40 bg-vault-900/40 p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="font-display text-2xl text-vault-200">v{release.version}</h2>
                <span className="text-xs text-vault-500">{new Date(release.date).toLocaleDateString()}</span>
              </div>
              <ul className="space-y-2 text-sm text-vault-300 list-disc list-inside">
                {release.changes.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
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
