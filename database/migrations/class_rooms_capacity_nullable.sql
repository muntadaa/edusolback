-- Optional: run if you do not use TypeORM synchronize — makes capacity optional in DB.
ALTER TABLE `class_rooms` MODIFY COLUMN `capacity` INT NULL;
