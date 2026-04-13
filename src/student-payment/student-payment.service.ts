import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateStudentPaymentDto } from './dto/create-student-payment.dto';
import { UpdateStudentPaymentDto } from './dto/update-student-payment.dto';
import { StudentPayment } from './entities/student-payment.entity';
import { StudentPaymentQueryDto } from './dto/student-payment-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { Student } from '../students/entities/student.entity';
import { SchoolYear } from '../school-years/entities/school-year.entity';
import { StudentPaymentAllocation } from '../student_payment_allocations/entities/student_payment_allocation.entity';
import { StudentPaymentDetail } from '../student_payment_details/entities/student_payment_detail.entity';
import { StudentPaymentAllocationsService } from '../student_payment_allocations/student_payment_allocations.service';

@Injectable()
export class StudentPaymentService {
  constructor(
    @InjectRepository(StudentPayment)
    private readonly repo: Repository<StudentPayment>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(SchoolYear)
    private readonly schoolYearRepo: Repository<SchoolYear>,
    @InjectRepository(StudentPaymentAllocation)
    private readonly allocationRepo: Repository<StudentPaymentAllocation>,
    @InjectRepository(StudentPaymentDetail)
    private readonly detailRepo: Repository<StudentPaymentDetail>,
    private readonly allocationsService: StudentPaymentAllocationsService,
  ) {}

  async create(dto: CreateStudentPaymentDto, companyId: number): Promise<any> {
    await this.validateReferences(dto, companyId);
    this.validateReceiptAmount(dto.amount);
    await this.validateAmountNotExceedingTotalDue(
      dto.student_id,
      dto.school_year_id,
      dto.amount,
      companyId,
    );

    const entity = this.repo.create({
      ...dto,
      amount: dto.amount,
      company_id: companyId,
      status: dto.status ?? 1,
    });

    const saved = await this.repo.save(entity);
    await this.allocationsService.reallocatePayment(saved.id, companyId);
    return this.findOne(saved.id, companyId);
  }

  async findAll(query: StudentPaymentQueryDto, companyId: number): Promise<PaginatedResponseDto<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.repo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.student', 'student')
      .leftJoinAndSelect('payment.schoolYear', 'schoolYear')
      .leftJoinAndSelect('payment.company', 'company')
      .where('payment.status <> :deletedStatus', { deletedStatus: -2 })
      .andWhere('payment.company_id = :companyId', { companyId })
      .orderBy('payment.date', 'DESC')
      .addOrderBy('payment.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.status !== undefined) {
      qb.andWhere('payment.status = :status', { status: query.status });
    }
    if (query.student_id) {
      qb.andWhere('payment.student_id = :studentId', { studentId: query.student_id });
    }
    if (query.school_year_id) {
      qb.andWhere('payment.school_year_id = :schoolYearId', {
        schoolYearId: query.school_year_id,
      });
    }
    if (query.date) {
      qb.andWhere('payment.date = :date', { date: query.date });
    }
    if (query.mode) {
      qb.andWhere('payment.mode = :mode', { mode: query.mode });
    }
    if (query.search) {
      const search = `%${query.search}%`;
      qb.andWhere(
        '(payment.reference LIKE :search OR payment.mode LIKE :search OR student.first_name LIKE :search OR student.last_name LIKE :search)',
        { search },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    const decorated = await this.attachAllocationSummary(data, companyId);
    return PaginationService.createResponse(decorated, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<any> {
    const payment = await this.repo.findOne({
      where: { id, company_id: companyId, status: Not(-2) },
      relations: ['student', 'schoolYear', 'company'],
    });
    if (!payment) {
      throw new NotFoundException('Student payment not found');
    }

    const [decorated] = await this.attachAllocationSummary([payment], companyId);
    return decorated;
  }

  async update(id: number, dto: UpdateStudentPaymentDto, companyId: number): Promise<any> {
    const existing = await this.repo.findOne({
      where: { id, company_id: companyId, status: Not(-2) },
      relations: ['student', 'schoolYear', 'company'],
    });

    if (!existing) {
      throw new NotFoundException('Student payment not found');
    }

    await this.validateReferences(
      {
        student_id: dto.student_id ?? existing.student_id,
        school_year_id: dto.school_year_id ?? existing.school_year_id,
        amount: dto.amount ?? existing.amount,
      } as CreateStudentPaymentDto,
      companyId,
    );

    this.validateReceiptAmount(dto.amount ?? existing.amount);

    const amountToCheck = dto.amount ?? existing.amount;
    await this.validateAmountNotExceedingTotalDue(
      existing.student_id,
      existing.school_year_id,
      amountToCheck,
      companyId,
      id,
    );

    const dtoWithoutCompany = { ...dto };
    delete (dtoWithoutCompany as any).company_id;

    const merged = this.repo.merge(existing, dtoWithoutCompany);
    merged.company_id = companyId;
    merged.company = { id: companyId } as any;

    await this.repo.save(merged);
    await this.allocationsService.reallocatePayment(id, companyId);
    return this.findOne(id, companyId);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const existing = await this.repo.findOne({
      where: { id, company_id: companyId, status: Not(-2) },
    });
    if (!existing) {
      throw new NotFoundException('Student payment not found');
    }

    existing.status = -2;
    await this.repo.save(existing);
    await this.allocationsService.softDeleteByPayment(id, companyId);
  }

  private async validateReferences(
    dto: Pick<
      CreateStudentPaymentDto,
      'student_id' | 'school_year_id' | 'amount'
    >,
    companyId: number,
  ): Promise<void> {
    const student = await this.studentRepo.findOne({
      where: { id: dto.student_id, company_id: companyId, status: Not(-2) },
    });
    if (!student) {
      throw new NotFoundException(
        `Student with ID ${dto.student_id} not found or does not belong to your company`,
      );
    }

    const schoolYear = await this.schoolYearRepo.findOne({
      where: { id: dto.school_year_id, status: Not(-2) },
      relations: ['company'],
    });
    if (!schoolYear) {
      throw new NotFoundException(`School year with ID ${dto.school_year_id} not found`);
    }
    if (schoolYear.company?.id !== companyId) {
      throw new BadRequestException('School year does not belong to your company');
    }

    if (dto.amount === undefined || dto.amount === null || dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }
  }

  /**
   * Total due = sum of student_payment_details (obligations) for this student + school year.
   * Remaining due = total due - total already allocated.
   * When excludePaymentId is set (update flow), we exclude that payment's allocations so the
   * updated amount can be at most remainingDue + that payment's current allocated amount.
   */
  /**
   * Public summary for frontend: total obligations, total allocated, remaining due.
   * Use this to display and cap the payment amount when creating/editing a receipt.
   */
  async getPaymentSummary(
    studentId: number,
    schoolYearId: number,
    companyId: number,
  ): Promise<{
    total_due: number;
    total_allocated: number;
    remaining_due: number;
    max_payment_allowed: number;
  }> {
    const { totalDue, totalAllocated, remainingDue } = await this.getRemainingDue(
      studentId,
      schoolYearId,
      companyId,
    );
    return {
      total_due: totalDue,
      total_allocated: totalAllocated,
      remaining_due: remainingDue,
      max_payment_allowed: remainingDue,
    };
  }

  private async getRemainingDue(
    studentId: number,
    schoolYearId: number,
    companyId: number,
    excludePaymentId?: number,
  ): Promise<{ totalDue: number; totalAllocated: number; remainingDue: number; excludedAllocated: number }> {
    const totalDueRow = await this.detailRepo
      .createQueryBuilder('d')
      .select('COALESCE(SUM(d.amount_ttc), 0)', 'total')
      .where('d.student_id = :studentId', { studentId })
      .andWhere('d.school_year_id = :schoolYearId', { schoolYearId })
      .andWhere('d.company_id = :companyId', { companyId })
      .andWhere('d.status <> :deleted', { deleted: -2 })
      .getRawOne<{ total: string }>();

    const totalDue = Number(totalDueRow?.total ?? 0);

    const allocQb = this.allocationRepo
      .createQueryBuilder('a')
      .innerJoin('a.studentPaymentDetail', 'd')
      .select('COALESCE(SUM(a.allocated_amount), 0)', 'total')
      .where('a.student_id = :studentId', { studentId })
      .andWhere('d.school_year_id = :schoolYearId', { schoolYearId })
      .andWhere('a.company_id = :companyId', { companyId })
      .andWhere('a.status <> :deleted', { deleted: -2 });

    if (excludePaymentId != null) {
      allocQb.andWhere('a.student_payment_id <> :excludeId', { excludeId: excludePaymentId });
    }

    const allocRow = await allocQb.getRawOne<{ total: string }>();
    const totalAllocated = Number(allocRow?.total ?? 0);

    let excludedAllocated = 0;
    if (excludePaymentId != null) {
      const exclRow = await this.allocationRepo
        .createQueryBuilder('a')
        .select('COALESCE(SUM(a.allocated_amount), 0)', 'total')
        .where('a.student_payment_id = :paymentId', { paymentId: excludePaymentId })
        .andWhere('a.company_id = :companyId', { companyId })
        .andWhere('a.status <> :deleted', { deleted: -2 })
        .getRawOne<{ total: string }>();
      excludedAllocated = Number(exclRow?.total ?? 0);
    }

    const remainingDue = Number((totalDue - totalAllocated).toFixed(2));
    return {
      totalDue,
      totalAllocated,
      remainingDue: Math.max(0, remainingDue),
      excludedAllocated,
    };
  }

  private async validateAmountNotExceedingTotalDue(
    studentId: number,
    schoolYearId: number,
    amount: number,
    companyId: number,
    excludePaymentId?: number,
  ): Promise<void> {
    const { totalDue, remainingDue, excludedAllocated } = await this.getRemainingDue(
      studentId,
      schoolYearId,
      companyId,
      excludePaymentId,
    );

    const maxAllowed = Number((remainingDue + excludedAllocated).toFixed(2));

    if (totalDue <= 0) {
      throw new BadRequestException(
        'This student has no payment obligations (level pricings) for this school year. Add obligations first or activate the student in a class.',
      );
    }

    if (amount > maxAllowed) {
      throw new BadRequestException(
        `Payment amount (${amount}) cannot exceed the remaining amount due for this student in this school year (${maxAllowed}). Total obligations: ${totalDue}.`,
      );
    }
  }

  private validateReceiptAmount(payment: number): void {
    if (payment === undefined || payment === null || payment <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }
  }

  private async attachAllocationSummary(
    payments: StudentPayment[],
    companyId: number,
  ): Promise<any[]> {
    if (payments.length === 0) {
      return [];
    }

    const paymentIds = payments.map((payment) => payment.id);
    const rows = await this.allocationRepo
      .createQueryBuilder('allocation')
      .select('allocation.student_payment_id', 'paymentId')
      .addSelect('COALESCE(SUM(allocation.allocated_amount), 0)', 'allocatedAmount')
      .where('allocation.company_id = :companyId', { companyId })
      .andWhere('allocation.status <> :deletedStatus', { deletedStatus: -2 })
      .andWhere('allocation.student_payment_id IN (:...paymentIds)', { paymentIds })
      .groupBy('allocation.student_payment_id')
      .getRawMany();

    const allocatedByPaymentId = new Map<number, number>(
      rows.map((row) => [Number(row.paymentId), Number(row.allocatedAmount)]),
    );

    return payments.map((payment) => {
      const allocatedAmount = allocatedByPaymentId.get(payment.id) ?? 0;
      const receivedAmount = Number(payment.amount);
      return {
        ...payment,
        allocated_amount: allocatedAmount,
        unallocated_amount: Number((receivedAmount - allocatedAmount).toFixed(2)),
      };
    });
  }
}

