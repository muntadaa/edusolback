import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentDiplomeDto } from './create-student-diplome.dto';

export class UpdateStudentDiplomeDto extends PartialType(CreateStudentDiplomeDto) {}
