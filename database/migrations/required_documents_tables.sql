-- Document definitions (master), requirement rules (config), student submissions (operational).
-- Run manually if not using TypeORM synchronize.

CREATE TABLE IF NOT EXISTS `document_definitions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `code` VARCHAR(64) NULL,
  `statut` INT NOT NULL DEFAULT 1,
  `company_id` INT NOT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `UQ_document_definitions_company_title` (`company_id`, `title`),
  CONSTRAINT `FK_document_definitions_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `document_requirement_rules` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `company_id` INT NOT NULL,
  `program_id` INT NOT NULL,
  `specialization_id` INT NOT NULL,
  `level_id` INT NOT NULL,
  `document_definition_id` INT NOT NULL,
  `is_required` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `UQ_doc_requirement_rule_slot` (`company_id`, `program_id`, `specialization_id`, `level_id`, `document_definition_id`),
  CONSTRAINT `FK_doc_req_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_doc_req_program` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_doc_req_spec` FOREIGN KEY (`specialization_id`) REFERENCES `specializations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_doc_req_level` FOREIGN KEY (`level_id`) REFERENCES `levels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_doc_req_def` FOREIGN KEY (`document_definition_id`) REFERENCES `document_definitions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `student_document_submissions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `company_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `document_definition_id` INT NOT NULL,
  `file_path` VARCHAR(512) NOT NULL,
  `status` ENUM('pending', 'validated', 'rejected') NOT NULL DEFAULT 'pending',
  `admin_comment` TEXT NULL,
  `reviewed_at` DATETIME NULL,
  `reviewed_by_user_id` INT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `UQ_student_doc_submission_slot` (`student_id`, `document_definition_id`),
  CONSTRAINT `FK_stu_doc_sub_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_stu_doc_sub_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_stu_doc_sub_def` FOREIGN KEY (`document_definition_id`) REFERENCES `document_definitions` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_stu_doc_sub_reviewer` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
