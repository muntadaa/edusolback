import { PartialType } from '@nestjs/swagger';
import { CreateStudentAttestationDto } from './create-studentattestation.dto';

export class UpdateStudentAttestationDto extends PartialType(CreateStudentAttestationDto) {}
