-- server/database/migrations/0018_hero_backgrounds.sql
--
-- The home hero's rotating background images, which were a hardcoded array
-- in app/components/HomeHero.vue and so could only be changed by editing the
-- source and redeploying.

CREATE TABLE hero_backgrounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_hero_backgrounds_sort ON hero_backgrounds (sort_order);

-- The four images the component shipped with, so the home page looks
-- identical the moment this lands. /background/5.webp is deliberately left
-- out: it was commented out in the component, i.e. intentionally disabled.
INSERT INTO hero_backgrounds (image_url, sort_order) VALUES
  ('/background/1.webp', 0),
  ('/background/2.webp', 1),
  ('/background/3.webp', 2),
  ('/background/4.webp', 3);
