-- server/database/migrations/0003_fix_sort_order_home.sql
-- Migration 0002 seeded sort_order_home as Freaky=0, Technoblade=1, Guardian=2,
-- Ancient=3, but the live PremiumProjects.vue home order is actually
-- Freaky, Guardian, Ancient, Technoblade. Correct it here (additive fix,
-- not an edit to the already-applied 0002) so both local and remote D1
-- end up consistent regardless of when they ran 0002.
UPDATE posts SET sort_order_home = 1 WHERE slug = 'guardian-of-the-grove';
UPDATE posts SET sort_order_home = 2 WHERE slug = 'the-ancient-artisan';
UPDATE posts SET sort_order_home = 3 WHERE slug = 'a-memorial-to-technoblade';
