import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassStudentService } from './class-student.service';
import { ClassStudentController } from './class-student.controller';
import { ClassStudent } from './entities/class-student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClassStudent])],
  controllers: [ClassStudentController],
  providers: [ClassStudentService],
  exports: [ClassStudentService],
})
export class ClassStudentModule {}
