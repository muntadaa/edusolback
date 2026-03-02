import { PartialType } from '@nestjs/mapped-types';
import { CreateClassroomTypeDto } from './create-classroom-type.dto';

export class UpdateClassroomTypeDto extends PartialType(CreateClassroomTypeDto) {}

