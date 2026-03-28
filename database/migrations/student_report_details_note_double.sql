-- Allow decimal grades on student_report_details.note (e.g. 11.67).
-- Run once if not using TypeORM synchronize.

ALTER TABLE student_report_details
  MODIFY COLUMN note DOUBLE NULL;
