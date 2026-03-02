import { ApiProperty } from '@nestjs/swagger';

export class ModuleCourseListItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false, nullable: true })
  description?: string | null;

  @ApiProperty({ required: false, nullable: true })
  volume?: number | null;

  @ApiProperty({ required: false, nullable: true })
  coefficient?: number | null;

  @ApiProperty()
  status: number;

  @ApiProperty({ required: false, nullable: true })
  tri?: number | null;
}

