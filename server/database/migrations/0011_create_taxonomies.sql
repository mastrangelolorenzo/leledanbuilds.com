CREATE TABLE build_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_build_types_name ON build_types (name COLLATE NOCASE);

CREATE TABLE themes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_themes_name ON themes (name COLLATE NOCASE);

CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_categories_name ON categories (name COLLATE NOCASE);

INSERT OR IGNORE INTO build_types (name) SELECT DISTINCT build_type FROM browse_items;
INSERT OR IGNORE INTO themes (name) SELECT DISTINCT theme FROM browse_items;
INSERT OR IGNORE INTO categories (name) SELECT DISTINCT category FROM browse_items;
