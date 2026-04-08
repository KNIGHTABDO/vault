import { localChangelogEntries, type ChangelogEntry } from "@/lib/site-content";

type RemoteChangelogPayload =
  | ChangelogEntry[]
  | { releases?: ChangelogEntry[]; changelog?: ChangelogEntry[] };

function normalizeEntries(payload: RemoteChangelogPayload): ChangelogEntry[] {
  const candidate = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.releases)
      ? payload.releases
      : Array.isArray(payload.changelog)
        ? payload.changelog
        : [];

  return candidate
    .filter((entry) => entry && typeof entry.version === "string" && typeof entry.date === "string" && Array.isArray(entry.changes))
    .map((entry) => ({
      version: entry.version,
      date: entry.date,
      changes: entry.changes.filter((change) => typeof change === "string"),
    }))
    .filter((entry) => entry.changes.length > 0);
}

export async function getChangelogEntries(): Promise<ChangelogEntry[]> {
  const feedUrl = process.env.CHANGELOG_FEED_URL;
  if (!feedUrl) return localChangelogEntries;

  try {
    const response = await fetch(feedUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) return localChangelogEntries;

    const payload = (await response.json()) as RemoteChangelogPayload;
    const normalized = normalizeEntries(payload);

    if (!normalized.length) return localChangelogEntries;

    return normalized;
  } catch {
    return localChangelogEntries;
  }
}

export async function getChangelogSummary(limit = 3) {
  const entries = await getChangelogEntries();

  return entries
    .slice(0, Math.max(1, Math.min(limit, 6)))
    .map((entry) => {
      const bulletLines = entry.changes.slice(0, 5).map((change) => `- ${change}`).join("\n");
      return `v${entry.version} (${entry.date})\n${bulletLines}`;
    })
    .join("\n\n");
}
