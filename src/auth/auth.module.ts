import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { PagesModule } from '../pages/pages.module';
import { CaptchaModule } from '../captcha/captcha.module';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Page } from '../pages/entities/page.entity';
import { RolePage } from '../pages/entities/role-page.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminOnlyGuard } from './guards/admin-only.guard';
import { RouteAccessGuard } from './guards/route-access.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    UsersModule,
    MailModule,
    PagesModule,
    CaptchaModule,
    PassportModule,
    TypeOrmModule.forFeature([Student, Teacher, Page, RolePage]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('SECRET') ,
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, AdminOnlyGuard, RouteAccessGuard],
  exports: [AuthService, JwtAuthGuard, AdminOnlyGuard, RouteAccessGuard],
})
export class AuthModule {}