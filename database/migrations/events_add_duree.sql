-- Add durée (inclusive calendar days, min 1). Run if not using TypeORM synchronize.
ALTER TABLE `events` ADD COLUMN `duree` INT NOT NULL DEFAULT 1;
UPDATE `events` SET `duree` = GREATEST(1, DATEDIFF(`end_date`, `start_date`) + 1);
