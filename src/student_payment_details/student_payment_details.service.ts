import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { StudentPaymentDetail } from './entities/student_payment_detail.entity';
import { StudentPaymentAllocation } from '../student_payment_allocations/entities/student_payment_allocation.entity';
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
