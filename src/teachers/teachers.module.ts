import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';
import { Teacher } from './entities/teacher.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { UserRolesModule } from '../user-roles/user-roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Teacher, User]),
    UsersModule,
    RolesModule,
    UserRolesModule,
  ],
  controllers: [TeachersController],
  providers: [TeachersService],
  exports: [TeachersService],
})
export class TeachersModule {}
