import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolYearPeriod } from './entities/school-year-period.entity';
import { SchoolYear } from 'src/school-years/entities/school-year.entity';
import { SchoolYearPeriodsService } from './school-year-periods.service';
import { SchoolYearPeriodsController } from './school-year-periods.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SchoolYearPeriod, SchoolYear])],
  controllers: [SchoolYearPeriodsController],
  providers: [SchoolYearPeriodsService],
  exports: [SchoolYearPeriodsService],
})
export class SchoolYearPeriodsModule {}
