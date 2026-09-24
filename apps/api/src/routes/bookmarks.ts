import { Router } from 'express';
import {
  getAllBookmarks,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  createBookmarksBulk,
  reorderBookmarks,
  setBookmarkFavorite,
  recordBookmarkOpen,
  getBookmarkByUrl,
} from '@ai-nav/db';
import type { BulkCreateResult, CreateBookmarkInput } from '@ai-nav/shared';

const router = Router();

// GET /api/bookmarks
router.get('/', (_req, res) => {
  const bookmarks = getAllBookmarks();
  res.json(bookmarks);
});

// POST /api/bookmarks
router.post('/', (req, res) => {
  const { title, url, internal_url, description, favicon, category_id } = req.body;
  if (!title || !url) {
    return res.status(400).json({ error: 'title and url are required' });
  }
  try {
    new URL(url);
    const bookmark = createBookmark({ title, url, internal_url, description, favicon, category_id });
    res.status(201).json(bookmark);
  } catch (error) {
    if (error instanceof Error && error.message === 'BOOKMARK_URL_EXISTS') {
      return res.status(409).json({ error: 'This URL is already saved' });
    }
    return res.status(400).json({ error: 'A valid URL is required' });
  }
});

// POST /api/bookmarks/bulk
router.post('/bulk', (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items array is required' });
  }
  const valid: CreateBookmarkInput[] = [];
  const result: BulkCreateResult = { created: [], skipped: [] };
  const seen = new Set<string>();

  for (const item of items as CreateBookmarkInput[]) {
    try {
      const normalized = new URL(item.url).toString();
      if (!item.title || seen.has(normalized) || getBookmarkByUrl(normalized)) {
        result.skipped.push({ url: item.url, reason: 'duplicate' });
        continue;
      }
      seen.add(normalized);
      valid.push(item);
    } catch {
      result.skipped.push({ url: item.url, reason: 'invalid' });
    }
  }

  result.created = createBookmarksBulk(valid);
  res.status(201).json(result);
});

// PUT /api/bookmarks/reorder
router.put('/reorder', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'ids array is required' });
  }
  reorderBookmarks(ids);
  res.json({ success: true });
});

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

// PUT /api/bookmarks/:id
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const bookmark = updateBookmark(id, req.body);
    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
    res.json(bookmark);
  } catch (error) {
    if (error instanceof Error && error.message === 'BOOKMARK_URL_EXISTS') {
      return res.status(409).json({ error: 'This URL is already saved' });
    }
    return res.status(400).json({ error: 'A valid URL is required' });
  }
});

// DELETE /api/bookmarks/:id
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const deleted = deleteBookmark(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Bookmark not found' });
  }
  res.json({ success: true });
});

export default router;
