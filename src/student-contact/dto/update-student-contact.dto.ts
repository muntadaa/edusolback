import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentContactDto } from './create-student-contact.dto';

export class UpdateStudentContactDto extends PartialType(CreateStudentContactDto) {}

