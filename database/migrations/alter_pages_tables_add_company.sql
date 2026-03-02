-- Migration: Add company_id to pages and profile_pages tables
-- This migration adds company isolation to the page access management system
-- Run this if you have existing tables without company_id

-- ============================================================================
-- IMPORTANT: Before running this migration, you must:
-- 1. Assign company_id values to existing records (if any)
-- 2. Ensure all existing pages have a valid company_id
-- ============================================================================

-- Step 1: Add company_id column to pages table (allow NULL temporarily)
ALTER TABLE `pages`
  ADD COLUMN `company_id` INT NULL COMMENT 'Company that owns this page' AFTER `route`;

-- Step 2: If you have existing data, update all pages to have a company_id
-- ⚠️ IMPORTANT: Replace 1 with your actual company ID or update each row appropriately
-- UPDATE `pages` SET `company_id` = 1 WHERE `company_id` IS NULL;

-- Step 3: Make company_id NOT NULL after populating data
ALTER TABLE `pages`
  MODIFY COLUMN `company_id` INT NOT NULL;

-- Step 4: Add index for company_id in pages table
ALTER TABLE `pages`
  ADD INDEX `idx_company_id` (`company_id`);

-- Step 5: Add foreign key constraint for pages.company_id
ALTER TABLE `pages`
  ADD CONSTRAINT `fk_pages_company`
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE;

-- Step 6: Drop old unique constraint on route (if it exists)
-- Note: If this fails, the index might not exist - continue to next step
-- To check existing indexes: SHOW INDEX FROM `pages`;
ALTER TABLE `pages`
  DROP INDEX `route`;
-- If the above fails with "Unknown key 'route'", comment it out and continue

-- Step 7: Add new unique constraint on (route, company_id)
ALTER TABLE `pages`
  ADD UNIQUE KEY `uk_route_company` (`route`, `company_id`);

-- ============================================================================
-- Now update profile_pages table
-- ============================================================================

-- Step 8: Add company_id column to profile_pages table (allow NULL temporarily)
ALTER TABLE `profile_pages`
  ADD COLUMN `company_id` INT NULL COMMENT 'Company that owns this assignment' AFTER `page_id`;

-- Step 9: Populate company_id in profile_pages from related pages
-- This ensures profile_pages.company_id matches the page's company_id
UPDATE `profile_pages` pp
INNER JOIN `pages` p ON pp.page_id = p.id
SET pp.company_id = p.company_id
WHERE pp.company_id IS NULL;

-- Step 10: Make company_id NOT NULL after populating data
ALTER TABLE `profile_pages`
  MODIFY COLUMN `company_id` INT NOT NULL;

-- Step 11: Drop old primary key
ALTER TABLE `profile_pages`
  DROP PRIMARY KEY;

-- Step 12: Add new composite primary key including company_id
ALTER TABLE `profile_pages`
  ADD PRIMARY KEY (`profile`, `page_id`, `company_id`);

-- Step 13: Add index for company_id in profile_pages table
ALTER TABLE `profile_pages`
  ADD INDEX `idx_company_id` (`company_id`);

-- Step 14: Add foreign key constraint for profile_pages.company_id
ALTER TABLE `profile_pages`
  ADD CONSTRAINT `fk_profile_pages_company`
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE;

-- ============================================================================
-- Verification queries (run these to verify the migration)
-- ============================================================================

-- Check pages table structure
-- DESCRIBE `pages`;

-- Check profile_pages table structure
-- DESCRIBE `profile_pages`;

-- Verify foreign keys
-- SELECT 
--   TABLE_NAME,
--   CONSTRAINT_NAME,
--   COLUMN_NAME,
--   REFERENCED_TABLE_NAME,
--   REFERENCED_COLUMN_NAME
-- FROM information_schema.KEY_COLUMN_USAGE
-- WHERE TABLE_SCHEMA = DATABASE()
--   AND TABLE_NAME IN ('pages', 'profile_pages')
--   AND REFERENCED_TABLE_NAME IS NOT NULL;

