import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassStudentService } from './class-student.service';
import { ClassStudentController } from './class-student.controller';
import { ClassStudent } from './entities/class-student.entity';
import { ClassEntity } from '../class/entities/class.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClassStudent, ClassEntity])],
  controllers: [ClassStudentController],
  providers: [ClassStudentService],
  exports: [ClassStudentService],
})
export class ClassStudentModule {}
