import { PartialType } from '@nestjs/swagger';
import { CreateStudentReportDto } from './create-student-report.dto';

export class UpdateStudentReportDto extends PartialType(CreateStudentReportDto) {}
