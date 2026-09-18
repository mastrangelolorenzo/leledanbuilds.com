CREATE TABLE pricing_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  price TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  features TEXT NOT NULL DEFAULT '[]',
  badge TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO pricing_plans (title, price, subtitle, features, badge) VALUES
('Organics', '50€+', 'Per Build', '["High Quality","Advanced Texturing","2 Revision Rounds","1 Week Max Delivery"]', NULL),
('Structures', '70€+', 'Per Build', '["High Quality","Advanced Details","2 Revision Rounds","1 Week Max Delivery"]', NULL),
('Terraforming', '200€+', 'Per Build', '["High Quality","Advanced Realism","1 Revision Round","2 Weeks Max Delivery"]', NULL),
('Skin Creation', '20€+', 'Per Skin', '["High Quality","Advanced Texturing","2 Revision Rounds","1 Week Max Delivery"]', NULL),
('Custom Projects', 'Upon Request', '', '["Unique Projects","Complete Servers","Spawns & Lobbies","Custom Timelines"]', 'Popular');
