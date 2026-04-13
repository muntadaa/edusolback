import { Module } from '@nestjs/common';
import { SchoolYearsService } from './school-years.service';
import { SchoolYearsController } from './school-years.controller';
import { SchoolYear } from './entities/school-year.entity';
import { Company } from 'src/company/entities/company.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [
    TypeOrmModule.forFeature([SchoolYear, Company]),
  ],
  controllers: [SchoolYearsController],
  providers: [SchoolYearsService],
})
export class SchoolYearsModule {}
