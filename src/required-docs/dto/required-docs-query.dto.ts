import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class RequiredDocsQueryDto {
  @ApiPropertyOptional({ description: 'Include rows for this program or program wildcard (NULL).' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  program_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  specialization_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  level_id?: number;

  @ApiPropertyOptional({ description: 'Case-insensitive partial match on title.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}
