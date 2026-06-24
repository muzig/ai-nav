import { useState, useEffect, useCallback } from 'react';
import type { Bookmark, Category } from '@ai-nav/shared';

export type { Bookmark, Category };

export interface GroupedBookmarks {
  category: Category | null;
  bookmarks: Bookmark[];
}

const API = '/api';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bmRes, catRes] = await Promise.all([
        fetch(`${API}/bookmarks`),
        fetch(`${API}/categories`),
      ]);
      const [bmData, catData] = await Promise.all([bmRes.json(), catRes.json()]);
      setBookmarks(bmData);
      setCategories(catData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addBookmark = async (data: { title: string; url: string; description?: string; favicon?: string; category_id?: number | null }) => {
    const res = await fetch(`${API}/bookmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const bookmark = await res.json();
    setBookmarks((prev) => [...prev, bookmark]);
    return bookmark;
  };

  const addBookmarksBulk = async (items: Array<{ title: string; url: string; description?: string; favicon?: string; category_id?: number | null }>) => {
    const res = await fetch(`${API}/bookmarks/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    const newBookmarks = await res.json();
    setBookmarks((prev) => [...prev, ...newBookmarks]);
    return newBookmarks;
  };

  const updateBookmark = async (id: number, data: Partial<Bookmark>) => {
    const res = await fetch(`${API}/bookmarks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setBookmarks((prev) => prev.map((b) => (b.id === id ? updated : b)));
    return updated;
  };

  const deleteBookmark = async (id: number) => {
    await fetch(`${API}/bookmarks/${id}`, { method: 'DELETE' });
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const addCategory = async (data: { name: string; icon?: string; color?: string }) => {
    const res = await fetch(`${API}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const category = await res.json();
    setCategories((prev) => [...prev, category]);
    return category;
  };

  const updateCategory = async (id: number, data: Partial<Category>) => {
    const res = await fetch(`${API}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const deleteCategory = async (id: number) => {
    await fetch(`${API}/categories/${id}`, { method: 'DELETE' });
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setBookmarks((prev) => prev.map((b) => (b.category_id === id ? { ...b, category_id: null } : b)));
  };

  // Group bookmarks by category
  const grouped: GroupedBookmarks[] = [];
  const uncategorized = bookmarks.filter((b) => b.category_id === null);

  for (const cat of categories) {
    const catBookmarks = bookmarks.filter((b) => b.category_id === cat.id);
    if (catBookmarks.length > 0) {
      grouped.push({ category: cat, bookmarks: catBookmarks });
    }
  }

  if (uncategorized.length > 0) {
    grouped.push({ category: null, bookmarks: uncategorized });
  }

  return {
    bookmarks,
    categories,
    grouped,
    loading,
    addBookmark,
    addBookmarksBulk,
    updateBookmark,
    deleteBookmark,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchAll,
  };
}
