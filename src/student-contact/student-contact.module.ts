import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentContactService } from './student-contact.service';
import { StudentContactController } from './student-contact.controller';
import { StudentContact } from './entities/student-contact.entity';
import { Student } from '../students/entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudentContact, Student])],
  controllers: [StudentContactController],
  providers: [StudentContactService],
  exports: [StudentContactService],
})
export class StudentContactModule {}
