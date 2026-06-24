# AI Nav — Smart Navigation Panel

A self-hosted navigation homepage with **AI-powered URL organization**. Paste a bunch of URLs and Claude automatically extracts titles, descriptions, favicons, and intelligently categorizes them.

![Glassmorphism dark theme](https://img.shields.io/badge/theme-glassmorphism-dark) ![React](https://img.shields.io/badge/React-18-blue) ![Vite](https://img.shields.io/badge/Vite-6-purple) ![Express](https://img.shields.io/badge/Express-4-green) ![SQLite](https://img.shields.io/badge/SQLite-3-orange)

<p align="center">
  <img src="imgs/cover.png" alt="AI Nav Screenshot" width="100%" />
</p>

## Features

- **AI URL Recognition** — Paste 1-100 URLs, Claude analyzes and categorizes them automatically
- **Smart Categorization** — AI suggests categories; falls back to domain heuristics without API key
- **Glassmorphism UI** — Frosted glass cards on dark gradient backgrounds
- **Cmd+K Search** — Fuzzy search across all bookmarks
- **Bulk Import** — Paste mixed text, URLs are extracted automatically
- **Category Management** — Create, edit, delete categories with custom colors
- **Bookmark CRUD** — Full create, read, update, delete

## Quick Start

```bash
# Install dependencies (pnpm workspaces)
pnpm install

# Start both server and client
pnpm dev
```

Open http://localhost:5173

## AI Setup (Optional)

1. Click the ⚙️ Settings icon
2. Enter your [Anthropic API key](https://console.anthropic.com)
3. Paste URLs and click "Analyze URLs" — Claude will categorize them

Without an API key, basic heuristic categorization is used (domain-based pattern matching).

## Architecture

```
ai-nav/                          # pnpm workspaces + Turborepo monorepo
├── apps/
│   ├── web/                     # @ai-nav/web — React + Vite + Tailwind
│   │   ├── src/
│   │   │   ├── components/      # Dashboard, NavCard, AddUrlModal, SearchBar
│   │   │   ├── hooks/           # useBookmarks, useAI
│   │   │   └── styles/          # Glassmorphism CSS
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── api/                     # @ai-nav/api — Express + Claude API
│       ├── src/
│       │   ├── routes/          # REST API endpoints
│       │   └── services/        # Metadata extraction, AI categorization
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   ├── shared/                  # @ai-nav/shared — Types & constants
│   │   └── src/types.ts         # Bookmark, Category, AiSuggestion, etc.
│   └── db/                      # @ai-nav/db — SQLite schema & queries
│       ├── src/
│       │   ├── index.ts         # CRUD operations
│       │   └── schema.sql       # Table definitions
│       └── package.json
├── turbo.json                   # Turborepo task pipeline
├── pnpm-workspace.yaml          # Workspace definition
└── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookmarks` | List all bookmarks |
| POST | `/api/bookmarks` | Create a bookmark |
| POST | `/api/bookmarks/bulk` | Bulk create bookmarks |
| PUT | `/api/bookmarks/:id` | Update a bookmark |
| DELETE | `/api/bookmarks/:id` | Delete a bookmark |
| GET | `/api/categories` | List all categories |
| POST | `/api/categories` | Create a category |
| POST | `/api/ai/parse` | AI URL analysis |
| POST | `/api/ai/settings` | Save API key |

## Keyboard Shortcuts

- `⌘ K` — Search bookmarks
- `⌘ N` — Add bookmarks
- `ESC` — Close modals
