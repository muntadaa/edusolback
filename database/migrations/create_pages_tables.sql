-- Migration: Create pages and profile_pages tables for page access management
-- Created: 2025-01-15
-- Updated: Added company_id for multi-tenant support

-- Table: pages
-- Defines all pages that exist in the system (per company)
CREATE TABLE IF NOT EXISTS `pages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(100) NOT NULL COMMENT 'Page title/name',
  `route` VARCHAR(255) NOT NULL COMMENT 'Frontend route path (must start with /)',
  `company_id` INT NOT NULL COMMENT 'Company that owns this page',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_route_company` (`route`, `company_id`),
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_route` (`route`),
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: profile_pages
-- Defines which profile can access which page (per company)
CREATE TABLE IF NOT EXISTS `profile_pages` (
  `profile` VARCHAR(50) NOT NULL COMMENT 'User profile (admin, finance, student, etc.)',
  `page_id` INT NOT NULL COMMENT 'Reference to pages.id',
  `company_id` INT NOT NULL COMMENT 'Company that owns this assignment',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`profile`, `page_id`, `company_id`),
  FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  INDEX `idx_profile` (`profile`),
  INDEX `idx_page_id` (`page_id`),
  INDEX `idx_company_id` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: Admin profile bypasses profile_pages table checks and has access to ALL pages in their company
-- This is handled in application logic, not database constraints

