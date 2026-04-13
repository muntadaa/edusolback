import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { Course as CourseEntity } from './entities/course.entity';
import { Module as ModuleEntity } from '../module/entities/module.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CourseEntity, ModuleEntity])],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService],
})
export class CourseModule {}
