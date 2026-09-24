import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type {
  Bookmark,
  Category,
  CreateBookmarkInput,
  UpdateBookmarkInput,
  CreateCategoryInput,
} from '@ai-nav/shared';
import { runMigrations } from './migrations.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'data', 'ai-nav.db');

const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');

export function openDatabase(path = DB_PATH): Database.Database {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });

  const database = new Database(path);
  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');
  runMigrations(database, schema);
  return database;
}

let defaultDatabase: Database.Database | undefined;

export function getDefaultDatabase(): Database.Database {
  defaultDatabase ??= openDatabase();
  return defaultDatabase;
}

type BookmarkRow = Omit<Bookmark, 'is_favorite'> & { is_favorite: number };

function mapBookmark(row: BookmarkRow | undefined): Bookmark | undefined {
  return row ? { ...row, is_favorite: Boolean(row.is_favorite) } : undefined;
}

export function normalizeBookmarkUrl(raw: string): string {
  const url = new URL(raw);
  url.hash = '';
  if (url.pathname === '/') url.pathname = '';
  return url.toString();
}

// ==================== Bookmarks ====================

export function getAllBookmarks(): Bookmark[] {
  return (getDefaultDatabase().prepare('SELECT * FROM bookmarks ORDER BY category_id, sort_order').all() as BookmarkRow[])
    .map((row) => mapBookmark(row)!);
}

export function getBookmark(id: number): Bookmark | undefined {
  return mapBookmark(getDefaultDatabase().prepare('SELECT * FROM bookmarks WHERE id = ?').get(id) as BookmarkRow | undefined);
}

export function getBookmarkByUrl(url: string): Bookmark | undefined {
  const normalized = normalizeBookmarkUrl(url);
  const rows = getDefaultDatabase().prepare('SELECT * FROM bookmarks').all() as BookmarkRow[];
  return rows.map((row) => mapBookmark(row)!).find((bookmark) => {
    try {
      return normalizeBookmarkUrl(bookmark.url) === normalized;
    } catch {
      return false;
    }
  });
}

export function createBookmark(data: CreateBookmarkInput): Bookmark {
  const normalizedUrl = normalizeBookmarkUrl(data.url);
  if (getBookmarkByUrl(normalizedUrl)) {
    throw new Error('BOOKMARK_URL_EXISTS');
  }
  const stmt = getDefaultDatabase().prepare(`
    INSERT INTO bookmarks (title, url, internal_url, description, favicon, category_id, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM bookmarks WHERE category_id IS ?))
  `);
  const result = stmt.run(data.title, normalizedUrl, data.internal_url || '', data.description || '', data.favicon || '', data.category_id ?? null, data.category_id ?? null);
  return getBookmark(result.lastInsertRowid as number)!;
}

export function updateBookmark(id: number, data: UpdateBookmarkInput): Bookmark | undefined {
  const existing = getBookmark(id);
  if (!existing) return undefined;
  const merged = { ...existing, ...data };
  const normalizedUrl = normalizeBookmarkUrl(merged.url);
  const duplicate = getBookmarkByUrl(normalizedUrl);
  if (duplicate && duplicate.id !== id) throw new Error('BOOKMARK_URL_EXISTS');
  getDefaultDatabase().prepare(`
    UPDATE bookmarks SET title = ?, url = ?, internal_url = ?, description = ?, favicon = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(merged.title, normalizedUrl, merged.internal_url || '', merged.description, merged.favicon, merged.category_id, id);
  return getBookmark(id);
}

export function setBookmarkFavorite(id: number, isFavorite: boolean): Bookmark | undefined {
  if (!getBookmark(id)) return undefined;
  getDefaultDatabase().prepare(`
    UPDATE bookmarks
    SET is_favorite = ?,
        favorited_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(isFavorite ? 1 : 0, isFavorite ? 1 : 0, id);
  return getBookmark(id);
}

export function recordBookmarkOpen(id: number): Bookmark | undefined {
  if (!getBookmark(id)) return undefined;
  getDefaultDatabase().prepare(`
    UPDATE bookmarks SET last_opened_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(id);
  return getBookmark(id);
}

export function deleteBookmark(id: number): boolean {
  return getDefaultDatabase().prepare('DELETE FROM bookmarks WHERE id = ?').run(id).changes > 0;
}

export function reorderBookmarks(ids: number[]): void {
  const database = getDefaultDatabase();
  const stmt = database.prepare('UPDATE bookmarks SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  const reorderMany = database.transaction((items: number[]) => {
    items.forEach((id, index) => stmt.run(index, id));
  });
  reorderMany(ids);
}

export function createBookmarksBulk(items: CreateBookmarkInput[]): Bookmark[] {
  const insertMany = getDefaultDatabase().transaction((batch: CreateBookmarkInput[]) => {
    const results: Bookmark[] = [];
    for (const item of batch) {
      results.push(createBookmark(item));
    }
    return results;
  });
  return insertMany(items);
}

// ==================== Categories ====================

export function getAllCategories(): Category[] {
  return getDefaultDatabase().prepare('SELECT * FROM categories ORDER BY sort_order').all() as Category[];
}

export function getCategory(id: number): Category | undefined {
  return getDefaultDatabase().prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | undefined;
}

export function getCategoryByName(name: string): Category | undefined {
  return getDefaultDatabase().prepare('SELECT * FROM categories WHERE name = ?').get(name) as Category | undefined;
}

export function createCategory(data: CreateCategoryInput): Category {
  const stmt = getDefaultDatabase().prepare(`
    INSERT INTO categories (name, icon, color, sort_order)
    VALUES (?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories))
  `);
  const result = stmt.run(data.name, data.icon || 'folder', data.color || '#a78bfa');
  return getCategory(result.lastInsertRowid as number)!;
}

export function updateCategory(id: number, data: Partial<CreateCategoryInput>): Category | undefined {
  const existing = getCategory(id);
  if (!existing) return undefined;
  const merged = { ...existing, ...data };
  getDefaultDatabase().prepare('UPDATE categories SET name = ?, icon = ?, color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(merged.name, merged.icon, merged.color, id);
  return getCategory(id);
}

export function deleteCategory(id: number): boolean {
  getDefaultDatabase().prepare('UPDATE bookmarks SET category_id = NULL WHERE category_id = ?').run(id);
  return getDefaultDatabase().prepare('DELETE FROM categories WHERE id = ?').run(id).changes > 0;
}

export function reorderCategories(ids: number[]): void {
  const database = getDefaultDatabase();
  const stmt = database.prepare('UPDATE categories SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  const reorderMany = database.transaction((items: number[]) => {
    items.forEach((id, index) => stmt.run(index, id));
  });
  reorderMany(ids);
}

// ==================== Settings ====================

export function getSetting(key: string): string | undefined {
  const row = getDefaultDatabase().prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value;
}

export function setSetting(key: string, value: string): void {
  getDefaultDatabase().prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}
