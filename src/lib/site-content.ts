export type ChangelogEntry = {
  version: string;
  date: string;
  changes: string[];
};

export const localChangelogEntries: ChangelogEntry[] = [
  {
    version: "0.1.3",
    date: "2026-04-08",
    changes: [
      "Fixed collapsed-sidebar account UI glitches and improved compact navigation behavior.",
      "Shipped mobile app shell upgrades: drawer navigation, sticky bottom nav, and tighter responsive spacing.",
      "Added skeleton loading states and a cleaner single-line shimmer thinking indicator.",
      "Unified legal/changelog discoverability through landing and in-app navigation links.",
      "Improved chat action reliability for memory, tasks, legal summaries, and changelog lookups.",
      "Prepared deployment tracing for server-side PDF extraction on Vercel.",
    ],
  },
  {
    version: "0.1.2",
    date: "2026-04-08",
    changes: [
      "Added robust PDF extraction and indexing fallback for improved file grounding.",
      "Improved chat orchestration with capability transparency and richer action feedback.",
      "Upgraded thinking and streaming UX with more visible progressive status states.",
      "Shipped manual and automatic reindex paths for recoverable file parsing failures.",
      "Connected Files, Memory, and Tasks pages to fully operational API routes.",
    ],
  },
  {
    version: "0.1.1",
    date: "2026-04-07",
    changes: [
      "Introduced authenticated chat layout with persistent sidebar navigation.",
      "Added conversation history persistence and message streaming.",
      "Initialized Supabase schema for conversations, messages, memories, files, and tasks.",
    ],
  },
];

export const privacySections: Array<{ title: string; body: string }> = [
  {
    title: "1. Data We Collect",
    body: "Vault stores account data, conversations, memories, files, and task records needed to deliver the service. Authentication is handled through Supabase.",
  },
  {
    title: "2. How We Use Data",
    body: "Your data is used to power personalization, maintain continuity across sessions, and provide product functionality such as memory retrieval, file context, and task management.",
  },
  {
    title: "3. Storage and Security",
    body: "Data is stored in Supabase with row-level security enabled so users can only access their own records. File access is scoped per user folder.",
  },
  {
    title: "4. Third-Party Services",
    body: "Vault routes AI requests through server-side integrations. API credentials are never exposed in client-side code.",
  },
  {
    title: "5. Assistant Actions and Automation",
    body: "When requested, Vault can execute product actions like storing memories and managing tasks. These actions are scoped to your account context and rely on authenticated server APIs.",
  },
  {
    title: "6. Data Retention",
    body: "Data remains in your account until you delete it. You can remove conversations, memories, files, and tasks from the product at any time.",
  },
  {
    title: "7. Your Rights",
    body: "You can request access, correction, or deletion of your personal data by contacting the project owner or administrator.",
  },
  {
    title: "8. Changes to This Policy",
    body: "We may update this policy as the product evolves. Material changes will be reflected in the changelog.",
  },
];

export const termsSections: Array<{ title: string; body: string }> = [
  {
    title: "1. Acceptance",
    body: "By using Vault, you agree to these terms and all applicable laws. If you do not agree, do not use the service.",
  },
  {
    title: "2. Account Responsibilities",
    body: "You are responsible for maintaining account security and for activity performed under your account credentials.",
  },
  {
    title: "3. Acceptable Use",
    body: "You must not use Vault for unlawful activities, abuse of service infrastructure, or submission of malicious content.",
  },
  {
    title: "4. Data and Content",
    body: "You retain ownership of your content. By submitting content, you grant Vault permission to process and store it only for service functionality.",
  },
  {
    title: "5. Product Features and Limits",
    body: "Feature behavior may vary by provider availability, user configuration, and platform limits. Vault may use fallback execution paths to complete requested actions safely.",
  },
  {
    title: "6. Service Availability",
    body: "Vault is provided on an \"as is\" basis. We may update, pause, or discontinue features when necessary for maintenance or security.",
  },
  {
    title: "7. Limitation of Liability",
    body: "To the fullest extent permitted by law, Vault is not liable for indirect or consequential damages arising from service use.",
  },
  {
    title: "8. Changes to Terms",
    body: "These terms may be revised over time. Continued use of Vault after updates means you accept the revised terms.",
  },
];

export function getPolicySummary(topic: "privacy" | "terms" | "all" = "all") {
  const sections = topic === "privacy"
    ? privacySections
    : topic === "terms"
      ? termsSections
      : [...privacySections, ...termsSections];

  return sections
    .map((section) => `${section.title}: ${section.body}`)
    .join("\n");
}
