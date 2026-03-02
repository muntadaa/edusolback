import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClassDto {
  @ApiProperty({ description: 'Class title', example: 'Grade 6 - Section A' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Optional description', example: 'Advanced math focus group.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Related program identifier', example: 5 })
  @Type(() => Number)
  @IsNumber()
  program_id: number;

  @ApiProperty({ description: 'Specialization identifier', example: 3 })
  @Type(() => Number)
  @IsNumber()
  specialization_id: number;

  @ApiProperty({ description: 'Academic level identifier', example: 2 })
  @Type(() => Number)
  @IsNumber()
  level_id: number;

  @ApiProperty({ description: 'School year identifier (must be planned or ongoing, not completed)', example: 7 })
  @Type(() => Number)
  @IsNumber()
  school_year_id: number;

  @ApiPropertyOptional({ description: 'Owning company identifier (automatically set from authenticated user)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id?: number;

  @ApiPropertyOptional({ description: 'Status indicator (-2 to 2)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-2)
  @Max(2)
  status?: number;
}
