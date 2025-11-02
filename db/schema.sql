CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  alias TEXT UNIQUE NOT NULL,
  target TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  expires_at INTEGER,
  password_hash TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  clicks_total INTEGER NOT NULL DEFAULT 0,
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_links_alias ON links(alias);
CREATE INDEX IF NOT EXISTS idx_links_active ON links(is_active);
CREATE INDEX IF NOT EXISTS idx_links_target ON links(target);

CREATE TABLE IF NOT EXISTS click_daily (
  alias TEXT NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (alias, day)
);
