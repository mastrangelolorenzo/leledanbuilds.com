ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;
-- The seeded admin (already existing before this migration) is exempt from
-- verification per this plan's Global Constraints — back-fill it as verified:
UPDATE users SET email_verified = 1 WHERE role = 'admin';
