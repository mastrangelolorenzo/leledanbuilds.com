-- server/database/migrations/0021_skinpack_categories.sql
--
-- Skinpacks get their own category list. They were sharing `categories`
-- with the builds shop, which is how a skin pack ended up tagged
-- "Structures": the terms there describe builds, not skins.
--
-- A separate table rather than a `section` column on `categories`: the
-- taxonomy admin and its five generic endpoints take the table name from
-- the map in server/utils/taxonomy.ts, so a new table needs no change to any
-- of that SQL, while a section column would need a filter added to every
-- statement in it.
--
-- Left empty on purpose -- the owner creates these terms under Taxonomies.

CREATE TABLE skinpack_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX idx_skinpack_categories_name ON skinpack_categories (name COLLATE NOCASE);
CREATE INDEX idx_skinpack_categories_sort ON skinpack_categories (sort_order);
