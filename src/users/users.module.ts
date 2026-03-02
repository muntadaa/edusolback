import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Company } from '../company/entities/company.entity';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';
import { MailModule } from '../mail/mail.module';
import { UserRolesModule } from '../user-roles/user-roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Company, UserRole, Role]),
    MailModule,
    ConfigModule,
    forwardRef(() => UserRolesModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
