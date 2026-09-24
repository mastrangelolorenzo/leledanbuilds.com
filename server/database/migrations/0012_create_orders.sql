-- server/database/migrations/0012_create_orders.sql
ALTER TABLE browse_items ADD COLUMN download_key TEXT;

CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  browse_item_id INTEGER NOT NULL REFERENCES browse_items(id),
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paypal')),
  provider_session_id TEXT NOT NULL,
  provider_reference TEXT,
  -- Despite the declared type, this holds WHOLE EUROS (a frozen snapshot of
  -- browse_items.price at checkout-init time), not cents -- and it may be
  -- fractional (SQLite does not enforce column types). Stripe is charged in
  -- cents via Math.round(amount * 100); PayPal is quoted a decimal string
  -- built the same way. See paypalAmountMatchesOrder in server/lib/paypal.ts.
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE UNIQUE INDEX idx_orders_provider_session ON orders (provider, provider_session_id);
CREATE INDEX idx_orders_user_status ON orders (user_id, status);
