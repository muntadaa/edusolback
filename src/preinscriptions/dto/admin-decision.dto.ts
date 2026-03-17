import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class AdminDecisionDto {
  @IsBoolean()
  approved: boolean;

  @IsOptional()
  @IsNumber()
  final_program_id?: number;

  @IsOptional()
  @IsNumber()
  final_specialization_id?: number;

  @IsOptional()
  @IsNumber()
  final_level_id?: number;

  @IsOptional()
  @IsString()
  admin_comment?: string;
}

