import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreinscriptionsService } from './preinscriptions.service';
import { PreinscriptionsController } from './preinscriptions.controller';
import { PreInscription } from './entities/preinscription.entity';
import { PreinscriptionMeeting } from './entities/preinscription-meeting.entity';
import { Company } from '../company/entities/company.entity';
import { StudentsModule } from '../students/students.module';
import { Level } from '../level/entities/level.entity';
import { PreInscriptionDiploma } from '../pre-inscription-diploma/entities/pre-inscription-diploma.entity';
import { Student } from '../students/entities/student.entity';
import { StudentDiplome } from '../student-diplome/entities/student-diplome.entity';
import { LevelPricing } from '../level-pricing/entities/level-pricing.entity';
import { SchoolYear } from '../school-years/entities/school-year.entity';
import { StudentPaymentDetail } from '../student_payment_details/entities/student_payment_detail.entity';
import { PreInscriptionConversionService } from './preinscription-conversion.service';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { RolePage } from '../pages/entities/role-page.entity';
import { Page } from '../pages/entities/page.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PreInscription,
      PreinscriptionMeeting,
      Company,
      Level,
      PreInscriptionDiploma,
      Student,
      StudentDiplome,
      LevelPricing,
      SchoolYear,
      StudentPaymentDetail,
      User,
      UserRole,
      RolePage,
      Page,
    ]),
    StudentsModule,
    MailModule,
  ],
  controllers: [PreinscriptionsController],
  providers: [PreinscriptionsService, PreInscriptionConversionService],
})
export class PreinscriptionsModule {}
