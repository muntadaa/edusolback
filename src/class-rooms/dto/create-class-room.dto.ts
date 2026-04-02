import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClassRoomDto {
  @ApiProperty({ 
    description: 'Unique code used to identify the classroom. Must be unique across all classrooms.', 
    example: 'CR-101' 
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Display title of the classroom', example: 'Physics Lab' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Classroom type identifier', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  classroom_type_id?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of students allowed; omit if unknown',
    example: 30,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  capacity?: number;

  @ApiPropertyOptional({ description: 'Owning company identifier (automatically set from authenticated user)', example: 4 })
  @IsOptional()
  @IsNumber()
  company_id?: number;

  @ApiPropertyOptional({ description: 'Status indicator (-2 to 2)', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(-2)
  @Max(2)
  status?: number;
}
