# Contributing to Vault

Thanks for your interest in contributing to Vault! This guide will help you get started.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/vault.git`
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env.local` and fill in your API keys
5. Run the development server: `npm run dev`

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase account (for database)
- Google Gemini API key
- GitHub Copilot access (via [copilot-api](https://github.com/ericc-ch/copilot-api))

### Database Setup

1. Create a new Supabase project
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL Editor
3. Copy your Supabase URL and keys to `.env.local`

## Project Structure

```
vault/
├── app/                    # Next.js App Router pages
│   ├── (marketing)/        # Public pages (landing, privacy, terms, changelog)
│   ├── (app)/              # Authenticated app (chat, memory, files, tasks, settings)
│   └── api/                # API routes
├── components/             # React components
│   ├── chat/               # Chat interface components
│   ├── sidebar/            # Navigation
│   └── ui/                 # shadcn/ui base components
├── lib/                    # Core logic
│   ├── ai/                 # AI providers, tools, prompts, router
│   ├── memory/             # Memory system
│   ├── files/              # File handling
│   └── db/                 # Database client and types
└── supabase/               # Database migrations
```

## Design System

- **Background:** `#09090B` (near black)
- **Surface:** `#0F0F12` (cards, panels)
- **Text:** `#FAFAFA` (warm white)
- **Accent:** `#F59E0B` (warm amber)
- **Fonts:** Geist Sans (UI), Instrument Serif (headings)

Please follow the existing design system. No purple. No neon. Premium and minimal.

## Code Style

- TypeScript for everything
- Tailwind CSS for styling
- shadcn/ui for base components
- Functional components with hooks
- Server Components where possible (Next.js App Router)

## Pull Requests

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly: `npm run build`
4. Commit with a clear message
5. Push to your fork
6. Open a Pull Request

## Reporting Issues

Please open an issue on GitHub with:
- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
