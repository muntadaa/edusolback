-- ============================================================================
-- Add pdf_file column to modules and courses tables
-- ============================================================================

-- Add pdf_file column to modules table
ALTER TABLE `modules` 
ADD COLUMN `pdf_file` VARCHAR(255) NULL AFTER `coefficient`;

-- Add pdf_file column to courses table
ALTER TABLE `courses` 
ADD COLUMN `pdf_file` VARCHAR(255) NULL AFTER `coefficient`;

