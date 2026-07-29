import { describe, expect, it } from 'vitest';
import type { Bookmark, Category } from '@ai-nav/shared';
import { buildShelves } from './selectors';

const categories: Category[] = [
  { id: 1, name: 'Research', icon: '', color: '', sort_order: 0, created_at: '', updated_at: '' },
];

function bookmark(overrides: Partial<Bookmark>): Bookmark {
  return {
    id: 1,
    title: 'Claude',
    url: 'https://claude.ai',
    description: 'Analysis',
    favicon: '',
    category_id: 1,
    sort_order: 0,
    is_favorite: false,
    favorited_at: null,
    last_opened_at: null,
    created_at: '2026-07-29T08:00:00.000Z',
    updated_at: '2026-07-29T08:00:00.000Z',
    ...overrides,
  };
}

describe('buildShelves', () => {
  it('puts favorites first, orders by usage, and removes duplicates from categories', () => {
    const shelves = buildShelves([
      bookmark({ id: 1, is_favorite: true, favorited_at: '2026-07-29T09:00:00Z' }),
      bookmark({ id: 2, title: 'Perplexity', is_favorite: true, last_opened_at: '2026-07-29T10:00:00Z' }),
      bookmark({ id: 3, title: 'NotebookLM' }),
    ], categories, '');

    expect(shelves[0].id).toBe('favorites');
    expect(shelves[0].bookmarks.map((item) => item.id)).toEqual([2, 1]);
    expect(shelves[1].bookmarks.map((item) => item.id)).toEqual([3]);
  });

  it('searches title, description, hostname, and category', () => {
    const items = [
      bookmark({ id: 1, title: 'Perplexity', url: 'https://perplexity.ai', description: 'Web answers' }),
      bookmark({ id: 2, title: 'Claude', url: 'https://claude.ai' }),
    ];
    expect(buildShelves(items, categories, 'research').flatMap((shelf) => shelf.bookmarks)).toHaveLength(2);
    expect(buildShelves(items, categories, 'perplexity').flatMap((shelf) => shelf.bookmarks)[0].id).toBe(1);
    expect(buildShelves(items, categories, 'claude.ai').flatMap((shelf) => shelf.bookmarks)[0].id).toBe(2);
  });
});
