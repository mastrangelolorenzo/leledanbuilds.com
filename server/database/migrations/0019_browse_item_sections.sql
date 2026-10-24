-- server/database/migrations/0019_browse_item_sections.sql
--
-- Splits browse_items into two catalogues: the builds shop (/browse) and the
-- skinpacks page (/skinpacks). A skinpack is the same kind of row as a build
-- -- image, tags, description, optional downloadable file -- so it reuses
-- this table and everything already attached to it (taxonomies, likes, the
-- admin form, and later the checkout) rather than getting a parallel table
-- that would need all of it rebuilt.
--
-- Existing rows are all builds, which is why the default is 'builds': the
-- shop keeps showing exactly what it showed before this ran.

ALTER TABLE browse_items
  ADD COLUMN section TEXT NOT NULL DEFAULT 'builds'
  CHECK (section IN ('builds', 'skinpacks'));

-- Both pages filter on this column on every load, and it is the only
-- predicate they have.
CREATE INDEX idx_browse_items_section ON browse_items (section);
