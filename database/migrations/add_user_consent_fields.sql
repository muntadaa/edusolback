-- Migration: Add consent and contact fields to users table
-- Description: Adds phone, picture, privacy policy, terms acceptance, and consent timestamp
-- Date: 2026-01-17

-- Add phone field (nullable)
ALTER TABLE users 
ADD COLUMN phone VARCHAR(255) NULL AFTER email;

-- Add picture field (optional)
ALTER TABLE users 
ADD COLUMN picture VARCHAR(255) NULL AFTER phone;

-- Add privacy policy acceptance (required, default false)
ALTER TABLE users 
ADD COLUMN privacy_policy_accepted BOOLEAN NOT NULL DEFAULT FALSE AFTER picture;

-- Add terms acceptance (required, default false)
ALTER TABLE users 
ADD COLUMN terms_accepted BOOLEAN NOT NULL DEFAULT FALSE AFTER privacy_policy_accepted;

-- Add consent timestamp (nullable)
ALTER TABLE users 
ADD COLUMN consent_accepted_at DATETIME NULL AFTER terms_accepted;

-- Optional: Update existing users to have default values
-- Existing users will have privacy_policy_accepted = FALSE and terms_accepted = FALSE
-- They can update these values when they next log in or update their profile
