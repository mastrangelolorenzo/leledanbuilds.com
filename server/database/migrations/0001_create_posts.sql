CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  teaser TEXT NOT NULL,
  description TEXT NOT NULL,
  featured_home INTEGER NOT NULL DEFAULT 0 CHECK (featured_home IN (0, 1)),
  featured_portfolio INTEGER NOT NULL DEFAULT 0 CHECK (featured_portfolio IN (0, 1)),
  sort_order_home INTEGER NOT NULL DEFAULT 0,
  sort_order_portfolio INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_posts_featured_home ON posts (featured_home, sort_order_home);
CREATE INDEX idx_posts_featured_portfolio ON posts (featured_portfolio, sort_order_portfolio);
