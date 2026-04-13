import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateClassCourseDto } from './create-class-course.dto';

export class CreateClassCourseBatchDto {
  @ApiProperty({
    description: 'Array of class courses to create',
    type: [CreateClassCourseDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateClassCourseDto)
  items: CreateClassCourseDto[];
}

