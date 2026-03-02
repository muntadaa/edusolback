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
    
    // Validation: Maximum one ongoing school year (max 1)
    // Note: 0 ongoing years is allowed (for initial setup), but frontend should show a warning
    if (lifecycleStatus === 'ongoing') {
      const existingOngoing = await this.schoolYearRepo.findOne({
        where: { 
          company_id: companyId, 
          lifecycle_status: 'ongoing',
          status: Not(-2)
        }
      });
      if (existingOngoing) {
        throw new BadRequestException('There must be at most one ongoing school year. Another school year is already ongoing.');
      }
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
    
    const currentLifecycleStatus = schoolYear.lifecycle_status;
    const newLifecycleStatus = dto.lifecycle_status !== undefined ? dto.lifecycle_status : currentLifecycleStatus;
    
    // Validation: Maximum one ongoing school year (max 1)
    // Note: 0 ongoing years is allowed (for initial setup), but frontend should show a warning
    if (newLifecycleStatus === 'ongoing' && currentLifecycleStatus !== 'ongoing') {
      // Trying to set this year to ongoing, but another one might already be ongoing
      const existingOngoing = await this.schoolYearRepo.findOne({
        where: { 
          company_id: companyId, 
          lifecycle_status: 'ongoing',
          status: Not(-2),
          id: Not(id) // Exclude current year
        }
      });
      if (existingOngoing) {
        throw new BadRequestException('There must be at most one ongoing school year. Another school year is already ongoing.');
      }
    }
    // Note: Allowing change from ongoing to another status even if it's the only one
    // Frontend should check and show a warning if no ongoing years exist
    
    Object.assign(schoolYear, dtoWithoutCompany);
    // Ensure company remains from authenticated user
    schoolYear.company = { id: companyId } as any;
    
    return this.schoolYearRepo.save(schoolYear);
  }

  async remove(id: number, companyId: number) {
    const schoolYear = await this.findOne(id, companyId);
    return this.schoolYearRepo.remove(schoolYear);
  }
}

