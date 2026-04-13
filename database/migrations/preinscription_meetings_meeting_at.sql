-- Migration: Replace meeting_date (date) with meeting_at (datetime) on preinscription_meetings
-- Fixes: Incorrect datetime value '0000-00-00 00:00:00' when TypeORM adds NOT NULL datetime to existing rows
-- Run this once, then restart the app (TypeORM synchronize will then see the column and not re-add it).

-- 1. Add new column as nullable so existing rows get NULL (valid)
ALTER TABLE preinscription_meetings
ADD COLUMN meeting_at DATETIME NULL AFTER preinscription_id;

-- 2. Copy date to datetime (use noon for existing date-only values)
UPDATE preinscription_meetings
SET meeting_at = CONCAT(CAST(meeting_date AS CHAR), ' 12:00:00')
WHERE meeting_date IS NOT NULL;

-- 3. Ensure no NULLs remain (e.g. if meeting_date was null)
UPDATE preinscription_meetings
SET meeting_at = COALESCE(meeting_at, NOW())
WHERE meeting_at IS NULL;

-- 4. Make column NOT NULL
ALTER TABLE preinscription_meetings
MODIFY COLUMN meeting_at DATETIME NOT NULL;

-- 5. Remove old column
ALTER TABLE preinscription_meetings
DROP COLUMN meeting_date;
