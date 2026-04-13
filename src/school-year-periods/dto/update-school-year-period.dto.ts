import { PartialType } from '@nestjs/mapped-types';
import { CreateSchoolYearPeriodDto } from './create-school-year-period.dto';

export class UpdateSchoolYearPeriodDto extends PartialType(CreateSchoolYearPeriodDto) {}
