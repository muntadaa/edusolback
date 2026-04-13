import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { SchoolYearPeriod } from './entities/school-year-period.entity';
import { CreateSchoolYearPeriodDto } from './dto/create-school-year-period.dto';
import { UpdateSchoolYearPeriodDto } from './dto/update-school-year-period.dto';
import { SchoolYear } from 'src/school-years/entities/school-year.entity';
import { SchoolYearPeriodQueryDto } from './dto/school-year-period-query.dto';

@Injectable()
export class SchoolYearPeriodsService {
  constructor(
    @InjectRepository(SchoolYearPeriod)
    private readonly periodRepo: Repository<SchoolYearPeriod>,
    @InjectRepository(SchoolYear)
    private readonly schoolYearRepo: Repository<SchoolYear>,
  ) {}

  /** At most one ongoing period per company (0 allowed). */
  private async assertNoOtherOngoingPeriod(companyId: number, excludePeriodId?: number): Promise<void> {
    const qb = this.periodRepo
      .createQueryBuilder('p')
      .where('p.company_id = :companyId', { companyId })
      .andWhere('p.lifecycle_status = :ongoing', { ongoing: 'ongoing' })
      .andWhere('p.status <> :deleted', { deleted: -2 });
    if (excludePeriodId != null) {
      qb.andWhere('p.id <> :excludeId', { excludeId: excludePeriodId });
    }
    const existing = await qb.getOne();
    if (existing) {
      throw new BadRequestException(
        'There must be at most one ongoing school year period for your company. Another period is already ongoing.',
      );
    }
  }

  private mapStatus(s: any): number {
    if (typeof s === 'number' && !Number.isNaN(s)) return s;
    if (s == null) return 2;
    const lower = String(s).toLowerCase();
    if (['disabled', '0'].includes(lower)) return 0;
    if (['active', '1'].includes(lower)) return 1;
    if (['pending', '2'].includes(lower)) return 2;
    if (['archiver', 'archived', 'archive', '-1'].includes(lower)) return -1;
    if (['deleted', '-2'].includes(lower)) return -2;
    const parsed = parseInt(lower, 10);
    return Number.isNaN(parsed) ? 2 : parsed;
  }

  async create(dto: CreateSchoolYearPeriodDto, companyId: number) {
    // Verify school year exists and belongs to the same company
    const parent = await this.schoolYearRepo.findOne({ 
      where: { id: dto.schoolYearId, status: Not(-2) },
      relations: ['company']
    });
    if (!parent) throw new NotFoundException('Parent school year not found');
    if (parent.company?.id !== companyId) {
      throw new BadRequestException('School year does not belong to your company');
    }

    const start = new Date(dto.start_date);
    const end = new Date(dto.end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid start_date or end_date');
    }
    if (end <= start) {
      throw new BadRequestException('end_date must be greater than start_date');
    }

    const lifecycleStatus = dto.lifecycle_status || 'planned';

    if (lifecycleStatus === 'ongoing') {
      await this.assertNoOtherOngoingPeriod(companyId);
    }

    // Always set company_id from authenticated user
    const period = this.periodRepo.create({
      title: dto.title,
      start_date: dto.start_date,
      end_date: dto.end_date,
      status: this.mapStatus(dto.status),
      lifecycle_status: lifecycleStatus,
      company_id: companyId,
      school_year_id: dto.schoolYearId,
      schoolYear: parent,
    });
    return this.periodRepo.save(period);
  }

  async findAll(query: SchoolYearPeriodQueryDto | undefined, companyId: number) {
    const q = query ?? ({} as SchoolYearPeriodQueryDto);
    const page = Math.max(1, q.page || 1);
    const limit = Math.min(100, q.limit || 10);
    const offset = (page - 1) * limit;

    const qb = this.periodRepo.createQueryBuilder('p').leftJoinAndSelect('p.schoolYear', 'schoolYear');

    qb.andWhere('p.status <> :deletedStatus', { deletedStatus: -2 });
    // Always filter by company_id from authenticated user
    qb.andWhere('p.company_id = :company_id', { company_id: companyId });

    if (q.title) {
      qb.andWhere('p.title LIKE :title', { title: `%${q.title}%` });
    }

    if (typeof q.status === 'number') {
      qb.andWhere('p.status = :status', { status: q.status });
    }

    if (q.lifecycle_status) {
      qb.andWhere('p.lifecycle_status = :lifecycleStatus', { lifecycleStatus: q.lifecycle_status });
    }

    if (q.school_year_id) {
      qb.andWhere('p.school_year_id = :schoolYearId', { schoolYearId: q.school_year_id });
    }

    if (q.school_year_period_id) {
      qb.andWhere('p.id = :periodId', { periodId: q.school_year_period_id });
    }

    qb.orderBy('p.id', 'DESC').skip(offset).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit) || 1,
      },
    };
  }


  async findOne(id: number, companyId: number) {
    const period = await this.periodRepo.findOne({ 
      where: { id, company_id: companyId, status: Not(-2) }, 
      relations: ['schoolYear'] 
    });
    if (!period) throw new NotFoundException('School year period not found');
    return period;
  }


  async update(id: number, dto: UpdateSchoolYearPeriodDto, companyId: number) {
    const period = await this.findOne(id, companyId);

    if (dto.schoolYearId) {
      // Verify school year exists and belongs to the same company
      const parent = await this.schoolYearRepo.findOne({ 
        where: { id: dto.schoolYearId, status: Not(-2) },
        relations: ['company']
      });
      if (!parent) throw new NotFoundException('Parent school year not found');
      if (parent.company?.id !== companyId) {
        throw new BadRequestException('School year does not belong to your company');
      }
      period.school_year_id = dto.schoolYearId;
      period.schoolYear = parent;
    }

    const start = dto.start_date ? new Date(dto.start_date) : new Date(period.start_date);
    const end = dto.end_date ? new Date(dto.end_date) : new Date(period.end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid start_date or end_date');
    }
    if (end <= start) {
      throw new BadRequestException('end_date must be greater than start_date');
    }

    if (dto.title !== undefined) period.title = dto.title;
    if (dto.start_date !== undefined) period.start_date = start;
    if (dto.end_date !== undefined) period.end_date = end;
    if (dto.status !== undefined) period.status = this.mapStatus(dto.status);
    if (dto.lifecycle_status !== undefined) period.lifecycle_status = dto.lifecycle_status;

    // Prevent changing company_id - always use authenticated user's company
    period.company_id = companyId;
    period.company = { id: companyId } as any;

    if (period.lifecycle_status === 'ongoing') {
      await this.assertNoOtherOngoingPeriod(companyId, id);
    }

    return this.periodRepo.save(period);
  }

  async remove(id: number, companyId: number) {
    const period = await this.findOne(id, companyId);
    return this.periodRepo.remove(period);
  }
}

