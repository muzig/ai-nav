import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase } from './index.js';

describe('openDatabase', () => {
  const databases: Array<ReturnType<typeof openDatabase>> = [];
  const temporaryDirectories: string[] = [];

  afterEach(() => {
    databases.splice(0).forEach((database) => {
      if (database.open) database.close();
    });
    temporaryDirectories.splice(0).forEach((directory) => {
      rmSync(directory, { recursive: true, force: true });
    });
  });

  const temporaryDatabasePath = () => {
    const directory = mkdtempSync(join(tmpdir(), 'ai-nav-db-'));
    temporaryDirectories.push(directory);
    return join(directory, 'ai-nav.db');
  };

  it('opens an initialized version 1 database', () => {
    const database = openDatabase(':memory:');
    databases.push(database);

    expect(database.pragma('user_version', { simple: true })).toBe(1);
    const tableNames = (database.prepare(`
      SELECT name FROM sqlite_master
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all() as Array<{ name: string }>).map(({ name }) => name);
    expect(tableNames).toEqual(['bookmarks', 'categories', 'settings']);
  });

  it('keeps in-memory database instances isolated', () => {
    const first = openDatabase(':memory:');
    const second = openDatabase(':memory:');
    databases.push(first, second);

    first.prepare('INSERT INTO bookmarks (title, url) VALUES (?, ?)').run('Private tool', 'https://example.com/private');

    expect(first.prepare("SELECT title FROM bookmarks WHERE url = 'https://example.com/private'").get())
      .toEqual({ title: 'Private tool' });
    expect(second.prepare("SELECT title FROM bookmarks WHERE url = 'https://example.com/private'").get())
      .toBeUndefined();
  });

  it('upgrades a legacy Bookmark table without losing existing data', () => {
    const path = temporaryDatabasePath();
    const legacy = new Database(path);
    legacy.exec(`
      CREATE TABLE bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        description TEXT DEFAULT '',
        favicon TEXT DEFAULT '',
        category_id INTEGER,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO bookmarks (title, url) VALUES ('Existing tool', 'https://example.com');
    `);
    legacy.close();

    const migrated = openDatabase(path);
    databases.push(migrated);
    const columnNames = (migrated.prepare('PRAGMA table_info(bookmarks)').all() as Array<{ name: string }>)
      .map((column) => column.name);

    expect(migrated.pragma('user_version', { simple: true })).toBe(1);
    expect(columnNames).toEqual(expect.arrayContaining(['is_favorite', 'favorited_at', 'last_opened_at']));
    expect(migrated.prepare('SELECT title, url FROM bookmarks WHERE id = 1').get()).toEqual({
      title: 'Existing tool',
      url: 'https://example.com',
    });
  });

  it('does not repeat version-one seed data when a migrated file is reopened', () => {
    const path = temporaryDatabasePath();
    const first = openDatabase(path);
    databases.push(first);
    first.prepare("DELETE FROM categories WHERE name = 'AI Tools'").run();
    first.close();

    const reopened = openDatabase(path);
    databases.push(reopened);

    expect(reopened.prepare("SELECT id FROM categories WHERE name = 'AI Tools'").get()).toBeUndefined();
    expect(reopened.pragma('user_version', { simple: true })).toBe(1);
  });

});
