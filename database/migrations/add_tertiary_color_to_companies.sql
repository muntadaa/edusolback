-- Migration: Add tertiary_color column to companies table
-- Description: Adds support for a third customizable color (tertiary) for companies
-- Date: 2026-01-16

-- Add tertiary_color column
ALTER TABLE companies 
ADD COLUMN tertiary_color VARCHAR(7) NULL DEFAULT NULL 
AFTER secondary_color;

-- Optional: Set default value for existing companies (uncomment if needed)
-- UPDATE companies 
-- SET tertiary_color = '#f8fafc' 
-- WHERE tertiary_color IS NULL;
