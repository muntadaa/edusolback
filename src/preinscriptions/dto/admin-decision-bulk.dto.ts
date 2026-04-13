import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * Same decision fields as {@link AdminDecisionDto}, applied to every id in `ids`
 * (shared final_level_id / final_school_year_id when approving).
 */
export class AdminDecisionBulkDto {
  @ApiProperty({ type: [Number], example: [1, 2, 3] })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  ids: number[];

  @IsBoolean()
  approved: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  final_program_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  final_specialization_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  final_level_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  final_school_year_id?: number;

  @IsOptional()
  @IsString()
  admin_comment?: string;
}
