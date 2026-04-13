import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherCourseService } from './teacher-course.service';
import { TeacherCourseController } from './teacher-course.controller';
import { TeacherCourse } from './entities/teacher-course.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Course } from '../course/entities/course.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TeacherCourse, Teacher, Course])],
  controllers: [TeacherCourseController],
  providers: [TeacherCourseService],
  exports: [TeacherCourseService],
})
export class TeacherCourseModule {}
