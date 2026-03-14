import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassService } from './class.service';
import { ClassController } from './class.controller';
import { ClassEntity } from './entities/class.entity';
import { SchoolYear } from '../school-years/entities/school-year.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClassEntity, SchoolYear])],
  controllers: [ClassController],
  providers: [ClassService],
  exports: [ClassService],
})
export class ClassModule {}
