import { PartialType } from '@nestjs/swagger';
import { CreateClassCourseDto } from './create-class-course.dto';

export class UpdateClassCourseDto extends PartialType(CreateClassCourseDto) {}
