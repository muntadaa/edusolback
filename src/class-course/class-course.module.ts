import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassCourseService } from './class-course.service';
import { ClassCourseController } from './class-course.controller';
import { ClassCourse } from './entities/class-course.entity';
import { Level } from '../level/entities/level.entity';
import { Module as ModuleEntity } from '../module/entities/module.entity';
import { Course } from '../course/entities/course.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClassCourse, Level, ModuleEntity, Course])],
  controllers: [ClassCourseController],
  providers: [ClassCourseService],
})
export class ClassCourseModule {}
