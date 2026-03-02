import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateLevelPricingDto } from './dto/create-level-pricing.dto';
import { UpdateLevelPricingDto } from './dto/update-level-pricing.dto';
import { LevelPricing } from './entities/level-pricing.entity';
import { LevelPricingQueryDto } from './dto/level-pricing-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { Level } from '../level/entities/level.entity';

@Injectable()
export class LevelPricingService {
  constructor(
    @InjectRepository(LevelPricing)
    private readonly repo: Repository<LevelPricing>,
    @InjectRepository(Level)
    private readonly levelRepo: Repository<Level>,
  ) {}

  async create(dto: CreateLevelPricingDto, companyId: number): Promise<LevelPricing> {
    // Verify level exists and belongs to the same company
    const level = await this.levelRepo.findOne({
      where: { id: dto.level_id, company_id: companyId },
    });
    if (!level) {
      throw new BadRequestException('Level not found or does not belong to your company');
    }

    // Always set company_id from authenticated user
    const entity = this.repo.create({
      ...dto,
      company_id: companyId,
      status: dto.status ?? 2,
      occurrences: dto.occurrences ?? 1,
      every_month: dto.every_month ?? 0,
    });

    const saved = await this.repo.save(entity);
    return this.findOne(saved.id, companyId);
  }

  async findAll(query: LevelPricingQueryDto, companyId: number): Promise<PaginatedResponseDto<LevelPricing>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.repo
      .createQueryBuilder('pricing')
      .leftJoinAndSelect('pricing.level', 'level')
      .leftJoinAndSelect('pricing.company', 'company')
      .where('pricing.status <> :deletedStatus', { deletedStatus: -2 })
      .orderBy('pricing.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    // Always filter by company_id from authenticated user
    qb.andWhere('pricing.company_id = :company_id', { company_id: companyId });

    if (query.status !== undefined) {
      qb.andWhere('pricing.status = :status', { status: query.status });
    }

    if (query.level_id) {
      qb.andWhere('pricing.level_id = :level_id', { level_id: query.level_id });
    }

    if (query.search) {
      qb.andWhere('pricing.title LIKE :search', { search: `%${query.search}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<LevelPricing> {
    const pricing = await this.repo.findOne({
      where: { id, company_id: companyId, status: Not(-2) },
      relations: ['level', 'company'],
    });
    if (!pricing) {
      throw new NotFoundException('Level pricing not found');
    }
    return pricing;
  }

  async update(id: number, dto: UpdateLevelPricingDto, companyId: number): Promise<LevelPricing> {
    const existing = await this.findOne(id, companyId);

    // If level_id is being updated, verify it belongs to the same company
    if (dto.level_id !== undefined) {
      const level = await this.levelRepo.findOne({
        where: { id: dto.level_id, company_id: companyId },
      });
      if (!level) {
        throw new BadRequestException('Level not found or does not belong to your company');
      }
    }

    // Prevent changing company_id - always use authenticated user's company
    const dtoWithoutCompany = { ...dto };
    delete (dtoWithoutCompany as any).company_id;

    const merged = this.repo.merge(existing, dtoWithoutCompany);
    // Ensure company_id remains from authenticated user
    merged.company_id = companyId;
    merged.company = { id: companyId } as any;

    await this.repo.save(merged);
    return this.findOne(id, companyId);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const existing = await this.findOne(id, companyId);
    existing.status = -2;
    await this.repo.save(existing);
  }
}
