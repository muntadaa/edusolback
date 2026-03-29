import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PagesModule } from '../pages/pages.module';
import { StudentPresenceValidationService } from './student_presence_validation.service';
import { StudentPresenceValidationController } from './student_presence_validation.controller';
import { StudentPresenceValidation } from './entities/student_presence_validation.entity';
import { StudentPresence } from '../studentpresence/entities/studentpresence.entity';
import { StudentsPlanning } from '../students-plannings/entities/students-planning.entity';
import { ClassCourse } from '../class-course/entities/class-course.entity';
import { ClassEntity } from '../class/entities/class.entity';

@Module({
  imports: [
    AuthModule,
    PagesModule,
    TypeOrmModule.forFeature([
      StudentPresenceValidation,
      StudentPresence,
      StudentsPlanning,
      ClassCourse,
      ClassEntity,
    ]),
  ],
  controllers: [StudentPresenceValidationController],
  providers: [StudentPresenceValidationService],
  exports: [StudentPresenceValidationService],
})
export class StudentPresenceValidationModule {}
