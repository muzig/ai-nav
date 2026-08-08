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

export function isLocalServiceUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname.replace(/^\[|\]$/g, '').toLocaleLowerCase();
    if (hostname === 'localhost' || hostname === '0.0.0.0' || hostname === '::1' || hostname.endsWith('.local')) {
      return true;
    }

    if (!hostname.includes('.')) return true;

    const octets = hostname.split('.').map(Number);
    if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
      return false;
    }

    const [first, second] = octets;
    return first === 10
      || first === 127
      || (first === 172 && second >= 16 && second <= 31)
      || (first === 192 && second === 168)
      || (first === 169 && second === 254)
      || (first === 100 && second >= 64 && second <= 127);
  } catch {
    return false;
  }
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
  const localServices = visible
    .filter((bookmark) => isLocalServiceUrl(bookmark.url))
    .sort((a, b) => usageTime(b) - usageTime(a));

  if (localServices.length) {
    shelves.push({ id: 'local-services', title: 'Local Services', bookmarks: localServices });
  }

  const favorites = visible
    .filter((bookmark) => bookmark.is_favorite && !isLocalServiceUrl(bookmark.url))
    .sort((a, b) => usageTime(b) - usageTime(a));

  if (favorites.length) {
    shelves.push({ id: 'favorites', title: 'Favorites', bookmarks: favorites });
  }

  for (const category of [...categories].sort((a, b) => a.sort_order - b.sort_order)) {
    const items = visible
      .filter((bookmark) => !bookmark.is_favorite
        && !isLocalServiceUrl(bookmark.url)
        && bookmark.category_id === category.id)
      .sort((a, b) => a.sort_order - b.sort_order);
    if (items.length) shelves.push({ id: `category-${category.id}`, title: category.name, bookmarks: items });
  }

  const uncategorized = visible
    .filter((bookmark) => !bookmark.is_favorite
      && !isLocalServiceUrl(bookmark.url)
      && bookmark.category_id === null)
    .sort((a, b) => a.sort_order - b.sort_order);
  if (uncategorized.length) {
    shelves.push({ id: 'uncategorized', title: 'Uncategorized', bookmarks: uncategorized });
  }

  return shelves;
}
