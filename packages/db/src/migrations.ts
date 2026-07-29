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
}
