import { PartialType } from '@nestjs/swagger';
import { CreateClassStudentDto } from './create-class-student.dto';

export class UpdateClassStudentDto extends PartialType(CreateClassStudentDto) {}
