import { Router } from 'express';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@ai-nav/db';

const router = Router();

// GET /api/categories
router.get('/', (_req, res) => {
  const categories = getAllCategories();
  res.json(categories);
});

// POST /api/categories
router.post('/', (req, res) => {
  const { name, icon, color } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }
  const category = createCategory({ name, icon, color });
  res.status(201).json(category);
});

// PUT /api/categories/:id
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const category = updateCategory(id, req.body);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }
  res.json(category);
});

// DELETE /api/categories/:id
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const deleted = deleteCategory(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Category not found' });
  }
  res.json({ success: true });
});

export default router;
