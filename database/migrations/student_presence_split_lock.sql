-- Independent presence vs notes row locks (MySQL).
-- Run once if synchronize is off. Safe to run if columns already exist (check first in your env).

ALTER TABLE student_presence
  ADD COLUMN presence_locked TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN notes_locked TINYINT(1) NOT NULL DEFAULT 0;

-- Legacy: old single `locked` meant the whole row was frozen; treat as both until planning resyncs.
UPDATE student_presence
SET presence_locked = 1, notes_locked = 1
WHERE locked = 1;

UPDATE student_presence
SET locked = (presence_locked = 1 AND notes_locked = 1);
