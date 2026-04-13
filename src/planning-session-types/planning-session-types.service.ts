import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePlanningSessionTypeDto } from './dto/create-planning-session-type.dto';
import { UpdatePlanningSessionTypeDto } from './dto/update-planning-session-type.dto';
import { PlanningSessionType } from './entities/planning-session-type.entity';
import { PlanningSessionTypesQueryDto } from './dto/planning-session-types-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';

@Injectable()
export class PlanningSessionTypesService {
  constructor(
    @InjectRepository(PlanningSessionType)
    private readonly repo: Repository<PlanningSessionType>,
  ) {}

  async create(dto: CreatePlanningSessionTypeDto, companyId: number): Promise<PlanningSessionType> {
    // Always set company_id from authenticated user
    const entity = this.repo.create({
      ...dto,
      company_id: companyId,
      status: dto.status ?? 'active',
    });

    const saved = await this.repo.save(entity);
    return this.findOne(saved.id, companyId);
  }

  async findAll(query: PlanningSessionTypesQueryDto, companyId: number): Promise<PaginatedResponseDto<PlanningSessionType>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.repo
      .createQueryBuilder('type')
      .leftJoinAndSelect('type.company', 'company')
      .orderBy('type.title', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    // Always filter by company_id from authenticated user
    qb.andWhere('type.company_id = :company_id', { company_id: companyId });

    if (query.status) {
      qb.andWhere('type.status = :status', { status: query.status });
    }

    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<PlanningSessionType> {
    const found = await this.repo.findOne({ 
      where: { id, company_id: companyId }, 
      relations: ['company'] 
    });
    if (!found) {
      throw new NotFoundException('Planning session type not found');
    }
    return found;
  }

  async update(id: number, dto: UpdatePlanningSessionTypeDto, companyId: number): Promise<PlanningSessionType> {
    const existing = await this.findOne(id, companyId);
    
    // Prevent changing company_id - always use authenticated user's company
    const dtoWithoutCompany = { ...dto };
    delete (dtoWithoutCompany as any).company_id;
    
    const merged = this.repo.merge(existing, dtoWithoutCompany);
    // Ensure company_id remains from authenticated user
    merged.company_id = companyId;
    merged.company = { id: companyId } as any;
    
    return this.repo.save(merged);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const existing = await this.findOne(id, companyId);
    await this.repo.remove(existing);
  }
}
