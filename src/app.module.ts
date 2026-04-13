import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/config/winston.config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { UsersModule } from './users/users.module';
import { PagesModule } from './pages/pages.module';
import { RolesModule } from './roles/roles.module';
import { UserRolesModule } from './user-roles/user-roles.module';
import { ModuleModule } from './module/module.module';
import { CourseModule } from './course/course.module';
import { SchoolYearsModule } from './school-years/school-years.module';
import { SchoolYearPeriodsModule } from './school-year-periods/school-year-periods.module';
import { ClassRoomsModule } from './class-rooms/class-rooms.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { AdministratorsModule } from './administrators/administrators.module';
import { StudentDiplomeModule } from './student-diplome/student-diplome.module';
import { StudentContactModule } from './student-contact/student-contact.module';
import { StudentlinktypeModule } from './studentlinktype/studentlinktype.module';
import { ClassroomTypesModule } from './classroom-types/classroom-types.module';
import { ProgramModule } from './programs/programs.module';
import { LevelModule } from './level/level.module';
import { SpecializationsModule } from './specializations/specializations.module';
import { ClassModule } from './class/class.module';
import { ClassStudentModule } from './class-student/class-student.module';
import { StudentsPlanningsModule } from './students-plannings/students-plannings.module';
import { ModuleCourseModule } from './module-course/module-course.module';
import { PlanningSessionTypesModule } from './planning-session-types/planning-session-types.module';
import { StudentPresenceModule } from './studentpresence/studentpresence.module';
import { StudentReportModule } from './student-report/student-report.module';
import { StudentReportDetailModule } from './student-report-detail/student-report-detail.module';
import { LevelPricingModule } from './level-pricing/level-pricing.module';
import { StudentPaymentModule } from './student-payment/student-payment.module';
import { AttestationModule } from './attestation/attestation.module';
import { StudentattestationModule } from './studentattestation/studentattestation.module';
import { ClassCourseModule } from './class-course/class-course.module';
import { TeacherCourseModule } from './teacher-course/teacher-course.module';
import { EventsModule } from './events/events.module';
import { PreinscriptionsModule } from './preinscriptions/preinscriptions.module';
import { RubriqueModule } from './rubrique/rubrique.module';
import { StudentPaymentDetailsModule } from './student_payment_details/student_payment_details.module';
import { StudentPaymentAllocationsModule } from './student_payment_allocations/student_payment_allocations.module';
import { StudentAccountingModule } from './student-accounting/student-accounting.module';
import { PreInscriptionDiplomaModule } from './pre-inscription-diploma/pre-inscription-diploma.module';
import { StudentPresenceValidationModule } from './student_presence_validation/student_presence_validation.module';
import { RequiredDocsModule } from './required-docs/required-docs.module';
import { AuditorModule } from './auditor/auditor.module';
import { PdfModule } from './pdf/pdf.module';

@Module({
  imports: [
    WinstonModule.forRoot(winstonConfig),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'edusol_25',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      // Merge entities from every TypeOrmModule.forFeature() (fixes missing Page metadata on Windows/dist).
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    AuthModule,
    CompanyModule,
    UsersModule,
    PagesModule,
    RolesModule,
    UserRolesModule,
    ModuleModule,
    CourseModule,
    SchoolYearsModule,
    SchoolYearPeriodsModule,
    ClassRoomsModule,
    StudentsModule,
    TeachersModule,
    AdministratorsModule,
    StudentDiplomeModule,
    StudentContactModule,
    StudentlinktypeModule,
    ClassroomTypesModule,
    ProgramModule,
    LevelModule,
    SpecializationsModule,
    ClassModule,
    ClassStudentModule,
    StudentsPlanningsModule,
    ModuleCourseModule,
    PlanningSessionTypesModule,
    StudentPresenceModule,
    StudentReportModule,
    StudentReportDetailModule,
    LevelPricingModule,
    StudentPaymentModule,
    AttestationModule,
    StudentattestationModule,
    ClassCourseModule,
    TeacherCourseModule,
    EventsModule,
    PreinscriptionsModule,
    RubriqueModule,
    StudentPaymentDetailsModule,
    StudentPaymentAllocationsModule,
    StudentAccountingModule,
    PreInscriptionDiplomaModule,
    StudentPresenceValidationModule,
    RequiredDocsModule,
    AuditorModule,
    PdfModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
