-- ============================================================================
-- Check existing indexes before dropping
-- ============================================================================

-- First, check what indexes exist on pages table:
-- Run this to see current indexes:
SHOW INDEX FROM `pages`;

-- Check what indexes exist on profile_pages table:
SHOW INDEX FROM `profile_pages`;

-- ============================================================================
-- ALTER TABLE: pages (Safe version - checks indexes first)
-- ============================================================================

-- 1. Add company_id column (NULL first, will be populated later)
ALTER TABLE `pages`
  ADD COLUMN `company_id` INT NULL AFTER `route`;

-- 2. Populate company_id (IMPORTANT: Update this with your actual company ID)
-- If you have existing pages, assign them to a company:
-- UPDATE `pages` SET `company_id` = 1 WHERE `company_id` IS NULL;

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

-- 6. Drop old unique constraint on route (ONLY IF IT EXISTS)
-- Check the output of SHOW INDEX FROM `pages` above to see the exact index name
-- Common names: 'route', 'uk_route', or it might not exist as a separate index
-- If the route column has a UNIQUE constraint, it might be:
-- Option A: If it's a UNIQUE INDEX named 'route':
ALTER TABLE `pages` DROP INDEX `route`;

-- Option B: If it's a UNIQUE constraint (not an index), you may need to:
-- ALTER TABLE `pages` DROP INDEX `uk_route`;

-- Option C: If the unique constraint doesn't exist or has a different name,
-- you can skip this step and go directly to step 7

-- 7. Add new unique constraint (route + company_id)
-- This will fail if route is still unique - that's why step 6 is important
ALTER TABLE `pages`
  ADD UNIQUE KEY `uk_route_company` (`route`, `company_id`);

-- ============================================================================
-- ALTER TABLE: profile_pages
-- ============================================================================

-- 8. Add company_id column (NULL first)
ALTER TABLE `profile_pages`
  ADD COLUMN `company_id` INT NULL AFTER `page_id`;

-- 9. Populate company_id from related pages
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

