import { PartialType } from '@nestjs/swagger';
import { CreateModuleCourseDto } from './create-module-course.dto';

export class UpdateModuleCourseDto extends PartialType(CreateModuleCourseDto) {}

