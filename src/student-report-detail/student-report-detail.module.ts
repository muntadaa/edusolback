import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentReportDetailService } from './student-report-detail.service';
import { StudentReportDetailController } from './student-report-detail.controller';
import { StudentReportDetail } from './entities/student-report-detail.entity';
import { StudentReport } from '../student-report/entities/student-report.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Course } from '../course/entities/course.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudentReportDetail, StudentReport, Teacher, Course])],
  controllers: [StudentReportDetailController],
  providers: [StudentReportDetailService],
  exports: [StudentReportDetailService],
})
export class StudentReportDetailModule {}
