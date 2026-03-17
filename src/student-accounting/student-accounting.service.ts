import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { ClassStudent } from '../class-student/entities/class-student.entity';
import { ClassEntity } from '../class/entities/class.entity';
import { LevelPricing } from '../level-pricing/entities/level-pricing.entity';
import { StudentPaymentDetail } from '../student_payment_details/entities/student_payment_detail.entity';
import { StudentPayment } from '../student-payment/entities/student-payment.entity';
import { StudentPaymentAllocationsService } from '../student_payment_allocations/student_payment_allocations.service';

@Injectable()
export class StudentAccountingService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(ClassStudent)
    private readonly classStudentRepo: Repository<ClassStudent>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
    @InjectRepository(LevelPricing)
    private readonly levelPricingRepo: Repository<LevelPricing>,
    @InjectRepository(StudentPaymentDetail)
    private readonly detailRepo: Repository<StudentPaymentDetail>,
    @InjectRepository(StudentPayment)
    private readonly paymentRepo: Repository<StudentPayment>,
    private readonly allocationsService: StudentPaymentAllocationsService,
  ) {}

  async syncStudentObligations(studentId: number, companyId: number) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, company_id: companyId, status: Not(-2) },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (student.status !== 1) {
      return {
        student_id: studentId,
        generated_count: 0,
        skipped_reason: 'Student is not active',
      };
    }

    const assignments = await this.classStudentRepo
      .createQueryBuilder('cs')
      .leftJoinAndSelect('cs.class', 'class')
      .leftJoinAndSelect('class.schoolYear', 'schoolYear')
      .where('cs.student_id = :studentId', { studentId })
      .andWhere('cs.company_id = :companyId', { companyId })
      .andWhere('cs.status <> :deletedStatus', { deletedStatus: -2 })
      .andWhere('class.status <> :deletedStatus', { deletedStatus: -2 })
      .orderBy('class.school_year_id', 'ASC')
      .addOrderBy('cs.id', 'ASC')
      .getMany();

    let generatedCount = 0;
    for (const assignment of assignments) {
      generatedCount += await this.generateFromAssignment(assignment, student, companyId);
    }

    if (generatedCount > 0) {
      await this.reallocateStudentPayments(studentId, companyId);
    }

    return {
      student_id: studentId,
      generated_count: generatedCount,
    };
  }

  async syncFromClassStudent(classStudentId: number, companyId: number) {
    const assignment = await this.classStudentRepo.findOne({
      where: { id: classStudentId, company_id: companyId, status: Not(-2) },
      relations: ['student', 'class', 'class.schoolYear'],
    });

    if (!assignment) {
      throw new NotFoundException('Class student assignment not found');
    }

    if (!assignment.student || assignment.student.status !== 1) {
      return {
        class_student_id: classStudentId,
        generated_count: 0,
        skipped_reason: 'Student is not active',
      };
    }

    if (!assignment.class || assignment.class.status === -2) {
      throw new BadRequestException('Class is not available for obligation generation');
    }

    const generatedCount = await this.generateFromAssignment(
      assignment,
      assignment.student,
      companyId,
    );

    if (generatedCount > 0) {
      await this.reallocateStudentPayments(assignment.student_id, companyId);
    }

    return {
      class_student_id: classStudentId,
      generated_count: generatedCount,
    };
  }

  private async generateFromAssignment(
    assignment: ClassStudent,
    student: Student,
    companyId: number,
  ): Promise<number> {
    if (!assignment.class) {
      const classEntity = await this.classRepo.findOne({
        where: { id: assignment.class_id, company_id: companyId, status: Not(-2) },
        relations: ['schoolYear'],
      });
      if (!classEntity) {
        return 0;
      }
      assignment.class = classEntity;
    }

    const levelPricings = await this.levelPricingRepo.find({
      where: {
        company_id: companyId,
        level_id: assignment.class.level_id,
        school_year_id: assignment.class.school_year_id,
        status: Not(-2),
      },
      relations: ['rubrique'],
      order: { id: 'ASC' },
    });

    let generatedCount = 0;

    for (const pricing of levelPricings) {
      const effectiveTitle = pricing.title ?? pricing.rubrique?.title ?? null;
      const effectiveAmount = Number(pricing.amount ?? pricing.rubrique?.amount ?? 0);
      const effectiveVatRate = pricing.vat_rate ?? pricing.rubrique?.vat_rate ?? 0;
      const effectiveOccurrences = Math.max(
        pricing.occurrences ?? pricing.rubrique?.occurrences ?? 1,
        1,
      );
      const effectiveEveryMonth = pricing.every_month ?? pricing.rubrique?.every_month ?? 0;

      if (!effectiveTitle || effectiveAmount <= 0) {
        continue;
      }

      for (let occurrenceIndex = 1; occurrenceIndex <= effectiveOccurrences; occurrenceIndex += 1) {
        const lineKey = this.buildLineKey(student.id, pricing.id, occurrenceIndex);
        const existingDetail = await this.detailRepo.findOne({
          where: { line_key: lineKey, company_id: companyId },
        });

        if (existingDetail) {
          continue;
        }

        const dueDate = this.computeDueDate(
          assignment.class.schoolYear?.start_date ?? new Date(),
          effectiveEveryMonth === 1 ? occurrenceIndex - 1 : 0,
        );

        const detail = this.detailRepo.create({
          line_key: lineKey,
          student_id: student.id,
          school_year_id: assignment.class.school_year_id,
          level_id: assignment.class.level_id,
          class_id: assignment.class.id,
          level_pricing_id: pricing.id,
          rubrique_id: pricing.rubrique_id ?? null,
          source_type: 'level_pricing',
          source_reference_id: pricing.id,
          title: effectiveTitle,
          amount_ht: effectiveAmount,
          vat_rate: effectiveVatRate,
          amount_ttc: this.computeAmountTtc(effectiveAmount, effectiveVatRate),
          occurrence_index: occurrenceIndex,
          occurrences: effectiveOccurrences,
          every_month: effectiveEveryMonth,
          due_date: dueDate,
          period_label: this.buildPeriodLabel(dueDate, occurrenceIndex, effectiveOccurrences, effectiveEveryMonth),
          company_id: companyId,
          status: 1,
        });

        await this.detailRepo.save(detail);
        generatedCount += 1;
      }
    }

    return generatedCount;
  }

  private async reallocateStudentPayments(studentId: number, companyId: number): Promise<void> {
    const payments = await this.paymentRepo.find({
      where: { student_id: studentId, company_id: companyId, status: Not(-2) },
      order: {
        date: 'ASC',
        created_at: 'ASC',
      },
    });

    for (const payment of payments) {
      await this.allocationsService.reallocatePayment(payment.id, companyId);
    }
  }

  private buildLineKey(studentId: number, pricingId: number, occurrenceIndex: number): string {
    return `student:${studentId}:pricing:${pricingId}:occurrence:${occurrenceIndex}`;
  }

  private computeAmountTtc(amountHt: number, vatRate: number): number {
    return Number((amountHt * (1 + vatRate / 100)).toFixed(2));
  }

  private computeDueDate(baseDate: Date | string, monthOffset: number): string {
    const date = new Date(baseDate);
    date.setHours(0, 0, 0, 0);
    date.setMonth(date.getMonth() + monthOffset);
    return date.toISOString().slice(0, 10);
  }

  private buildPeriodLabel(
    dueDate: string,
    occurrenceIndex: number,
    occurrences: number,
    everyMonth: number,
  ): string | null {
    if (everyMonth === 1) {
      return `${dueDate.slice(0, 7)} (${occurrenceIndex}/${occurrences})`;
    }

    if (occurrences > 1) {
      return `Occurrence ${occurrenceIndex}/${occurrences}`;
    }

    return null;
  }
}
