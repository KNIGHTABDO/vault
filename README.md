# Vault

Vault is a production-ready personal AI workspace with chat, memory, tasks, and file grounding.

## Highlights

- Persistent user memory and task management
- Upload and semantic retrieval for supported files (including PDF)
- Streaming chat with visible thinking states and action feedback
- Mobile-ready app shell (drawer + bottom navigation)
- Privacy, Terms, and Changelog pages available in-app and on landing

## Tech Stack

- Next.js 15 (App Router), React 19, TypeScript
- Supabase (Auth, Postgres, Storage, pgvector)
- Gemini + Copilot orchestration
- Tailwind CSS v4 + Motion

## Environment Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment template:

```bash
cp .env.example .env
```

3. Fill required values in `.env`:

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_EMBEDDING_MODEL`
- `GITHUB_TOKEN` (optional, for direct Copilot routing)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `CHANGELOG_FEED_URL` (optional JSON feed for remote changelog)

## Database Setup

Run these migrations on Supabase in order:

- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_file_ingestion_and_chunks.sql`

## Local Development

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Quality Checks

```bash
npm run lint
```

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import the project in Vercel.
3. Set all environment variables from `.env.example`.
4. Deploy.

Deployment notes:

- `next.config.ts` is configured to include `scripts/extract-pdf.mjs` in output tracing.
- Supabase service role key must be set for server-side ingestion and embedding workflows.

## Repository Hygiene

- Keep secrets only in `.env` and Vercel env settings.
- Do not commit local fixture files or temporary parser/debug artifacts.

## License

MIT
