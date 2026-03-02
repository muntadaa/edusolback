import { PartialType } from '@nestjs/swagger';
import { CreateStudentPresenceDto } from './create-studentpresence.dto';

export class UpdateStudentPresenceDto extends PartialType(CreateStudentPresenceDto) {}
