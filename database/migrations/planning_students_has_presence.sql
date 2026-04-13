-- Remove mistaken column if you ran the previous migration (feature flag).
-- Safe to run even if the column never existed (check your DB first).

-- ALTER TABLE planning_students DROP COLUMN has_presence;
