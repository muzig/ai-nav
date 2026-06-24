import { Router } from 'express';
import {
  getAllBookmarks,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  createBookmarksBulk,
  reorderBookmarks,
} from '@ai-nav/db';

const router = Router();

// GET /api/bookmarks
router.get('/', (_req, res) => {
  const bookmarks = getAllBookmarks();
  res.json(bookmarks);
});

// POST /api/bookmarks
router.post('/', (req, res) => {
  const { title, url, description, favicon, category_id } = req.body;
  if (!title || !url) {
    return res.status(400).json({ error: 'title and url are required' });
  }
  const bookmark = createBookmark({ title, url, description, favicon, category_id });
  res.status(201).json(bookmark);
});

// POST /api/bookmarks/bulk
router.post('/bulk', (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items array is required' });
  }
  const bookmarks = createBookmarksBulk(items);
  res.status(201).json(bookmarks);
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

// PUT /api/bookmarks/:id
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const bookmark = updateBookmark(id, req.body);
  if (!bookmark) {
    return res.status(404).json({ error: 'Bookmark not found' });
  }
  res.json(bookmark);
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
