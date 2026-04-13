import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { StudentPayment } from '../student-payment/entities/student-payment.entity';
import { StudentPaymentDetail } from '../student_payment_details/entities/student_payment_detail.entity';
import { StudentPaymentAllocationQueryDto } from './dto/student-payment-allocation-query.dto';
import { StudentPaymentAllocation } from './entities/student_payment_allocation.entity';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';

@Injectable()
export class StudentPaymentAllocationsService {
  constructor(
    @InjectRepository(StudentPaymentAllocation)
    private readonly repo: Repository<StudentPaymentAllocation>,
    @InjectRepository(StudentPayment)
    private readonly paymentRepo: Repository<StudentPayment>,
    @InjectRepository(StudentPaymentDetail)
    private readonly detailRepo: Repository<StudentPaymentDetail>,
  ) {}

  async findAll(
    query: StudentPaymentAllocationQueryDto,
    companyId: number,
  ): Promise<PaginatedResponseDto<StudentPaymentAllocation>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.repo
      .createQueryBuilder('allocation')
      .leftJoinAndSelect('allocation.studentPayment', 'studentPayment')
      .leftJoinAndSelect('allocation.studentPaymentDetail', 'studentPaymentDetail')
      .leftJoinAndSelect('allocation.student', 'student')
      .where('allocation.company_id = :companyId', { companyId })
      .andWhere('allocation.status <> :deletedStatus', { deletedStatus: -2 })
      .orderBy('allocation.allocated_at', 'DESC')
      .addOrderBy('allocation.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.status !== undefined) {
      qb.andWhere('allocation.status = :status', { status: query.status });
    }
    if (query.student_id) {
      qb.andWhere('allocation.student_id = :studentId', { studentId: query.student_id });
    }
    if (query.student_payment_id) {
      qb.andWhere('allocation.student_payment_id = :paymentId', {
        paymentId: query.student_payment_id,
      });
    }
    if (query.student_payment_detail_id) {
      qb.andWhere('allocation.student_payment_detail_id = :detailId', {
        detailId: query.student_payment_detail_id,
      });
    }

    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<StudentPaymentAllocation> {
    const allocation = await this.repo.findOne({
      where: { id, company_id: companyId, status: Not(-2) },
      relations: ['studentPayment', 'studentPaymentDetail', 'student'],
    });

    if (!allocation) {
      throw new NotFoundException('Student payment allocation not found');
    }

    return allocation;
  }

  async softDeleteByPayment(studentPaymentId: number, companyId: number): Promise<void> {
    await this.repo.update(
      { student_payment_id: studentPaymentId, company_id: companyId, status: Not(-2) },
      { status: -2 },
    );
  }

  async reallocatePayment(paymentId: number, companyId: number) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId, company_id: companyId, status: Not(-2) },
    });

    if (!payment) {
      throw new NotFoundException('Student payment not found');
    }

    await this.softDeleteByPayment(payment.id, companyId);

    let remainingAmount = Number(payment.amount);
    if (remainingAmount <= 0) {
      return {
        payment_id: payment.id,
        allocated_amount: 0,
        unallocated_amount: 0,
        allocations_created: 0,
      };
    }

    const details = await this.detailRepo.find({
      where: {
        student_id: payment.student_id,
        company_id: companyId,
        status: Not(-2),
      },
      order: {
        due_date: 'ASC',
        created_at: 'ASC',
      },
    });

    const openBalances = await this.getOpenBalances(details.map((detail) => detail.id), companyId);
    let allocatedAmount = 0;
    let allocationsCreated = 0;

    for (const detail of details) {
      if (remainingAmount <= 0) {
        break;
      }

      const alreadyAllocated = openBalances.get(detail.id) ?? 0;
      const detailTotal = Number(detail.amount_ttc);
      const openAmount = Number((detailTotal - alreadyAllocated).toFixed(2));

      if (openAmount <= 0) {
        continue;
      }

      const allocationAmount = Math.min(remainingAmount, openAmount);
      const allocation = this.repo.create({
        student_payment_id: payment.id,
        student_payment_detail_id: detail.id,
        student_id: payment.student_id,
        company_id: companyId,
        allocated_amount: allocationAmount,
        allocated_at: new Date(`${payment.date}T00:00:00`),
        status: 1,
      });

      await this.repo.save(allocation);
      allocationsCreated += 1;
      allocatedAmount = Number((allocatedAmount + allocationAmount).toFixed(2));
      remainingAmount = Number((remainingAmount - allocationAmount).toFixed(2));
    }

    return {
      payment_id: payment.id,
      allocated_amount: allocatedAmount,
      unallocated_amount: remainingAmount,
      allocations_created: allocationsCreated,
    };
  }

  private async getOpenBalances(detailIds: number[], companyId: number): Promise<Map<number, number>> {
    if (detailIds.length === 0) {
      return new Map<number, number>();
    }

    const rows = await this.repo
      .createQueryBuilder('allocation')
      .select('allocation.student_payment_detail_id', 'detailId')
      .addSelect('COALESCE(SUM(allocation.allocated_amount), 0)', 'allocatedAmount')
      .where('allocation.company_id = :companyId', { companyId })
      .andWhere('allocation.status <> :deletedStatus', { deletedStatus: -2 })
      .andWhere('allocation.student_payment_detail_id IN (:...detailIds)', { detailIds })
      .groupBy('allocation.student_payment_detail_id')
      .getRawMany();

    return new Map<number, number>(
      rows.map((row) => [Number(row.detailId), Number(row.allocatedAmount)]),
    );
  }
}
