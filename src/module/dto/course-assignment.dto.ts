import { IsArray, IsNumber, ArrayNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CourseAssignmentDto {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayNotEmpty()
  add?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayNotEmpty()
  remove?: number[];
}

export class ModuleCoursesResponseDto {
  assigned: any[];
  unassigned: any[];
}
