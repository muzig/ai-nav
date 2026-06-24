import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Bookmark, Category, CreateBookmarkInput, UpdateBookmarkInput, CreateCategoryInput } from '@ai-nav/shared';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'data', 'ai-nav.db');

mkdirSync(join(__dirname, '..', 'data'), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema
const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

// ==================== Bookmarks ====================

export function getAllBookmarks(): Bookmark[] {
  return db.prepare('SELECT * FROM bookmarks ORDER BY category_id, sort_order').all() as Bookmark[];
}

export function getBookmark(id: number): Bookmark | undefined {
  return db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id) as Bookmark | undefined;
}

export function createBookmark(data: CreateBookmarkInput): Bookmark {
  const stmt = db.prepare(`
    INSERT INTO bookmarks (title, url, description, favicon, category_id, sort_order)
    VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM bookmarks WHERE category_id IS ?))
  `);
  const result = stmt.run(data.title, data.url, data.description || '', data.favicon || '', data.category_id ?? null, data.category_id ?? null);
  return getBookmark(result.lastInsertRowid as number)!;
}

export function updateBookmark(id: number, data: UpdateBookmarkInput): Bookmark | undefined {
  const existing = getBookmark(id);
  if (!existing) return undefined;
  const merged = { ...existing, ...data };
  db.prepare(`
    UPDATE bookmarks SET title = ?, url = ?, description = ?, favicon = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(merged.title, merged.url, merged.description, merged.favicon, merged.category_id, id);
  return getBookmark(id);
}

export function deleteBookmark(id: number): boolean {
  return db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id).changes > 0;
}

export function createBookmarksBulk(items: CreateBookmarkInput[]): Bookmark[] {
  const insert = db.prepare(`
    INSERT INTO bookmarks (title, url, description, favicon, category_id, sort_order)
    VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM bookmarks WHERE category_id IS ?))
  `);
  const insertMany = db.transaction((batch: CreateBookmarkInput[]) => {
    const results: Bookmark[] = [];
    for (const item of batch) {
      const result = insert.run(item.title, item.url, item.description || '', item.favicon || '', item.category_id ?? null, item.category_id ?? null);
      results.push(getBookmark(result.lastInsertRowid as number)!);
    }
    return results;
  });
  return insertMany(items);
}

// ==================== Categories ====================

export function getAllCategories(): Category[] {
  return db.prepare('SELECT * FROM categories ORDER BY sort_order').all() as Category[];
}

export function getCategory(id: number): Category | undefined {
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | undefined;
}

export function getCategoryByName(name: string): Category | undefined {
  return db.prepare('SELECT * FROM categories WHERE name = ?').get(name) as Category | undefined;
}

export function createCategory(data: CreateCategoryInput): Category {
  const stmt = db.prepare(`
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
  db.prepare('UPDATE categories SET name = ?, icon = ?, color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(merged.name, merged.icon, merged.color, id);
  return getCategory(id);
}

export function deleteCategory(id: number): boolean {
  db.prepare('UPDATE bookmarks SET category_id = NULL WHERE category_id = ?').run(id);
  return db.prepare('DELETE FROM categories WHERE id = ?').run(id).changes > 0;
}

// ==================== Settings ====================

export function getSetting(key: string): string | undefined {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value;
}

export function setSetting(key: string, value: string): void {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

export default db;
