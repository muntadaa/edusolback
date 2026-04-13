-- Optional one-off after deploying "validation row only after teacher validates notes".
-- Removes scholarity-queue rows for presences whose session notes were never locked by the teacher flow.
-- Review in a transaction before running in production.

-- DELETE spv
-- FROM student_presence_validation spv
-- INNER JOIN student_presence sp ON sp.id = spv.student_presence_id
-- WHERE sp.notes_locked = 0;
