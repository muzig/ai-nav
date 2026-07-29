import type { Bookmark, Category } from '@ai-nav/shared';

export interface BookmarkShelf {
  id: string;
  title: string;
  bookmarks: Bookmark[];
}

function searchableText(bookmark: Bookmark, categoryName: string): string {
  let hostname = bookmark.url;
  try {
    hostname = new URL(bookmark.url).hostname;
  } catch {
    // Keep the raw URL searchable when legacy data contains an invalid URL.
  }
  return [bookmark.title, hostname, bookmark.description, categoryName]
    .join(' ')
    .toLocaleLowerCase();
}

function usageTime(bookmark: Bookmark): number {
  const value = bookmark.last_opened_at ?? bookmark.favorited_at ?? bookmark.created_at;
  return Date.parse(value) || 0;
}

export function buildShelves(
  bookmarks: Bookmark[],
  categories: Category[],
  query: string,
): BookmarkShelf[] {
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matches = (bookmark: Bookmark) => !normalizedQuery
    || searchableText(bookmark, categoryMap.get(bookmark.category_id ?? -1) ?? 'Uncategorized')
      .includes(normalizedQuery);

  const visible = bookmarks.filter(matches);
  const shelves: BookmarkShelf[] = [];
  const favorites = visible
    .filter((bookmark) => bookmark.is_favorite)
    .sort((a, b) => usageTime(b) - usageTime(a));

  if (favorites.length) {
    shelves.push({ id: 'favorites', title: 'Favorites', bookmarks: favorites });
  }

  for (const category of [...categories].sort((a, b) => a.sort_order - b.sort_order)) {
    const items = visible
      .filter((bookmark) => !bookmark.is_favorite && bookmark.category_id === category.id)
      .sort((a, b) => a.sort_order - b.sort_order);
    if (items.length) shelves.push({ id: `category-${category.id}`, title: category.name, bookmarks: items });
  }

  const uncategorized = visible
    .filter((bookmark) => !bookmark.is_favorite && bookmark.category_id === null)
    .sort((a, b) => a.sort_order - b.sort_order);
  if (uncategorized.length) {
    shelves.push({ id: 'uncategorized', title: 'Uncategorized', bookmarks: uncategorized });
  }

  return shelves;
}
