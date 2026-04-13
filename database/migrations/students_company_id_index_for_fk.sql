-- Ensures FK on students.company_id does not rely only on UQ_student_company_matricule_ecole.
-- Run once if TypeORM synchronize errors: Cannot drop index 'UQ_student_company_matricule_ecole': needed in a foreign key constraint
CREATE INDEX `IDX_students_company_id` ON `students` (`company_id`);
