import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { StudentPaymentDetail } from './entities/student_payment_detail.entity';
import { StudentPaymentAllocation } from '../student_payment_allocations/entities/student_payment_allocation.entity';
import { Student } from '../students/entities/student.entity';
import { MailService } from '../mail/mail.service';
import { MailTemplateService } from '../mail/mail-template.service';
import { StudentPaymentReminderDto } from './dto/student-payment-reminder.dto';
import { StudentPaymentDetailQueryDto } from './dto/student-payment-detail-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';

@Injectable()
export class StudentPaymentDetailsService {
  constructor(
    @InjectRepository(StudentPaymentDetail)
    private readonly repo: Repository<StudentPaymentDetail>,
    @InjectRepository(StudentPaymentAllocation)
    private readonly allocationRepo: Repository<StudentPaymentAllocation>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly mailService: MailService,
    private readonly mailTemplateService: MailTemplateService,
  ) {}

  async findAll(
    query: StudentPaymentDetailQueryDto,
    companyId: number,
  ): Promise<PaginatedResponseDto<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.repo
      .createQueryBuilder('detail')
      .leftJoinAndSelect('detail.student', 'student')
      .leftJoinAndSelect('detail.schoolYear', 'schoolYear')
      .leftJoinAndSelect('detail.level', 'level')
      .leftJoinAndSelect('detail.class', 'class')
      .leftJoinAndSelect('detail.levelPricing', 'levelPricing')
      .leftJoinAndSelect('detail.rubrique', 'rubrique')
      .where('detail.company_id = :companyId', { companyId })
      .andWhere('detail.status <> :deletedStatus', { deletedStatus: -2 })
      .orderBy('detail.due_date', 'ASC')
      .addOrderBy('detail.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.status !== undefined) {
      qb.andWhere('detail.status = :status', { status: query.status });
    }
    if (query.student_id) {
      qb.andWhere('detail.student_id = :studentId', { studentId: query.student_id });
    }
    if (query.school_year_id) {
      qb.andWhere('detail.school_year_id = :schoolYearId', {
        schoolYearId: query.school_year_id,
      });
    }
    if (query.class_id) {
      qb.andWhere('detail.class_id = :classId', { classId: query.class_id });
    }
    if (query.level_id) {
      qb.andWhere('detail.level_id = :levelId', { levelId: query.level_id });
    }
    if (query.rubrique_id) {
      qb.andWhere('detail.rubrique_id = :rubriqueId', { rubriqueId: query.rubrique_id });
    }
    if (query.level_pricing_id) {
      qb.andWhere('detail.level_pricing_id = :pricingId', {
        pricingId: query.level_pricing_id,
      });
    }
    if (query.search) {
      qb.andWhere(
        '(detail.title LIKE :search OR student.first_name LIKE :search OR student.last_name LIKE :search OR rubrique.title LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    const decorated = await this.attachBalances(data, companyId);
    return PaginationService.createResponse(decorated, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<any> {
    const detail = await this.repo.findOne({
      where: { id, company_id: companyId, status: Not(-2) },
      relations: ['student', 'schoolYear', 'level', 'class', 'levelPricing', 'rubrique'],
    });

    if (!detail) {
      throw new NotFoundException('Student payment detail not found');
    }

    const [decorated] = await this.attachBalances([detail], companyId);
    return decorated;
  }

  async getSummary(query: StudentPaymentDetailQueryDto, companyId: number) {
    const detailQb = this.repo
      .createQueryBuilder('detail')
      .select('COUNT(detail.id)', 'totalLines')
      .addSelect('COALESCE(SUM(detail.amount_ttc), 0)', 'totalDue')
      .where('detail.company_id = :companyId', { companyId })
      .andWhere('detail.status <> :deletedStatus', { deletedStatus: -2 });

    const allocationQb = this.allocationRepo
      .createQueryBuilder('allocation')
      .leftJoin('allocation.studentPaymentDetail', 'detail')
      .select('COALESCE(SUM(allocation.allocated_amount), 0)', 'totalAllocated')
      .where('allocation.company_id = :companyId', { companyId })
      .andWhere('allocation.status <> :deletedStatus', { deletedStatus: -2 })
      .andWhere('detail.status <> :deletedStatus', { deletedStatus: -2 });

    this.applySharedFilters(detailQb, query);
    this.applySharedFilters(allocationQb, query, 'detail');

    const totals = await detailQb.getRawOne();
    const allocationTotals = await allocationQb.getRawOne();
    const totalDue = Number(totals?.totalDue ?? 0);
    const totalAllocated = Number(allocationTotals?.totalAllocated ?? 0);

    return {
      total_lines: Number(totals?.totalLines ?? 0),
      total_due: totalDue,
      total_allocated: totalAllocated,
      total_remaining: Number((totalDue - totalAllocated).toFixed(2)),
    };
  }

  /**
   * Returns per-student aggregates (total_due, total_allocated, total_remaining) for students
   * that still have remaining > 0, using the same filters as the ledger list.
   */
  async getDebtors(
    query: StudentPaymentDetailQueryDto,
    companyId: number,
  ): Promise<PaginatedResponseDto<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    // Aggregate due per student
    const detailQb = this.repo
      .createQueryBuilder('detail')
      .innerJoin('detail.student', 'student')
      .select('detail.student_id', 'student_id')
      .addSelect('student.first_name', 'first_name')
      .addSelect('student.last_name', 'last_name')
      .addSelect('student.email', 'email')
      .addSelect('COALESCE(SUM(detail.amount_ttc), 0)', 'totalDue')
      .where('detail.company_id = :companyId', { companyId })
      .andWhere('detail.status <> :deletedStatus', { deletedStatus: -2 });

    this.applySharedFilters(detailQb, query, 'detail');

    detailQb.groupBy('detail.student_id')
      .addGroupBy('student.first_name')
      .addGroupBy('student.last_name')
      .addGroupBy('student.email');

    // Aggregate allocated per student
    const allocationQb = this.allocationRepo
      .createQueryBuilder('allocation')
      .leftJoin('allocation.studentPaymentDetail', 'detail')
      .select('detail.student_id', 'student_id')
      .addSelect('COALESCE(SUM(allocation.allocated_amount), 0)', 'totalAllocated')
      .where('allocation.company_id = :companyId', { companyId })
      .andWhere('allocation.status <> :deletedStatus', { deletedStatus: -2 })
      .andWhere('detail.status <> :deletedStatus', { deletedStatus: -2 });

    this.applySharedFilters(allocationQb, query, 'detail');

    allocationQb.groupBy('detail.student_id');

    const dueRows = await detailQb.getRawMany<{
      student_id: number;
      first_name: string;
      last_name: string;
      email: string;
      totalDue: string;
    }>();
    const allocRows = await allocationQb.getRawMany<{
      student_id: number;
      totalAllocated: string;
    }>();

    const allocatedByStudentId = new Map<number, number>(
      allocRows.map((row) => [Number(row.student_id), Number(row.totalAllocated)]),
    );

    const all = dueRows
      .map((row) => {
        const total_due = Number(row.totalDue ?? 0);
        const total_allocated = allocatedByStudentId.get(Number(row.student_id)) ?? 0;
        const total_remaining = Number((total_due - total_allocated).toFixed(2));
        return {
          student_id: Number(row.student_id),
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email,
          total_due,
          total_allocated,
          total_remaining,
        };
      })
      .filter((row) => row.total_remaining > 0)
      .sort((a, b) => b.total_remaining - a.total_remaining);

    const total = all.length;
    const start = (page - 1) * limit;
    const data = all.slice(start, start + limit);

    return PaginationService.createResponse(data, page, limit, total);
  }

  /**
   * Sends payment reminder emails to a list of students, based on their remaining balances.
   */
  async sendPaymentReminders(
    dto: StudentPaymentReminderDto,
    companyId: number,
  ): Promise<{ sent: number[]; failed: { id: number; reason: string }[] }> {
    const { studentIds, school_year_id } = dto;

    const results = {
      sent: [] as number[],
      failed: [] as { id: number; reason: string }[],
    };

    for (const studentId of studentIds) {
      try {
        const student = await this.studentRepo.findOne({
          where: { id: studentId, company_id: companyId, status: Not(-2) },
          relations: ['company'],
        });
        if (!student) {
          results.failed.push({ id: studentId, reason: 'Student not found' });
          continue;
        }
        if (!student.email) {
          results.failed.push({ id: studentId, reason: 'Student has no email' });
          continue;
        }

        // Compute per-student totals using the same filters
        const perStudentQuery: StudentPaymentDetailQueryDto = {
          student_id: studentId,
          school_year_id,
        } as any;
        const summary = await this.getSummary(perStudentQuery, companyId);

        if (summary.total_remaining <= 0) {
          results.failed.push({ id: studentId, reason: 'No remaining balance' });
          continue;
        }

        const companyName = student.company?.name ?? 'Your School';

        const html = this.mailTemplateService.renderTemplate('payment-reminder', {
          companyName,
          studentName: `${student.first_name} ${student.last_name}`,
          totalDue: summary.total_due.toFixed(2),
          totalPaid: summary.total_allocated.toFixed(2),
          totalRemaining: summary.total_remaining.toFixed(2),
        });

        await this.mailService.sendMail(
          student.email,
          `Payment reminder - ${companyName}`,
          html,
        );
        results.sent.push(studentId);
      } catch (error: any) {
        results.failed.push({
          id: studentId,
          reason: error?.message ?? 'Unknown error',
        });
      }
    }

    return results;
  }

  private applySharedFilters(qb: any, query: StudentPaymentDetailQueryDto, alias = 'detail'): void {
    if (query.student_id) {
      qb.andWhere(`${alias}.student_id = :studentId`, { studentId: query.student_id });
    }
    if (query.school_year_id) {
      qb.andWhere(`${alias}.school_year_id = :schoolYearId`, {
        schoolYearId: query.school_year_id,
      });
    }
    if (query.class_id) {
      qb.andWhere(`${alias}.class_id = :classId`, { classId: query.class_id });
    }
    if (query.level_id) {
      qb.andWhere(`${alias}.level_id = :levelId`, { levelId: query.level_id });
    }
    if (query.rubrique_id) {
      qb.andWhere(`${alias}.rubrique_id = :rubriqueId`, { rubriqueId: query.rubrique_id });
    }
    if (query.level_pricing_id) {
      qb.andWhere(`${alias}.level_pricing_id = :pricingId`, {
        pricingId: query.level_pricing_id,
      });
    }
  }

  private async attachBalances(
    details: StudentPaymentDetail[],
    companyId: number,
  ): Promise<any[]> {
    if (details.length === 0) {
      return [];
    }

    const detailIds = details.map((detail) => detail.id);
    const allocationRows = await this.allocationRepo
      .createQueryBuilder('allocation')
      .select('allocation.student_payment_detail_id', 'detailId')
      .addSelect('COALESCE(SUM(allocation.allocated_amount), 0)', 'allocatedAmount')
      .where('allocation.company_id = :companyId', { companyId })
      .andWhere('allocation.status <> :deletedStatus', { deletedStatus: -2 })
      .andWhere('allocation.student_payment_detail_id IN (:...detailIds)', { detailIds })
      .groupBy('allocation.student_payment_detail_id')
      .getRawMany();

    const allocatedByDetailId = new Map<number, number>(
      allocationRows.map((row) => [Number(row.detailId), Number(row.allocatedAmount)]),
    );

    return details.map((detail) => {
      const allocatedAmount = allocatedByDetailId.get(detail.id) ?? 0;
      const totalAmount = Number(detail.amount_ttc);
      return {
        ...detail,
        allocated_amount: allocatedAmount,
        remaining_amount: Number((totalAmount - allocatedAmount).toFixed(2)),
      };
    });
  }
}
