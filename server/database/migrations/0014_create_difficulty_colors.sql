-- server/database/migrations/0014_create_difficulty_colors.sql
CREATE TABLE difficulty_colors (
  level TEXT PRIMARY KEY CHECK (level IN ('Easy', 'Medium', 'Hard', 'Expert')),
  color TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO difficulty_colors (level, color) VALUES
  ('Easy', '#22c55e'),
  ('Medium', '#eab308'),
  ('Hard', '#f97316'),
  ('Expert', '#ef4444');
