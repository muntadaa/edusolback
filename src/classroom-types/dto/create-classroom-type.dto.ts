import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClassroomTypeDto {
  @ApiProperty({ description: 'Classroom type label', example: 'Lecture Hall' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Status indicator (-2 to 2)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-2)
  @Max(2)
  status?: number;

  @ApiPropertyOptional({ description: 'Owning company identifier (automatically set from authenticated user)', example: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id?: number;
}

