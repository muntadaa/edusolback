import { IsArray, IsNumber, ArrayNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ModuleAssignmentDto {
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

export class CourseModulesResponseDto {
  assigned: any[];
  unassigned: any[];
}
