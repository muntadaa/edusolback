import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentLinkTypeDto } from './create-studentlinktype.dto';

export class UpdateStudentLinkTypeDto extends PartialType(CreateStudentLinkTypeDto) {}

