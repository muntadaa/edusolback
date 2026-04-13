import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentDiplomeService } from './student-diplome.service';
import { StudentDiplomeController } from './student-diplome.controller';
import { StudentDiplome } from './entities/student-diplome.entity';
import { Student } from '../students/entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudentDiplome, Student])],
  controllers: [StudentDiplomeController],
  providers: [StudentDiplomeService],
  exports: [StudentDiplomeService],
})
export class StudentDiplomeModule {}
