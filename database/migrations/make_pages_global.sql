-- Migration: Make pages global (remove company_id)
-- This script removes duplicate pages and makes pages global for all companies

-- Step 1: Update role_pages to reference the first occurrence of each route
-- For each duplicate route, we'll keep the page with the lowest ID and update all role_pages references

-- Create a temporary table to track which page ID to keep for each route
CREATE TEMPORARY TABLE IF NOT EXISTS pages_to_keep AS
SELECT 
    route,
    MIN(id) as keep_page_id
FROM pages
GROUP BY route;

-- Create a temporary table to map old page IDs to new page IDs
CREATE TEMPORARY TABLE IF NOT EXISTS page_id_mapping AS
SELECT 
    p.id as old_page_id,
    ptk.keep_page_id as new_page_id
FROM pages p
INNER JOIN pages_to_keep ptk ON p.route = ptk.route;

-- Step 2: Update role_pages to use the kept page IDs
UPDATE role_pages rp
INNER JOIN page_id_mapping pim ON rp.page_id = pim.old_page_id
SET rp.page_id = pim.new_page_id
WHERE rp.page_id != pim.new_page_id;

-- Step 3: Delete duplicate pages (keep only the one with lowest ID per route)
DELETE p1 FROM pages p1
INNER JOIN pages_to_keep ptk ON p1.route = ptk.route
WHERE p1.id != ptk.keep_page_id;

-- Step 4: Remove company_id column from pages table
-- First, check if column exists and remove foreign key constraint
SET @constraint_name = (
    SELECT CONSTRAINT_NAME 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'pages' 
    AND COLUMN_NAME = 'company_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL
    LIMIT 1
);

SET @sql = IF(@constraint_name IS NOT NULL, 
    CONCAT('ALTER TABLE pages DROP FOREIGN KEY ', @constraint_name), 
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Remove the company_id column
ALTER TABLE pages DROP COLUMN IF EXISTS company_id;

-- Step 5: Add unique constraint on route (if not already exists)
-- Check if unique index already exists
SET @index_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'pages' 
    AND INDEX_NAME = 'IDX_pages_route_unique'
);

SET @sql = IF(@index_exists = 0, 
    'ALTER TABLE pages ADD UNIQUE INDEX IDX_pages_route_unique (route)', 
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Clean up temporary tables
DROP TEMPORARY TABLE IF EXISTS pages_to_keep;
DROP TEMPORARY TABLE IF EXISTS page_id_mapping;

SELECT 'Migration completed successfully: Pages are now global' AS result;
