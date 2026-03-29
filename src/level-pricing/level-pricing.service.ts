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
import { SchoolYear } from '../school-years/entities/school-year.entity';
import { Rubrique } from '../rubrique/entities/rubrique.entity';

@Injectable()
export class LevelPricingService {
  constructor(
    @InjectRepository(LevelPricing)
    private readonly repo: Repository<LevelPricing>,
    @InjectRepository(Level)
    private readonly levelRepo: Repository<Level>,
    @InjectRepository(SchoolYear)
    private readonly schoolYearRepo: Repository<SchoolYear>,
    @InjectRepository(Rubrique)
    private readonly rubriqueRepo: Repository<Rubrique>,
  ) {}

  async create(dto: CreateLevelPricingDto, companyId: number): Promise<any> {
    // Verify level exists and belongs to the same company
    const level = await this.levelRepo.findOne({
      where: { id: dto.level_id, company_id: companyId, status: Not(-2) },
    });
    if (!level) {
      throw new BadRequestException('Level not found or does not belong to your company');
    }

    // Verify school year exists and belongs to the same company
    const schoolYear = await this.schoolYearRepo.findOne({
      where: { id: dto.school_year_id, company_id: companyId, status: Not(-2) },
    });
    if (!schoolYear) {
      throw new BadRequestException('School year not found or does not belong to your company');
    }

    const rubrique = await this.resolveRubrique(dto.rubrique_id, companyId);
    this.ensurePricingSource(dto, rubrique);

    // Always set company_id from authenticated user
    const entity = this.repo.create({
      ...dto,
      rubrique_id: rubrique?.id ?? null,
      company_id: companyId,
      status: dto.status ?? 2,
      occurrences: dto.occurrences ?? null,
      every_month: dto.every_month ?? null,
      vat_rate: dto.vat_rate ?? null,
    });

    const saved = await this.repo.save(entity);
    return this.findOne(saved.id, companyId);
  }

  async createMany(
    dtos: CreateLevelPricingDto[],
    companyId: number,
  ): Promise<any[]> {
    if (!dtos || dtos.length === 0) {
      throw new BadRequestException('At least one level pricing is required');
    }

    const created: any[] = [];
    for (const dto of dtos) {
      const pricing = await this.create(dto, companyId);
      created.push(pricing);
    }
    return created;
  }

  async findAll(query: LevelPricingQueryDto, companyId: number): Promise<PaginatedResponseDto<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.repo
      .createQueryBuilder('pricing')
      .leftJoinAndSelect('pricing.level', 'level')
      .leftJoinAndSelect('pricing.schoolYear', 'schoolYear')
      .leftJoinAndSelect('pricing.rubrique', 'rubrique')
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
    if (query.school_year_id) {
      qb.andWhere('pricing.school_year_id = :school_year_id', {
        school_year_id: query.school_year_id,
      });
    }

    if (query.search) {
      qb.andWhere('(pricing.title LIKE :search OR rubrique.title LIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(
      data.map((pricing) => this.withEffectiveFields(pricing)),
      page,
      limit,
      total,
    );
  }

  async findOne(id: number, companyId: number): Promise<any> {
    const pricing = await this.repo.findOne({
      where: { id, company_id: companyId, status: Not(-2) },
      relations: ['level', 'schoolYear', 'rubrique', 'company'],
    });
    if (!pricing) {
      throw new NotFoundException('Level pricing not found');
    }
    return this.withEffectiveFields(pricing);
  }

  async update(id: number, dto: UpdateLevelPricingDto, companyId: number): Promise<any> {
    const existing = await this.repo.findOne({
      where: { id, company_id: companyId, status: Not(-2) },
      relations: ['level', 'schoolYear', 'rubrique', 'company'],
    });
    if (!existing) {
      throw new NotFoundException('Level pricing not found');
    }

    // If level_id is being updated, verify it belongs to the same company
    if (dto.level_id !== undefined) {
      const level = await this.levelRepo.findOne({
        where: { id: dto.level_id, company_id: companyId, status: Not(-2) },
      });
      if (!level) {
        throw new BadRequestException('Level not found or does not belong to your company');
      }
    }

    // If school_year_id is being updated, verify it belongs to the same company
    if (dto.school_year_id !== undefined) {
      const schoolYear = await this.schoolYearRepo.findOne({
        where: { id: dto.school_year_id, company_id: companyId, status: Not(-2) },
      });
      if (!schoolYear) {
        throw new BadRequestException('School year not found or does not belong to your company');
      }
    }

    const nextRubriqueId =
      dto.rubrique_id === undefined ? existing.rubrique_id : dto.rubrique_id ?? undefined;
    const rubrique = await this.resolveRubrique(nextRubriqueId, companyId);

    this.ensurePricingSource(
      {
        title: dto.title ?? existing.title ?? undefined,
        amount: dto.amount ?? (existing.amount ?? undefined),
        rubrique_id: rubrique?.id,
      } as CreateLevelPricingDto,
      rubrique,
    );

    // Prevent changing company_id - always use authenticated user's company
    const dtoWithoutCompany = { ...dto };
    delete (dtoWithoutCompany as any).company_id;

    const merged = this.repo.merge(existing, dtoWithoutCompany);
    // Ensure company_id remains from authenticated user
    merged.company_id = companyId;
    merged.company = { id: companyId } as any;
    merged.rubrique_id = rubrique?.id ?? null;
    merged.rubrique = rubrique ?? null;

    await this.repo.save(merged);
    return this.findOne(id, companyId);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const existing = await this.repo.findOne({
      where: { id, company_id: companyId, status: Not(-2) },
    });
    if (!existing) {
      throw new NotFoundException('Level pricing not found');
    }
    existing.status = -2;
    await this.repo.save(existing);
  }

  private async resolveRubrique(
    rubriqueId: number | null | undefined,
    companyId: number,
  ): Promise<Rubrique | null> {
    if (!rubriqueId) {
      return null;
    }

    const rubrique = await this.rubriqueRepo.findOne({
      where: { id: rubriqueId, company_id: companyId, status: Not(-2) },
    });

    if (!rubrique) {
      throw new BadRequestException('Rubrique not found or does not belong to your company');
    }

    return rubrique;
  }

  private ensurePricingSource(dto: CreateLevelPricingDto, rubrique: Rubrique | null): void {
    if (rubrique) {
      return;
    }

    if (!dto.title || dto.amount === undefined || dto.amount === null) {
      throw new BadRequestException('Either rubrique_id or both title and amount are required');
    }
  }

  private withEffectiveFields(pricing: LevelPricing): any {
    const effectiveAmount = Number(pricing.amount ?? pricing.rubrique?.amount ?? 0);
    const effectiveVatRate = pricing.vat_rate ?? pricing.rubrique?.vat_rate ?? 0;
    const effectiveAmountTtc = Number(
      (effectiveAmount * (1 + effectiveVatRate / 100)).toFixed(2),
    );
    const effectiveEveryMonth = pricing.every_month ?? pricing.rubrique?.every_month ?? 0;
    const fromPricingOcc = Math.max(pricing.occurrences ?? pricing.rubrique?.occurrences ?? 1, 1);
    const levelMonths = pricing.level?.durationMonths;
    const effectiveOccurrences =
      effectiveEveryMonth === 1 && levelMonths != null && levelMonths > 0
        ? levelMonths
        : fromPricingOcc;

    return {
      ...pricing,
      effective_title: pricing.title ?? pricing.rubrique?.title ?? null,
      effective_amount: effectiveAmount,
      effective_vat_rate: effectiveVatRate,
      effective_amount_ttc: effectiveAmountTtc,
      effective_occurrences: effectiveOccurrences,
      effective_every_month: effectiveEveryMonth,
    };
  }
}
