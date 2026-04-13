import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { SchoolYear } from './entities/school-year.entity';
import { CreateSchoolYearDto } from './dto/create-school-year.dto';
import { UpdateSchoolYearDto } from './dto/update-school-year.dto';
import { Company } from 'src/company/entities/company.entity';
import { SchoolYearQueryDto } from './dto/school-year-query.dto';

@Injectable()
export class SchoolYearsService {
  constructor(
    @InjectRepository(SchoolYear)
    private readonly schoolYearRepo: Repository<SchoolYear>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  async create(dto: CreateSchoolYearDto, companyId: number) {
    // Always use company_id from authenticated user, ignore dto.companyId
    const company = await this.companyRepo.findOne({ where: { id: companyId, status: Not(-2) } });
    if (!company) throw new NotFoundException('Company not found');

    const start = new Date(dto.start_date);
    const end = new Date(dto.end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid start_date or end_date');
    }
    if (end <= start) {
      throw new BadRequestException('end_date must be greater than start_date');
    }

    const lifecycleStatus = dto.lifecycle_status || 'planned';
    
    // At most one ongoing school year per company (0 allowed).
    if (lifecycleStatus === 'ongoing') {
      await this.assertNoOtherOngoingSchoolYear(companyId);
    }

    const schoolYear = this.schoolYearRepo.create({
      title: dto.title,
      start_date: dto.start_date,
      end_date: dto.end_date,
      status: dto.status,
      lifecycle_status: lifecycleStatus,
      company,
    });
    return this.schoolYearRepo.save(schoolYear);
  }

  /** Ensures no other school year in this company is already `ongoing`. */
  private async assertNoOtherOngoingSchoolYear(companyId: number, excludeSchoolYearId?: number): Promise<void> {
    const qb = this.schoolYearRepo
      .createQueryBuilder('sy')
      .where('sy.company_id = :companyId', { companyId })
      .andWhere('sy.lifecycle_status = :ongoing', { ongoing: 'ongoing' })
      .andWhere('sy.status <> :deleted', { deleted: -2 });
    if (excludeSchoolYearId != null) {
      qb.andWhere('sy.id <> :excludeId', { excludeId: excludeSchoolYearId });
    }
    const existing = await qb.getOne();
    if (existing) {
      throw new BadRequestException(
        'There must be at most one ongoing school year for your company. Another school year is already ongoing.',
      );
    }
  }

  async findAll(query: SchoolYearQueryDto | undefined, companyId: number) {
    const q = query ?? ({} as SchoolYearQueryDto);
    const page = Math.max(1, q.page || 1);
    const limit = Math.min(100, q.limit || 10);
    const offset = (page - 1) * limit;

    const qb = this.schoolYearRepo.createQueryBuilder('sy')
      .leftJoinAndSelect('sy.company', 'company');

    qb.andWhere('sy.status <> :deletedStatus', { deletedStatus: -2 });
    // Always filter by company_id from authenticated user
    qb.andWhere('company.id = :companyId', { companyId });

    if (q.title) {
      qb.andWhere('sy.title LIKE :title', { title: `%${q.title}%` });
    }

    if (typeof q.status === 'number') {
      qb.andWhere('sy.status = :status', { status: q.status });
    }

    if (q.lifecycle_status) {
      qb.andWhere('sy.lifecycle_status = :lifecycleStatus', { lifecycleStatus: q.lifecycle_status });
    }

    qb.orderBy('sy.id', 'DESC')
      .skip(offset)
      .take(limit);

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
    const schoolYear = await this.schoolYearRepo.findOne({ 
      where: { id, status: Not(-2) }, 
      relations: ['company'] 
    });
    if (!schoolYear) throw new NotFoundException('School year not found');
    // Verify school year belongs to the authenticated user's company
    if (schoolYear.company?.id !== companyId) {
      throw new NotFoundException('School year not found');
    }
    return schoolYear;
  }

  async update(id: number, dto: UpdateSchoolYearDto, companyId: number) {
    const schoolYear = await this.findOne(id, companyId);
    
    // Prevent changing company - always use authenticated user's company
    const dtoWithoutCompany = { ...dto };
    delete (dtoWithoutCompany as any).companyId;
    
    Object.assign(schoolYear, dtoWithoutCompany);
    if (schoolYear.lifecycle_status === 'ongoing') {
      await this.assertNoOtherOngoingSchoolYear(companyId, id);
    }
    // Ensure company remains from authenticated user
    schoolYear.company = { id: companyId } as any;
    
    return this.schoolYearRepo.save(schoolYear);
  }

  async remove(id: number, companyId: number) {
    const schoolYear = await this.findOne(id, companyId);
    return this.schoolYearRepo.remove(schoolYear);
  }
}

