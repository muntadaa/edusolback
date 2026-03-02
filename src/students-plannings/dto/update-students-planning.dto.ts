import { PartialType } from '@nestjs/swagger';
import { CreateStudentsPlanningDto } from './create-students-planning.dto';

export class UpdateStudentsPlanningDto extends PartialType(CreateStudentsPlanningDto) {}
