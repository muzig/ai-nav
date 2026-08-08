import type Database from 'better-sqlite3';

const LATEST_DATABASE_VERSION = 1;

function addLegacyBookmarkColumns(database: Database.Database): void {
  const columns = new Set(
    (database.prepare('PRAGMA table_info(bookmarks)').all() as Array<{ name: string }>)
      .map((column) => column.name),
  );

  if (!columns.has('is_favorite')) {
    database.exec('ALTER TABLE bookmarks ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0');
  }
  if (!columns.has('favorited_at')) {
    database.exec('ALTER TABLE bookmarks ADD COLUMN favorited_at TEXT');
  }
  if (!columns.has('last_opened_at')) {
    database.exec('ALTER TABLE bookmarks ADD COLUMN last_opened_at TEXT');
  }
}

export function runMigrations(database: Database.Database, versionOneSchema: string): void {
  const currentVersion = database.pragma('user_version', { simple: true }) as number;
  if (currentVersion >= LATEST_DATABASE_VERSION) return;

  database.transaction(() => {
    const lockedVersion = database.pragma('user_version', { simple: true }) as number;
    if (lockedVersion >= LATEST_DATABASE_VERSION) return;

    database.exec(versionOneSchema);
    addLegacyBookmarkColumns(database);
    database.pragma(`user_version = ${LATEST_DATABASE_VERSION}`);
  })();
}
