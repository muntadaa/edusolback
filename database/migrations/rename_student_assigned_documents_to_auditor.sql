-- Run once if you already had `student_assigned_documents` from a previous deploy.
-- Adjust constraint/index names if your DB used different names.

-- RENAME TABLE `student_assigned_documents` TO `auditor`;

-- After rename, optionally:
-- ALTER TABLE `auditor` DROP INDEX `UQ_student_assigned_doc_student_template`;
-- CREATE UNIQUE INDEX `UQ_auditor_student_template` ON `auditor` (`student_id`, `required_doc_id`);
