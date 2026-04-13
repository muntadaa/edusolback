import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentReportService } from './student-report.service';
import { StudentReportController } from './student-report.controller';
import { StudentReport } from './entities/student-report.entity';
import { Student } from '../students/entities/student.entity';
import { SchoolYearPeriod } from '../school-year-periods/entities/school-year-period.entity';
import { SchoolYear } from '../school-years/entities/school-year.entity';
import { StudentsPlanning } from '../students-plannings/entities/students-planning.entity';
import { StudentPresence } from '../studentpresence/entities/studentpresence.entity';
import { ClassStudent } from '../class-student/entities/class-student.entity';
import { StudentPresenceValidation } from '../student_presence_validation/entities/student_presence_validation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentReport,
      Student,
      SchoolYearPeriod,
      SchoolYear,
      StudentsPlanning,
      StudentPresence,
      StudentPresenceValidation,
      ClassStudent,
    ]),
  ],
  controllers: [StudentReportController],
  providers: [StudentReportService],
  exports: [StudentReportService],
})
export class StudentReportModule {}
