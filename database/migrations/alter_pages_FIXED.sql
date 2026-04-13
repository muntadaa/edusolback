-- ============================================================================
-- FIXED VERSION: ALTER TABLE statements for pages and profile_pages
-- This version handles the case where the route index might not exist
-- ============================================================================

-- ============================================================================
-- STEP 1: Check current indexes (run this first in phpMyAdmin)
-- ============================================================================
-- Run this query to see what indexes exist:
-- SHOW INDEX FROM `pages`;

-- ============================================================================
-- ALTER TABLE: pages
-- ============================================================================

-- 1. Add company_id column
ALTER TABLE `pages`
  ADD COLUMN `company_id` INT NULL AFTER `route`;

-- 2. Populate company_id (UPDATE THIS WITH YOUR COMPANY ID!)
-- If you have existing pages, you MUST run this:
-- UPDATE `pages` SET `company_id` = YOUR_COMPANY_ID WHERE `company_id` IS NULL;

-- 3. Make company_id NOT NULL
ALTER TABLE `pages`
  MODIFY COLUMN `company_id` INT NOT NULL;

-- 4. Add index for company_id
ALTER TABLE `pages`
  ADD INDEX `idx_company_id` (`company_id`);

-- 5. Add foreign key
ALTER TABLE `pages`
  ADD CONSTRAINT `fk_pages_company`
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE;

-- 6. Try to drop route unique constraint (may fail if it doesn't exist - that's OK)
-- Skip this step if you get an error, or check the index name first with SHOW INDEX
-- Common index names for unique route: 'route', 'uk_route', 'pages_route_unique'
-- If you're not sure, comment out the next line and check with SHOW INDEX FROM `pages`;

-- Try this first:
ALTER TABLE `pages` DROP INDEX `route`;
-- If that fails, try:
-- ALTER TABLE `pages` DROP INDEX `uk_route`;
-- Or check SHOW INDEX FROM `pages` to see the exact name

-- 7. Add new unique constraint (route + company_id)
ALTER TABLE `pages`
  ADD UNIQUE KEY `uk_route_company` (`route`, `company_id`);

-- ============================================================================
-- ALTER TABLE: profile_pages
-- ============================================================================

-- 8. Add company_id column
ALTER TABLE `profile_pages`
  ADD COLUMN `company_id` INT NULL AFTER `page_id`;

-- 9. Populate company_id from related pages (this will automatically sync with pages)
UPDATE `profile_pages` pp
INNER JOIN `pages` p ON pp.page_id = p.id
SET pp.company_id = p.company_id
WHERE pp.company_id IS NULL;

-- 10. Make company_id NOT NULL
ALTER TABLE `profile_pages`
  MODIFY COLUMN `company_id` INT NOT NULL;

-- 11. Drop old primary key
ALTER TABLE `profile_pages`
  DROP PRIMARY KEY;

-- 12. Add new composite primary key
ALTER TABLE `profile_pages`
  ADD PRIMARY KEY (`profile`, `page_id`, `company_id`);

-- 13. Add index for company_id
ALTER TABLE `profile_pages`
  ADD INDEX `idx_company_id` (`company_id`);

-- 14. Add foreign key
ALTER TABLE `profile_pages`
  ADD CONSTRAINT `fk_profile_pages_company`
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE;

