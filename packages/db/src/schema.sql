-- AI Nav Database Schema

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT '#a78bfa',
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT DEFAULT '',
  favicon TEXT DEFAULT '',
  category_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Default categories
INSERT OR IGNORE INTO categories (name, icon, color, sort_order) VALUES
  ('AI Tools', 'sparkles', '#00d4ff', 0),
  ('Dev Tools', 'code', '#a78bfa', 1),
  ('Social', 'users', '#ff6b9d', 2),
  ('Self-hosted', 'server', '#ffaa00', 3),
  ('Other', 'folder', '#6b7280', 4);
