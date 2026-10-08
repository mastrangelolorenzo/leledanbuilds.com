-- server/database/migrations/0016_order_ops_and_rate_limits.sql
--
-- Operational columns for orders plus a rate-limit table.
--
-- Why needs_refund instead of a new status value: orders.status carries a
-- CHECK (status IN ('pending','completed','failed')) and SQLite cannot alter
-- a CHECK constraint without rebuilding the table. A duplicate purchase IS a
-- completed payment -- the money really was captured -- so 'completed' stays
-- correct and the "we owe this person their money back" fact lives in its own
-- column. Access is boolean (any one completed order grants the download), so
-- a second completed order costs the buyer money without granting anything,
-- which is exactly what needs_refund marks for the admin to act on.

ALTER TABLE orders ADD COLUMN needs_refund INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN refunded_at TEXT;
ALTER TABLE orders ADD COLUMN dispute_status TEXT;
ALTER TABLE orders ADD COLUMN admin_note TEXT;

-- Finds the orders an operator has to look at: stuck pending ones, duplicates
-- awaiting a refund, and disputes.
CREATE INDEX idx_orders_attention ON orders (status, needs_refund);

-- Backfill: flag every completed order that is not the FIRST completed order
-- for its (user, item) pair. On a database where the double-purchase hole was
-- already exercised this immediately surfaces the money that is owed back,
-- rather than leaving it invisible.
UPDATE orders
SET needs_refund = 1
WHERE status = 'completed'
  AND id NOT IN (
    SELECT MIN(id) FROM orders WHERE status = 'completed' GROUP BY user_id, browse_item_id
  );

-- Fixed-window rate limiting. Keyed by "<bucket>:<identifier>" (e.g.
-- "login:1.2.3.4" or "register:someone@example.com"), one row per key.
--
-- Deliberately D1 and not in-process memory: Workers isolates are ephemeral
-- and spread across colos, so an in-memory counter resets on every cold start
-- and is not shared between concurrent isolates -- it would not actually limit
-- anything. D1 is a single logical writer, so the counter is real.
CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  -- Unix epoch SECONDS at which the current window opened. Integer rather
  -- than a text timestamp so the window arithmetic is plain comparison and
  -- needs no date parsing in SQL.
  window_start INTEGER NOT NULL
);

-- Lets the cleanup sweep delete expired rows without a full scan.
CREATE INDEX idx_rate_limits_window ON rate_limits (window_start);
