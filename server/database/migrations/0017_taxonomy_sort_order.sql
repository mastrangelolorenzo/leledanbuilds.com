-- server/database/migrations/0017_taxonomy_sort_order.sql
--
-- Gives the three taxonomies an explicit display order, so the owner can
-- arrange the public filter lists instead of getting whatever order the
-- products happened to come back in.

ALTER TABLE build_types ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE themes ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE categories ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

-- Backfill with each term's alphabetical position rather than leaving every
-- row at 0: with all-zero values the order would fall back to whatever the
-- storage engine returns, which is arbitrary and would look like the drag
-- handles had silently done nothing on first use.
UPDATE build_types SET sort_order = (
  SELECT COUNT(*) FROM build_types o WHERE o.name COLLATE NOCASE < build_types.name COLLATE NOCASE
);
UPDATE themes SET sort_order = (
  SELECT COUNT(*) FROM themes o WHERE o.name COLLATE NOCASE < themes.name COLLATE NOCASE
);
UPDATE categories SET sort_order = (
  SELECT COUNT(*) FROM categories o WHERE o.name COLLATE NOCASE < categories.name COLLATE NOCASE
);

-- The lists are read on every public browse page load, ordered by this
-- column.
CREATE INDEX idx_build_types_sort ON build_types (sort_order);
CREATE INDEX idx_themes_sort ON themes (sort_order);
CREATE INDEX idx_categories_sort ON categories (sort_order);
