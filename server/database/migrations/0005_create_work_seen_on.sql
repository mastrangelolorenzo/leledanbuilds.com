CREATE TABLE work_seen_on (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  counter TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL DEFAULT '#',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO work_seen_on (name, image_url, counter, link) VALUES
('Zenith', '/customers/zenith.webp', '334k+ subs', 'https://www.youtube.com/@zenithminecraft'),
('Divvy', '/customers/divvy.webp', '276k+ subs', 'https://www.youtube.com/@divvyminecraft'),
('Cypro', '/customers/cypro.webp', '96.7k+ subs', 'https://www.youtube.com/@cyproh'),
('Tigr8', '/customers/tigr8.webp', '145k+ subs', 'https://www.youtube.com/@Tigr8'),
('LilyGumdrop', '/customers/lilygumdrop.webp', '3.02M+ subs', 'https://www.youtube.com/@Lilygumdrop-rb'),
('yeslucid', '/customers/yeslucid.webp', '168k+ subs', 'https://www.youtube.com/@yeslucid'),
('OnMod', '/customers/onmod.webp', '19.5k+ subs', 'https://www.youtube.com/@OnMod'),
('Gabby16bit', '/customers/gabby16bit.webp', '3.52M+ subs', 'https://www.youtube.com/gabby16bit'),
('sharkliz', '/customers/sharkliz.webp', '399k+ subs', 'https://www.youtube.com/@Sharkilz'),
('swizu', '/customers/swizu.webp', '64.8k+ subs', 'https://www.youtube.com/@swizu_'),
('mythicalpingu', '/customers/mythicalpingu.webp', '35.6k+ subs', 'https://www.youtube.com/@MythicalPingu');
