-- server/database/migrations/0022_browse_items_featured_home.sql
--
-- Lets the owner pick which skinpacks show in the home page's skinpack
-- section, the same way posts.featured_home drives Premium Projects.
--
-- No cap: the section is a plain grid, so a fifth pack simply makes another
-- row instead of being silently dropped.

ALTER TABLE browse_items
  ADD COLUMN featured_home INTEGER NOT NULL DEFAULT 0
  CHECK (featured_home IN (0, 1));
