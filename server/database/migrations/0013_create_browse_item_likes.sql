-- server/database/migrations/0013_create_browse_item_likes.sql
CREATE TABLE browse_item_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  browse_item_id INTEGER NOT NULL REFERENCES browse_items(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE UNIQUE INDEX idx_browse_item_likes_user_item ON browse_item_likes (user_id, browse_item_id);
CREATE INDEX idx_browse_item_likes_item ON browse_item_likes (browse_item_id);
