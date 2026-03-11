import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsPlanningsService } from './students-plannings.service';
import { StudentsPlanningsController } from './students-plannings.controller';
import { StudentsPlanning } from './entities/students-planning.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { ClassEntity } from '../class/entities/class.entity';
import { ClassRoom } from '../class-rooms/entities/class-room.entity';
import { PlanningSessionType } from '../planning-session-types/entities/planning-session-type.entity';
import { SchoolYear } from '../school-years/entities/school-year.entity';
import { Course } from '../course/entities/course.entity';
import { ClassCourse } from '../class-course/entities/class-course.entity';
import { StudentPresence } from '../studentpresence/entities/studentpresence.entity';
import { Event } from '../events/entities/event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudentsPlanning, Teacher, Course, ClassEntity, ClassRoom, PlanningSessionType, SchoolYear, ClassCourse, StudentPresence, Event])],
  controllers: [StudentsPlanningsController],
  providers: [StudentsPlanningsService],
  exports: [StudentsPlanningsService],
})
export class StudentsPlanningsModule {}
