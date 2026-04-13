import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStudentDiplomeDto {
  @ApiProperty({ description: 'Name of the diploma or qualification', example: 'Bachelor of Science' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Institution where the diploma was earned', example: 'State University' })
  @IsString()
  @IsNotEmpty()
  school: string;

  @ApiPropertyOptional({ description: 'Diploma specialization or mention', example: 'Computer Engineering' })
  @IsOptional()
  @IsString()
  diplome?: string;

  @ApiPropertyOptional({ description: 'Year of completion', example: 2022 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  annee?: number;

  @ApiPropertyOptional({ description: 'Country where the diploma was obtained', example: 'Canada' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'City where the diploma was obtained', example: 'Toronto' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Uploaded diploma image path (front)', example: '/uploads/student-diplomes/1700000000000_front.png' })
  @IsOptional()
  diplome_picture_1?: string;

  @ApiPropertyOptional({ description: 'Uploaded diploma image path (back)', example: '/uploads/student-diplomes/1700000000001_back.png' })
  @IsOptional()
  diplome_picture_2?: string;

  @ApiProperty({ description: 'Associated student identifier', example: 21 })
  @Type(() => Number)
  @IsNumber()
  student_id: number;

  @ApiPropertyOptional({ description: 'Status indicator (-2 to 2)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-2)
  @Max(2)
  status?: number;

  @ApiPropertyOptional({ description: 'Company identifier (automatically set from authenticated user)', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  company_id?: number;
}
