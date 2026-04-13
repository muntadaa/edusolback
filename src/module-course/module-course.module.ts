import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuleCourseService } from './module-course.service';
import { ModuleCourseController } from './module-course.controller';
import { ModuleCourse } from './entities/module-course.entity';
import { Module as ModuleEntity } from '../module/entities/module.entity';
import { Course } from '../course/entities/course.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ModuleCourse, ModuleEntity, Course])],
  controllers: [ModuleCourseController],
  providers: [ModuleCourseService],
  exports: [ModuleCourseService],
})
export class ModuleCourseModule {}

