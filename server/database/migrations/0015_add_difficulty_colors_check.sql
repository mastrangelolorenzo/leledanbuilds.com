-- server/database/migrations/0015_add_difficulty_colors_check.sql
--
-- Adds a CHECK constraint enforcing the same strict 6-digit-hex format that
-- server/api/difficulty-colors/[level].put.ts already validates at write
-- time (isValidHexColor, server/utils/difficultyColors.ts) and that
-- app/pages/browse/[slug].vue now re-validates at the point of use. This
-- makes the format a database-level invariant, holding even for a write
-- path that doesn't go through that one endpoint -- not just the code path
-- that happens to exist today.
--
-- SQLite has no `ALTER TABLE ... ADD CONSTRAINT`; a CHECK is added by
-- rebuilding the table (the documented SQLite procedure), preserving the
-- primary key, data and defaults exactly.
-- D1 rejects a single GLOB pattern that repeats a character class six
-- times ("LIKE or GLOB pattern too complex"), so the six hex positions are
-- checked one at a time instead of as one compound pattern -- functionally
-- identical to /^#[0-9a-fA-F]{6}$/, just expressed as length + per-position
-- class checks to stay under D1's pattern-complexity limit.
CREATE TABLE difficulty_colors_new (
  level TEXT PRIMARY KEY CHECK (level IN ('Easy', 'Medium', 'Hard', 'Expert')),
  color TEXT NOT NULL CHECK (
    length(color) = 7
    AND substr(color, 1, 1) = '#'
    AND substr(color, 2, 1) GLOB '[0-9a-fA-F]'
    AND substr(color, 3, 1) GLOB '[0-9a-fA-F]'
    AND substr(color, 4, 1) GLOB '[0-9a-fA-F]'
    AND substr(color, 5, 1) GLOB '[0-9a-fA-F]'
    AND substr(color, 6, 1) GLOB '[0-9a-fA-F]'
    AND substr(color, 7, 1) GLOB '[0-9a-fA-F]'
  ),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO difficulty_colors_new (level, color, updated_at)
SELECT level, color, updated_at FROM difficulty_colors;

DROP TABLE difficulty_colors;

ALTER TABLE difficulty_colors_new RENAME TO difficulty_colors;
