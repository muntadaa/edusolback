import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentPaymentService } from './student-payment.service';
import { StudentPaymentController } from './student-payment.controller';
import { StudentPayment } from './entities/student-payment.entity';
import { Student } from '../students/entities/student.entity';
import { SchoolYear } from '../school-years/entities/school-year.entity';
import { Level } from '../level/entities/level.entity';
import { LevelPricing } from '../level-pricing/entities/level-pricing.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudentPayment, Student, SchoolYear, Level, LevelPricing])],
  controllers: [StudentPaymentController],
  providers: [StudentPaymentService],
  exports: [StudentPaymentService],
})
export class StudentPaymentModule {}
