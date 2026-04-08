# Vault

**Your AI, that actually knows you.**

Vault is a personal AI assistant with persistent memory, multimodal understanding, and real tool usage. It remembers everything you share — files, notes, voice, photos — and becomes the most personal AI you've ever used.

![Vault Preview](public/og.png)

## Features

- **Persistent Memory** — Vault remembers every conversation, file, and detail
- **Multimodal Intake** — Upload images, audio, video, PDFs — Gemini handles it all
- **Tool Usage** — Web search, task creation, file analysis, URL reading
- **Dual AI Providers** — Gemini for multimodal + search, Copilot for writing + reasoning
- **Premium Design** — Dark, minimal, Anthropic-level UI with Geist fonts

## Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Animation:** Motion (Framer Motion)
- **Database:** Supabase (PostgreSQL + pgvector)
- **AI:** Google Gemini 2.0 Flash + GitHub Copilot (GPT-4o)
- **Fonts:** Geist Sans + Instrument Serif

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/KNIGHTABDO/vault.git
cd vault
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your API keys:

- **GOOGLE_API_KEY** — Get from [Google AI Studio](https://aistudio.google.com/apikey)
- **COPILOT_API_KEY** — Get from [copilot-api](https://github.com/ericc-ch/copilot-api)
- **Supabase keys** — Get from your [Supabase project](https://supabase.com)

### 3. Set up the database

Run `supabase/migrations/001_initial_schema.sql` in your Supabase SQL Editor.

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
vault/
├── app/
│   ├── (marketing)/     # Landing, Privacy, Terms, Changelog
│   ├── (app)/           # Authenticated app (chat, memory, files, tasks, settings)
│   └── api/             # API routes (chat, upload, memory, tools)
├── components/
│   ├── chat/            # ChatInput, MessageBubble, EmptyState
│   ├── sidebar/         # Navigation sidebar
│   └── ui/              # shadcn/ui base components
├── lib/
│   ├── ai/
│   │   ├── providers/   # Gemini + Copilot SDK wrappers
│   │   ├── tools/       # Tool implementations
│   │   ├── prompts/     # System prompts
│   │   └── router.ts    # Decides which provider to use
│   ├── memory/          # Memory storage, retrieval, compression
│   ├── files/           # File upload and processing
│   └── db/              # Supabase client + types
└── supabase/
    └── migrations/      # Database schema
```

## AI Providers

| Provider | Models | Used For |
|----------|--------|----------|
| **Google Gemini** | 2.0 Flash, 2.5 Pro | Multimodal, search, file analysis, summarization |
| **GitHub Copilot** | GPT-4o (via proxy) | Writing, reasoning, complex conversation |

## Design System

- **Background:** `#09090B` (near black)
- **Surface:** `#0F0F12` (cards, panels)
- **Text:** `#FAFAFA` (warm white)
- **Accent:** `#F59E0B` (warm amber — no AI purple)
- **Fonts:** Geist Sans (UI), Instrument Serif (headings)

## License

MIT
