import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePlanningSessionTypeDto {
  @ApiProperty({ description: 'Display title for the planning session type', example: 'Laboratory Session' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(150)
  title: string;

  @ApiProperty({ description: 'Type identifier', example: 'LAB' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  type: string;

  @ApiPropertyOptional({ description: 'Coefficient associated with the session type', example: 1.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  coefficient?: number;

  @ApiPropertyOptional({ description: 'Owning company identifier (automatically set from authenticated user)', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id?: number;

  @ApiPropertyOptional({ description: 'Status of the planning session type', enum: ['active', 'inactive'], example: 'active', default: 'active' })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive'], { message: 'status must be active or inactive' })
  status?: string;
}
