import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { Student } from './entities/student.entity';
import { User } from '../users/entities/user.entity';
import { StudentDiplome } from '../student-diplome/entities/student-diplome.entity';
import { StudentContact } from '../student-contact/entities/student-contact.entity';
import { StudentLinkType } from '../studentlinktype/entities/studentlinktype.entity';
import { StudentReport } from '../student-report/entities/student-report.entity';
import { ClassStudent } from '../class-student/entities/class-student.entity';
import { ClassEntity } from '../class/entities/class.entity';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { UserRolesModule } from '../user-roles/user-roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, User, StudentDiplome, StudentContact, StudentLinkType, StudentReport, ClassStudent, ClassEntity]),
    UsersModule,
    RolesModule,
    UserRolesModule,
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
