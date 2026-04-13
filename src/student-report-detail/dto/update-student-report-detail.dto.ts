import { PartialType } from '@nestjs/swagger';
import { CreateStudentReportDetailDto } from './create-student-report-detail.dto';

export class UpdateStudentReportDetailDto extends PartialType(CreateStudentReportDetailDto) {}
