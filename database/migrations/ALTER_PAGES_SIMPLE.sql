-- ============================================================================
-- SIMPLE VERSION: ALTER TABLE statements for pages and profile_pages
-- ============================================================================

-- ============================================================================
-- ALTER TABLE: pages
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

-- 4. Add index
ALTER TABLE `pages`
  ADD INDEX `idx_company_id` (`company_id`);

-- 5. Add foreign key
ALTER TABLE `pages`
  ADD CONSTRAINT `fk_pages_company`
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE;

-- 6. Drop old unique constraint (may fail if it doesn't exist - that's OK)
-- Check first: SHOW INDEX FROM `pages` WHERE Key_name = 'route';
ALTER TABLE `pages`
  DROP INDEX `route`;

-- 7. Add new unique constraint (route + company_id)
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

-- 13. Add index
ALTER TABLE `profile_pages`
  ADD INDEX `idx_company_id` (`company_id`);

-- 14. Add foreign key
ALTER TABLE `profile_pages`
  ADD CONSTRAINT `fk_profile_pages_company`
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE;

