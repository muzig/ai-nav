# CLAUDE.md — AI Nav

## Project Overview

Self-hosted navigation homepage with AI-powered URL organization. Paste URLs and Claude automatically extracts metadata and categorizes them.

**Stack**: TypeScript monorepo (Turborepo + pnpm workspaces)
- **Frontend** (`apps/web`): React 18 + Vite + TailwindCSS + dnd-kit
- **Backend** (`apps/api`): Express + Anthropic SDK + Cheerio
- **Database** (`packages/db`): SQLite via better-sqlite3
- **Shared** (`packages/shared`): Types & constants

## Commands

```bash
pnpm dev              # Start web + api concurrently
pnpm dev:web          # Web only (port 5173)
pnpm dev:api          # API only (port 3001)
pnpm build            # Build all packages
pnpm typecheck        # Type-check all packages
pnpm lint             # Lint all packages
```

## Architecture

```
apps/web/src/
  components/         # Dashboard, NavCard, CategoryGroup, SortableCategoryGroup, SearchBar, modals
  hooks/              # useBookmarks, useAI, useHealthCheck

apps/api/src/
  routes/             # bookmarks.ts, categories.ts, ai.ts
  services/           # ai.ts (Claude SDK), metadata.ts (Cheerio scraping)

packages/db/src/
  index.ts            # CRUD functions (getAllBookmarks, createBookmark, reorderBookmarks, etc.)
  schema.sql          # SQLite table definitions

packages/shared/src/
  types.ts            # Bookmark, Category, CreateBookmarkInput, etc.
```

## Key Patterns

- **Workspace imports**: Use `@ai-nav/shared`, `@ai-nav/db` (not relative paths across packages)
- **ES modules**: All packages use `"type": "module"` — import with `.js` extensions
- **API routes**: Express routers, each file exports a Router
- **DB layer**: Functions in `packages/db` return typed objects, no ORM
- **Reorder endpoints**: `PUT /api/bookmarks/reorder` and `PUT /api/categories/reorder` accept `{ ids: number[] }`
- **AI fallback**: Works without API key (heuristic domain-based categorization)
- **Env vars**: Loaded from root `.env` via dotenv in API entry point
- **Drag & Drop**: Bookmarks and categories support drag-and-drop reordering via @dnd-kit
- **Settings source**: API settings (key, base URL, model) show whether values come from DB, env vars, or defaults

## Conventions

- Keep components in `apps/web/src/components/`
- Keep hooks in `apps/web/src/hooks/`
- API routes are thin — delegate logic to `services/`
- Shared types go in `packages/shared/src/types.ts`
- Database changes: update both `schema.sql` and `index.ts` in `packages/db`
- UI style: Glassmorphism (frosted glass, dark gradients)

## Environment Variables

Supported in root `.env` file (loaded by dotenv):

| Variable | Alias | Description |
|----------|-------|-------------|
| `CLAUDE_API_KEY` | `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN` | Anthropic API key |
| `BASE_URL` | `ANTHROPIC_BASE_URL` | Custom API endpoint |
| `MODEL` | `ANTHROPIC_MODEL` | Claude model name |

Priority: DB (Settings UI) > env vars > defaults.

## Protected Files

- `.env` — Never edit or commit. Only edit `.env.example`.
- `pnpm-lock.yaml` — Never edit manually.
