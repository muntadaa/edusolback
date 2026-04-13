-- School matricule (auto) and state matricule (manual). Unique school matricule per company when set.
ALTER TABLE `students` ADD COLUMN `matricule_ecole` VARCHAR(32) NULL;
ALTER TABLE `students` ADD COLUMN `matricule_etat` VARCHAR(64) NULL;
CREATE INDEX `IDX_students_company_id` ON `students` (`company_id`);
CREATE UNIQUE INDEX `UQ_student_company_matricule_ecole` ON `students` (`company_id`, `matricule_ecole`);
