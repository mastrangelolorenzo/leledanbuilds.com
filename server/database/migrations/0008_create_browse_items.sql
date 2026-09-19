CREATE TABLE browse_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  price INTEGER NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard', 'Expert')),
  build_type TEXT NOT NULL,
  theme TEXT NOT NULL,
  category TEXT NOT NULL,
  released TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE UNIQUE INDEX idx_browse_items_slug ON browse_items (slug);

INSERT INTO browse_items (slug, title, image_url, price, difficulty, build_type, theme, category, released, description) VALUES
('modern-glass-villa', 'Modern Glass Villa', '/portfolio/10.webp', 120, 'Medium', 'House', 'Modern', 'Structures', '2026-01-10', 'A sleek two-story villa built with glass walls, dark stone accents and warm interior lighting, surrounded by lush greenery. Comes fully furnished and ready to drop into any modern-themed world.'),
('santas-floating-island', 'Santa''s Floating Island', '/portfolio/43.webp', 150, 'Expert', 'Map', 'Fantasy', 'Terraforming', '2025-12-01', 'A festive sky island wrapped in snow-capped peaks and glowing pine forests, centered on a towering Santa statue surrounded by gifts, a cozy cabin and a glowing golden portal.'),
('sweet-dream-express', 'Sweet Dream Express', '/portfolio/30.webp', 75, 'Hard', 'Vehicle', 'Fantasy', 'Organic', '2026-02-14', 'A whimsical creature riding atop a candy-colored rolling pin, wrapped in surreal, dreamlike detailing. A playful centerpiece for any fantasy build.'),
('whimsy-the-moth', 'Whimsy the Moth', '/portfolio/20.webp', 60, 'Easy', 'Statue', 'Fantasy', 'Organic', '2026-03-02', 'A charming close-up bust of a moth-like creature with expressive eyes and soft fuzzy texturing. A great entry point for organic character builds.'),
('neon-reverie', 'Neon Reverie', '/portfolio/25.webp', 110, 'Hard', 'Statue', 'Modern', 'Organic', '2026-01-22', 'A surreal glitch-art portrait bathed in neon purples and reds, blending organic sculpting with a bold, cyberpunk-inspired color palette.'),
('the-forsaken', 'The Forsaken', '/portfolio/15.webp', 90, 'Medium', 'Statue', 'Ancient', 'Organic', '2025-11-18', 'A haunting, decayed bust with a cracked stone texture and an unsettling gaze, set against a dark camouflaged backdrop. Perfect for horror or ancient ruin themed builds.');
