import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class RouteItemDto {
  @IsString({ message: 'Route must be a string' })
  route: string;

  @IsString({ message: 'Title must be a string' })
  title: string;
}

export class CreatePagesFromRoutesDto {
  @ApiProperty({ 
    description: 'Array of route objects to create pages from', 
    example: [
      { route: '/administrators', title: 'Administrators' },
      { route: '/students', title: 'Students' }
    ],
    type: [RouteItemDto]
  })
  @IsArray({ message: 'Routes must be an array' })
  @ArrayMinSize(1, { message: 'At least one route is required' })
  @ValidateNested({ each: true })
  @Type(() => RouteItemDto)
  routes: RouteItemDto[];

  @ApiPropertyOptional({ 
    description: 'If true, skip routes that already exist. If false, return error for duplicates.', 
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean({ message: 'skipExisting must be a boolean' })
  skipExisting?: boolean = true;
}

