import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';
import { Teacher } from './entities/teacher.entity';
import { User } from '../users/entities/user.entity';
import { Student } from '../students/entities/student.entity';
import { ClassStudent } from '../class-student/entities/class-student.entity';
import { StudentsPlanning } from '../students-plannings/entities/students-planning.entity';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { UserRolesModule } from '../user-roles/user-roles.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Teacher, User, Student, ClassStudent, StudentsPlanning]),
    UsersModule,
    RolesModule,
    UserRolesModule,
    MailModule,
  ],
  controllers: [TeachersController],
  providers: [TeachersService],
  exports: [TeachersService],
})
export class TeachersModule {}
