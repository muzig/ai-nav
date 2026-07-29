# Personal AI Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild AI Nav as an Apple-inspired personal AI tool homepage with stable product shelves, outline navigation, favorites, recent-open ordering, resilient URL import, and responsive mobile behavior.

**Architecture:** Keep the existing React/Express/SQLite monorepo and extend the bookmark entity with favorite and last-opened state. Move page derivation into pure selectors, split the current large Dashboard into focused outline, command, shelf, and tool-item components, and keep API routes thin over the database package.

**Tech Stack:** TypeScript, React 18, Vite, Tailwind/CSS, Express 4, better-sqlite3, Vitest, Testing Library, Supertest

---

## File Structure

### Create

- `packages/db/src/migrations.ts` — idempotent schema upgrades for existing SQLite installations.
- `packages/db/src/bookmarks.test.ts` — database behavior for favorites, opening, and duplicate URLs.
- `apps/api/src/routes/bookmarks.test.ts` — bookmark route contract tests.
- `apps/web/src/features/bookmarks/selectors.ts` — pure search, grouping, and ordering rules.
- `apps/web/src/features/bookmarks/selectors.test.ts` — selector unit tests.
- `apps/web/src/components/CommandInput.tsx` — unified search and URL-paste input.
- `apps/web/src/components/CategoryOutline.tsx` — desktop outline and mobile drawer.
- `apps/web/src/components/ToolShelf.tsx` — one category product shelf.
- `apps/web/src/components/ToolItem.tsx` — stable bookmark item and progressive actions.
- `apps/web/src/hooks/useActiveShelf.ts` — scroll-spy behavior for the outline.
- `apps/web/src/components/CommandInput.test.tsx` — command intent tests.
- `apps/web/src/components/CategoryOutline.test.tsx` — drawer and navigation tests.
- `apps/web/src/components/ToolItem.test.tsx` — open/favorite accessibility tests.

### Modify

- `package.json` — root test command.
- `apps/web/package.json` — Vitest, jsdom, and Testing Library dependencies/scripts.
- `apps/api/package.json` — Vitest and Supertest dependencies/scripts.
- `packages/db/package.json` — Vitest dependency/script.
- `packages/shared/src/types.ts` — favorite/open fields and request contracts.
- `packages/db/src/schema.sql` — schema for fresh installs.
- `packages/db/src/index.ts` — migration call, uniqueness, favorite and open operations.
- `apps/api/src/routes/bookmarks.ts` — validation, duplicate response, favorite/open endpoints.
- `apps/web/src/hooks/useBookmarks.ts` — error-aware requests and optimistic favorite/open actions.
- `apps/web/src/components/Dashboard.tsx` — compose the approved product-shelf page.
- `apps/web/src/components/AddUrlModal.tsx` — resilient partial-result confirmation and Apple-inspired sheet styling.
- `apps/web/src/styles/tokens.css` — semantic Apple-inspired light/dark tokens.
- `apps/web/src/styles/globals.css` — product-shelf layout, focus, responsive, and reduced-motion rules.
- `README.md` — update the product description and behavior.

## Task 1: Add the Test Harness

**Files:**
- Modify: `package.json`
- Modify: `apps/web/package.json`
- Modify: `apps/api/package.json`
- Modify: `packages/db/package.json`
- Create: `apps/web/src/test/setup.ts`

- [ ] **Step 1: Add workspace test scripts**

Add `"test": "turbo test"` to the root scripts. Add `"test": "vitest run"` to the web, API, and database package scripts.

- [ ] **Step 2: Install explicit test dependencies**

Run:

```bash
pnpm --filter @ai-nav/web add -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
pnpm --filter @ai-nav/api add -D vitest supertest @types/supertest
pnpm --filter @ai-nav/db add -D vitest
```

Expected: `pnpm-lock.yaml` updates and each target package lists only its own test dependencies.

- [ ] **Step 3: Configure web tests**

Add this `test` section to `apps/web/vite.config.ts`:

```ts
test: {
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
  css: true,
}
```

Create `apps/web/src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Verify empty suites execute**

Run:

```bash
pnpm test -- --passWithNoTests
```

Expected: all three packages exit successfully with no tests found.

- [ ] **Step 5: Commit**

```bash
git add package.json apps/web/package.json apps/api/package.json packages/db/package.json apps/web/vite.config.ts apps/web/src/test/setup.ts pnpm-lock.yaml
git commit -m "test: add workspace vitest harness"
```

## Task 2: Extend the Shared Bookmark Contract

**Files:**
- Modify: `packages/shared/src/types.ts`
- Create: `apps/web/src/features/bookmarks/selectors.test.ts`

- [ ] **Step 1: Write the selector fixture that requires the new fields**

Create `apps/web/src/features/bookmarks/selectors.test.ts` with this compile-time fixture:

```ts
import { describe, expect, it } from 'vitest';
import type { Bookmark } from '@ai-nav/shared';

const bookmark: Bookmark = {
  id: 1,
  title: 'Claude',
  url: 'https://claude.ai',
  description: 'Analysis',
  favicon: '',
  category_id: 2,
  sort_order: 0,
  is_favorite: true,
  favorited_at: '2026-07-29T08:00:00.000Z',
  last_opened_at: null,
  created_at: '2026-07-29T08:00:00.000Z',
  updated_at: '2026-07-29T08:00:00.000Z',
};

describe('Bookmark contract', () => {
  it('carries favorite and open state', () => {
    expect(bookmark.is_favorite).toBe(true);
    expect(bookmark.last_opened_at).toBeNull();
  });
});
```

- [ ] **Step 2: Run typecheck to verify the fixture fails**

Run:

```bash
pnpm --filter @ai-nav/web typecheck
```

Expected: FAIL because `is_favorite`, `favorited_at`, and `last_opened_at` are not in `Bookmark`.

- [ ] **Step 3: Add the shared fields and request types**

Add to `Bookmark`:

```ts
is_favorite: boolean;
favorited_at: string | null;
last_opened_at: string | null;
```

Add:

```ts
export interface SetFavoriteRequest {
  is_favorite: boolean;
}

export interface OpenBookmarkResponse {
  bookmark: Bookmark;
}

export interface BulkCreateResult {
  created: Bookmark[];
  skipped: Array<{ url: string; reason: 'duplicate' | 'invalid' }>;
}
```

- [ ] **Step 4: Run the contract test and typecheck**

Run:

```bash
pnpm --filter @ai-nav/web test -- selectors.test.ts
pnpm --filter @ai-nav/web typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/types.ts apps/web/src/features/bookmarks/selectors.test.ts
git commit -m "feat(shared): add bookmark usage state contracts"
```

## Task 3: Migrate SQLite and Implement Bookmark State

**Files:**
- Create: `packages/db/src/migrations.ts`
- Create: `packages/db/src/bookmarks.test.ts`
- Modify: `packages/db/src/schema.sql`
- Modify: `packages/db/src/index.ts`

- [ ] **Step 1: Write failing database tests**

Create `packages/db/src/bookmarks.test.ts` using a temporary database factory exported only for tests:

```ts
import { afterEach, describe, expect, it } from 'vitest';
import { createDatabase } from './index.js';

const stores: Array<ReturnType<typeof createDatabase>> = [];

afterEach(() => stores.splice(0).forEach((store) => store.close()));

describe('bookmark state', () => {
  it('rejects a normalized duplicate URL', () => {
    const store = createDatabase(':memory:');
    stores.push(store);
    store.createBookmark({ title: 'Claude', url: 'https://claude.ai/' });
    expect(() => store.createBookmark({ title: 'Duplicate', url: 'https://claude.ai' }))
      .toThrowError('BOOKMARK_URL_EXISTS');
  });

  it('sets favorite timestamps and records opening', () => {
    const store = createDatabase(':memory:');
    stores.push(store);
    const bookmark = store.createBookmark({ title: 'Claude', url: 'https://claude.ai' });
    const favorite = store.setBookmarkFavorite(bookmark.id, true);
    expect(favorite?.is_favorite).toBe(true);
    expect(favorite?.favorited_at).not.toBeNull();
    const opened = store.recordBookmarkOpen(bookmark.id);
    expect(opened?.last_opened_at).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
pnpm --filter @ai-nav/db test -- bookmarks.test.ts
```

Expected: FAIL because `createDatabase`, `setBookmarkFavorite`, and `recordBookmarkOpen` do not exist.

- [ ] **Step 3: Add idempotent migrations**

Create `packages/db/src/migrations.ts`:

```ts
import type Database from 'better-sqlite3';

export function runMigrations(db: Database.Database): void {
  const columns = new Set(
    (db.prepare('PRAGMA table_info(bookmarks)').all() as Array<{ name: string }>)
      .map((column) => column.name),
  );
  if (!columns.has('is_favorite')) {
    db.exec('ALTER TABLE bookmarks ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0');
  }
  if (!columns.has('favorited_at')) {
    db.exec('ALTER TABLE bookmarks ADD COLUMN favorited_at TEXT');
  }
  if (!columns.has('last_opened_at')) {
    db.exec('ALTER TABLE bookmarks ADD COLUMN last_opened_at TEXT');
  }
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS bookmarks_url_unique ON bookmarks(url)');
}
```

Update the fresh-install table in `schema.sql` with the same three columns, then call `runMigrations(db)` after `db.exec(schema)`.

- [ ] **Step 4: Refactor the database into a testable factory**

Export `createDatabase(path: string)` from `packages/db/src/index.ts`. It must return the existing CRUD functions bound to its database plus `close()`. Normalize URLs before insert:

```ts
function normalizeUrl(raw: string): string {
  const url = new URL(raw);
  url.hash = '';
  if (url.pathname === '/') url.pathname = '';
  return url.toString();
}
```

Map SQLite integers to booleans in a single `mapBookmark` helper. Implement:

```ts
setBookmarkFavorite(id: number, isFavorite: boolean): Bookmark | undefined
recordBookmarkOpen(id: number): Bookmark | undefined
```

Use `CURRENT_TIMESTAMP` for `favorited_at` and `last_opened_at`, clearing `favorited_at` when favorite is false. Convert unique constraint errors to `new Error('BOOKMARK_URL_EXISTS')`.

- [ ] **Step 5: Run database tests and typecheck**

Run:

```bash
pnpm --filter @ai-nav/db test
pnpm --filter @ai-nav/db typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/db/src/schema.sql packages/db/src/migrations.ts packages/db/src/index.ts packages/db/src/bookmarks.test.ts
git commit -m "feat(db): persist bookmark favorite and open state"
```

## Task 4: Add Validated Favorite, Open, and Duplicate APIs

**Files:**
- Create: `apps/api/src/routes/bookmarks.test.ts`
- Modify: `apps/api/src/routes/bookmarks.ts`

- [ ] **Step 1: Write failing route tests**

Export a router factory that accepts a store. Test:

```ts
it('updates favorite state', async () => {
  const response = await request(app)
    .put('/api/bookmarks/1/favorite')
    .send({ is_favorite: true });
  expect(response.status).toBe(200);
  expect(response.body.is_favorite).toBe(true);
});

it('records opening without changing the URL', async () => {
  const response = await request(app).post('/api/bookmarks/1/open');
  expect(response.status).toBe(200);
  expect(response.body.bookmark.last_opened_at).toEqual(expect.any(String));
});

it('returns 409 for duplicate URLs', async () => {
  const response = await request(app)
    .post('/api/bookmarks')
    .send({ title: 'Duplicate', url: 'https://claude.ai/' });
  expect(response.status).toBe(409);
  expect(response.body.error).toBe('This URL is already saved');
});
```

- [ ] **Step 2: Run route tests to verify failure**

Run:

```bash
pnpm --filter @ai-nav/api test -- bookmarks.test.ts
```

Expected: FAIL with 404 for favorite/open routes.

- [ ] **Step 3: Implement strict route validation**

Add:

```ts
router.put('/:id/favorite', (req, res) => {
  if (typeof req.body.is_favorite !== 'boolean') {
    return res.status(400).json({ error: 'is_favorite must be a boolean' });
  }
  const bookmark = setBookmarkFavorite(Number(req.params.id), req.body.is_favorite);
  return bookmark
    ? res.json(bookmark)
    : res.status(404).json({ error: 'Bookmark not found' });
});

router.post('/:id/open', (req, res) => {
  const bookmark = recordBookmarkOpen(Number(req.params.id));
  return bookmark
    ? res.json({ bookmark })
    : res.status(404).json({ error: 'Bookmark not found' });
});
```

Validate URLs with `new URL(url)` before writes. Catch `BOOKMARK_URL_EXISTS` and return HTTP 409. Bulk create must return `BulkCreateResult`, skipping invalid and duplicate URLs without rolling back valid items.

- [ ] **Step 4: Run API tests and typecheck**

Run:

```bash
pnpm --filter @ai-nav/api test
pnpm --filter @ai-nav/api typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/routes/bookmarks.ts apps/api/src/routes/bookmarks.test.ts
git commit -m "feat(api): add bookmark favorite and open endpoints"
```

## Task 5: Build Pure Search and Product-Shelf Selectors

**Files:**
- Create: `apps/web/src/features/bookmarks/selectors.ts`
- Modify: `apps/web/src/features/bookmarks/selectors.test.ts`

- [ ] **Step 1: Add failing selector cases**

Test these rules:

```ts
expect(buildShelves(bookmarks, categories, '')[0].id).toBe('favorites');
expect(buildShelves(bookmarks, categories, '')[0].bookmarks.map((b) => b.id)).toEqual([2, 1]);
expect(buildShelves(bookmarks, categories, '')[1].bookmarks).not.toContainEqual(
  expect.objectContaining({ is_favorite: true }),
);
expect(buildShelves(bookmarks, categories, 'research').flatMap((s) => s.bookmarks))
  .toEqual([expect.objectContaining({ title: 'Perplexity' })]);
```

The fixture must include a favorite with a newer `last_opened_at`, a favorite with only `favorited_at`, a categorized regular bookmark, and an uncategorized bookmark.

- [ ] **Step 2: Run selectors tests to verify failure**

Run:

```bash
pnpm --filter @ai-nav/web test -- selectors.test.ts
```

Expected: FAIL because `buildShelves` does not exist.

- [ ] **Step 3: Implement the pure selector**

Export:

```ts
export interface BookmarkShelf {
  id: string;
  title: string;
  bookmarks: Bookmark[];
}

export function buildShelves(
  bookmarks: Bookmark[],
  categories: Category[],
  query: string,
): BookmarkShelf[]
```

Normalize search with `trim().toLocaleLowerCase()`. Match title, URL hostname, description, and category name. Sort favorites by `last_opened_at ?? favorited_at ?? created_at` descending. Exclude favorites from category shelves. Preserve category `sort_order`, then append `uncategorized`. Remove empty shelves after search.

- [ ] **Step 4: Run selector tests**

Run:

```bash
pnpm --filter @ai-nav/web test -- selectors.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/bookmarks/selectors.ts apps/web/src/features/bookmarks/selectors.test.ts
git commit -m "feat(web): derive stable bookmark product shelves"
```

## Task 6: Add Error-Aware Bookmark Actions

**Files:**
- Modify: `apps/web/src/hooks/useBookmarks.ts`

- [ ] **Step 1: Add a checked fetch helper**

Add:

```ts
async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `Request failed with ${response.status}`);
  }
  return body as T;
}
```

Replace direct `fetch(...).json()` write paths so failed writes never mutate local state.

- [ ] **Step 2: Implement optimistic favorite state**

Add `setFavorite(id, isFavorite)`. Capture the previous bookmark, update `is_favorite` and `favorited_at` immediately, send `PUT /bookmarks/:id/favorite`, replace with the server result on success, and restore the previous bookmark before rethrowing on failure.

- [ ] **Step 3: Implement non-blocking open tracking**

Add:

```ts
const openBookmark = (bookmark: Bookmark) => {
  const openedAt = new Date().toISOString();
  setBookmarks((items) => items.map((item) =>
    item.id === bookmark.id ? { ...item, last_opened_at: openedAt } : item
  ));
  window.open(bookmark.url, '_blank', 'noopener,noreferrer');
  void requestJson<OpenBookmarkResponse>(`${API}/bookmarks/${bookmark.id}/open`, {
    method: 'POST',
  }).then(({ bookmark: updated }) => {
    setBookmarks((items) => items.map((item) => item.id === updated.id ? updated : item));
  }).catch(() => {
    setBookmarks((items) => items.map((item) =>
      item.id === bookmark.id ? { ...item, last_opened_at: bookmark.last_opened_at } : item
    ));
  });
};
```

- [ ] **Step 4: Update bulk creation for partial results**

Accept `BulkCreateResult`, append only `created`, and return the full result so the add flow can retain skipped entries.

- [ ] **Step 5: Run typecheck**

Run:

```bash
pnpm --filter @ai-nav/web typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/hooks/useBookmarks.ts
git commit -m "feat(web): add resilient bookmark actions"
```

## Task 7: Build the Command, Outline, and Tool Components

**Files:**
- Create: `apps/web/src/components/CommandInput.tsx`
- Create: `apps/web/src/components/CommandInput.test.tsx`
- Create: `apps/web/src/components/CategoryOutline.tsx`
- Create: `apps/web/src/components/CategoryOutline.test.tsx`
- Create: `apps/web/src/components/ToolItem.tsx`
- Create: `apps/web/src/components/ToolItem.test.tsx`
- Create: `apps/web/src/components/ToolShelf.tsx`
- Create: `apps/web/src/hooks/useActiveShelf.ts`

- [ ] **Step 1: Write failing command tests**

Test that typing `claude` calls `onSearch('claude')`, pasting `https://claude.ai` calls `onAddUrls(['https://claude.ai'])`, pasting newline-separated URLs preserves both, and `Meta+K` focuses the input.

- [ ] **Step 2: Implement `CommandInput`**

Props:

```ts
interface CommandInputProps {
  query: string;
  onSearch(query: string): void;
  onAddUrls(urls: string[]): void;
}
```

On paste, extract all `https?://` tokens. Prevent the default paste only when at least one URL exists; otherwise allow normal text paste. Use a visible `<label>` with visually-hidden text, `type="search"`, and a 44px minimum height.

- [ ] **Step 3: Write failing outline tests**

Test active item semantics (`aria-current="location"`), clicking calls `onNavigate(id)`, mobile trigger exposes `aria-expanded`, Escape closes the drawer, and choosing an item closes it.

- [ ] **Step 4: Implement `CategoryOutline` and `useActiveShelf`**

Use anchor buttons with text and counts. Desktop outline is sticky; mobile renders a left sheet with a 50% black scrim, focus moves to the first outline item when opened, Escape closes it, and focus returns to the trigger.

`useActiveShelf(ids)` uses `IntersectionObserver` with `rootMargin: '-20% 0px -70% 0px'` and returns the most recently intersecting shelf id.

- [ ] **Step 5: Write failing tool-item tests**

Test whole-item opening, favorite button label (`Add Claude to favorites` / `Remove Claude from favorites`), keyboard visibility of secondary actions, and that the favicon uses an empty alt while the adjacent title supplies the accessible name.

- [ ] **Step 6: Implement `ToolItem` and `ToolShelf`**

`ToolItem` props:

```ts
interface ToolItemProps {
  bookmark: Bookmark;
  onOpen(bookmark: Bookmark): void;
  onFavorite(id: number, favorite: boolean): Promise<void>;
  onEdit(bookmark: Bookmark): void;
}
```

Use a semantic link for the primary surface and buttons for secondary actions. Stop propagation on buttons. Do not depend on hover; reveal the same actions on `:focus-within`, and keep them visible in the mobile overflow menu.

`ToolShelf` renders an `<section id={shelf.id}>`, a heading/count, and a stable grid of `ToolItem`.

- [ ] **Step 7: Run component tests**

Run:

```bash
pnpm --filter @ai-nav/web test -- CommandInput CategoryOutline ToolItem
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/CommandInput.tsx apps/web/src/components/CommandInput.test.tsx apps/web/src/components/CategoryOutline.tsx apps/web/src/components/CategoryOutline.test.tsx apps/web/src/components/ToolItem.tsx apps/web/src/components/ToolItem.test.tsx apps/web/src/components/ToolShelf.tsx apps/web/src/hooks/useActiveShelf.ts
git commit -m "feat(web): add product shelf interface components"
```

## Task 8: Compose the Approved Dashboard

**Files:**
- Modify: `apps/web/src/components/Dashboard.tsx`
- Modify: `apps/web/src/components/AddUrlModal.tsx`

- [ ] **Step 1: Replace Dashboard derivation with selectors**

Keep only page orchestration state:

```ts
const [query, setQuery] = useState('');
const shelves = useMemo(
  () => buildShelves(bookmarks, categories, query),
  [bookmarks, categories, query],
);
const shelfIds = useMemo(() => shelves.map((shelf) => shelf.id), [shelves]);
const activeShelf = useActiveShelf(shelfIds);
```

Remove edit/readonly mode, category filter pills, statistics, auto-group toolbar button, and drag/reorder UI from the homepage. Keep settings and AI grouping available through settings or the add flow, not as competing primary actions.

- [ ] **Step 2: Compose the page in reading order**

Render:

```tsx
<SkipLink href="#tool-library">Skip to tool library</SkipLink>
<AppBar onOpenSettings={() => setSettingsOpen(true)} />
<div className="library-layout">
  <CategoryOutline shelves={shelves} activeId={activeShelf} onNavigate={scrollToShelf} />
  <main id="tool-library">
    <CommandInput query={query} onSearch={setQuery} onAddUrls={openAddFlow} />
    {shelves.map((shelf) => (
      <ToolShelf key={shelf.id} shelf={shelf} onOpen={openBookmark}
        onFavorite={setFavorite} onEdit={setEditingBookmark} />
    ))}
  </main>
</div>
```

`scrollToShelf(id)` calls `document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })`.

- [ ] **Step 3: Handle empty and no-result states**

When there are no bookmarks, show one sentence explaining paste-to-add and a primary “Add your first tool” button. When search has no results, show the query and a “Clear search” button. Neither state may render an empty grid.

- [ ] **Step 4: Make the add flow accept prefilled URLs**

Add `initialUrls: string[]` to `AddUrlModalProps`. Opening from pasted URLs bypasses the empty input state and starts parsing those URLs. Preserve failed/skipped rows after bulk save and show their exact reason with a “Retry failed” action.

- [ ] **Step 5: Run web tests and typecheck**

Run:

```bash
pnpm --filter @ai-nav/web test
pnpm --filter @ai-nav/web typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/Dashboard.tsx apps/web/src/components/AddUrlModal.tsx
git commit -m "feat(web): compose personal AI tool homepage"
```

## Task 9: Implement the Apple-Inspired Design Tokens and Responsive Layout

**Files:**
- Modify: `apps/web/src/styles/tokens.css`
- Modify: `apps/web/src/styles/globals.css`

- [ ] **Step 1: Replace raw theme values with semantic tokens**

Define:

```css
:root {
  --surface-page: #f5f5f7;
  --surface-raised: #ffffff;
  --surface-subtle: #fbfbfd;
  --text-primary: #1d1d1f;
  --text-secondary: #6e6e73;
  --separator: #d2d2d7;
  --action: #0071e3;
  --action-hover: #0077ed;
  --danger: #d70015;
  --focus-ring: color-mix(in srgb, var(--action) 35%, transparent);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --font-ui: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
}
```

Provide a dark mapping under `[data-theme="dark"]` using desaturated surfaces rather than color inversion.

- [ ] **Step 2: Add product-shelf layout rules**

Use CSS Grid:

```css
.library-layout { display: grid; grid-template-columns: 164px minmax(0, 1fr); }
.tool-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
@media (max-width: 1100px) { .tool-grid { grid-template-columns: repeat(4, 1fr); } }
@media (max-width: 860px) { .tool-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 640px) {
  .library-layout { grid-template-columns: 1fr; }
  .tool-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
```

Tool items have a minimum 44px pointer target, no strong shadow, and no layout-changing hover state.

- [ ] **Step 3: Add interaction and motion rules**

Visible focus rings must use `:focus-visible`. Secondary actions use opacity only and appear on both `:hover` and `:focus-within`. Add:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Build and inspect at required widths**

Run:

```bash
pnpm --filter @ai-nav/web build
pnpm --filter @ai-nav/web typecheck
```

Expected: PASS. Inspect at 375px, 768px, 1024px, and 1440px. No horizontal scrolling; mobile tool actions remain reachable without hover.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/styles/tokens.css apps/web/src/styles/globals.css
git commit -m "style(web): add apple-inspired product shelf system"
```

## Task 10: Documentation and Full Verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the README product description**

Replace obsolete references to drag-first editing and glassmorphism with:

- personal AI tool homepage;
- paste-to-add and resilient metadata/AI categorization;
- stable product shelves and outline navigation;
- favorites and recent-open ordering;
- local SQLite privacy;
- responsive and keyboard-accessible interaction.

- [ ] **Step 2: Run the complete automated suite**

Run:

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm lint
```

Expected: all commands PASS. If the repository still has no configured lint task in a package, add the missing package lint script or document the exact existing Turbo “missing task” failure before changing scope.

- [ ] **Step 3: Run the end-to-end acceptance path**

Start the app:

```bash
pnpm dev
```

Verify:

1. Empty state teaches URL paste.
2. Paste one URL and then multiple URLs.
3. Save a batch containing a valid URL, an invalid URL, and an existing URL.
4. Confirm valid entries save while failed rows remain retryable.
5. Favorite a tool and confirm it moves once to the favorites shelf.
6. Unfavorite it and confirm it returns to its category.
7. Search by title, hostname, description, and category.
8. Click outline entries and confirm smooth positioning and scroll-spy highlighting.
9. Open a tool and confirm navigation is immediate even if the tracking request is blocked.
10. Open the mobile outline, navigate, close with Escape, and verify focus returns.
11. Navigate every interactive element by keyboard with visible focus.
12. Enable reduced motion and confirm scrolling/transitions do not animate.

- [ ] **Step 4: Check the working tree**

Run:

```bash
git status --short
git diff --check
```

Expected: only README changes remain; no whitespace errors and no generated database or Visual Companion files are staged.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: describe personal AI tool homepage"
```
