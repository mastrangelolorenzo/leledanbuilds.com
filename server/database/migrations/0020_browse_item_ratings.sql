-- server/database/migrations/0020_browse_item_ratings.sql
--
-- Star ratings (1-5) for skinpacks, which show these instead of the like
-- button the builds shop uses.
--
-- A separate table rather than a `rating` column on browse_item_likes: that
-- table means "this user liked this item", and overloading it would make
-- every existing like query need a WHERE clause to avoid counting ratings as
-- likes. Likes stay untouched and cannot regress.

CREATE TABLE browse_item_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  browse_item_id INTEGER NOT NULL REFERENCES browse_items(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- One rating per person per item: this index, not the upsert in
-- server/api/browse-items/[id]/rating.put.ts, is what actually enforces it
-- when two requests race.
CREATE UNIQUE INDEX idx_browse_item_ratings_user_item ON browse_item_ratings (user_id, browse_item_id);
CREATE INDEX idx_browse_item_ratings_item ON browse_item_ratings (browse_item_id);
