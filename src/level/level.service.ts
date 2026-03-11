import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Level } from './entities/level.entity';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto';
import { LevelQueryDto } from './dto/level-query.dto';
import { PaginationService } from '../common/services/pagination.service';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { Specialization } from '../specializations/entities/specialization.entity';
import { Program } from '../programs/entities/program.entity';

@Injectable()
export class LevelService {
  constructor(
    @InjectRepository(Level)
    private repo: Repository<Level>,
    @InjectRepository(Specialization)
    private specializationRepo: Repository<Specialization>,
    @InjectRepository(Program)
    private programRepo: Repository<Program>,
  ) {}

  async create(dto: CreateLevelDto, companyId: number): Promise<Level> {
    try {
      // Always set company_id from authenticated user
      // Always set level to 1 if not provided
      const dtoWithCompany = {
        ...dto,
        company_id: companyId,
        level: dto.level ?? 1,
      };
      const created = this.repo.create(dtoWithCompany);
      const saved = await this.repo.save(created);
      await this.recalculateDurationsForLevel(saved, companyId);
      return this.findOne(saved.id, companyId);
    } catch (e) {
      throw new BadRequestException('Failed to create level');
    }
  }

  async findAll(query: LevelQueryDto, companyId: number): Promise<PaginatedResponseDto<Level>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.repo.createQueryBuilder('l')
      .leftJoinAndSelect('l.specialization', 's')
      .leftJoinAndSelect('s.program', 'p');

    qb.andWhere('l.status <> :deletedStatus', { deletedStatus: -2 });
    // Always filter by company_id from authenticated user
    qb.andWhere('l.company_id = :company_id', { company_id: companyId });

    if (query.search) qb.andWhere('l.title LIKE :search', { search: `%${query.search}%` });
    if (query.specialization_id) qb.andWhere('l.specialization_id = :sid', { sid: query.specialization_id });
    if (query.program_id) qb.andWhere('s.program_id = :pid', { pid: query.program_id });
    if (query.status !== undefined) qb.andWhere('l.status = :status', { status: query.status });
    qb.skip((page - 1) * limit).take(limit).orderBy('l.id', 'DESC');
    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<Level> {
    const found = await this.repo.findOne({
      where: { id, company_id: companyId, status: Not(-2) },
      relations: ['specialization', 'specialization.program'],
    });
    if (!found) throw new NotFoundException('Level not found');
    return found;
  }

  async update(id: number, dto: UpdateLevelDto, companyId: number): Promise<Level> {
    const existing = await this.findOne(id, companyId);
    
    // Prevent changing company_id - always use authenticated user's company
    const dtoWithoutCompany = { ...dto };
    delete (dtoWithoutCompany as any).company_id;
    
    const merged = this.repo.merge(existing, dtoWithoutCompany);
    // Ensure company_id remains from authenticated user
    merged.company_id = companyId;
    merged.company = { id: companyId } as any;
    
    if (dto.specialization_id !== undefined) {
      merged.specialization_id = dto.specialization_id;
      merged.specialization = dto.specialization_id ? ({ id: dto.specialization_id } as any) : undefined;
    }
    const saved = await this.repo.save(merged);
    await this.recalculateDurationsForLevel(saved, companyId);
    return this.findOne(id, companyId);   
  }

  async remove(id: number, companyId: number): Promise<void> {
    const existing = await this.findOne(id, companyId);
    await this.repo.remove(existing);
    // After removal, recalculate durations for affected specialization/program
    await this.recalculateDurationsForLevel(existing, companyId);
  }

  /**
   * Recalculate and persist durationMonths for the related Specialization and Program
   * based on all active levels of that specialization.
   */
  private async recalculateDurationsForLevel(level: Level, companyId: number): Promise<void> {
    if (!level.specialization_id && !level.specialization?.id) {
      return;
    }

    const specializationId = level.specialization_id ?? level.specialization!.id;

    // 1) Recalculate specialization duration from its levels
    const levels = await this.repo.find({
      where: {
        specialization_id: specializationId,
        company_id: companyId,
        status: Not(-2),
      },
    });

    const specDuration = levels.reduce((sum, l) => sum + (l.durationMonths ?? 0), 0);

    const specialization = await this.specializationRepo.findOne({
      where: { id: specializationId, company_id: companyId, status: Not(-2) },
    });

    if (!specialization) {
      return;
    }

    specialization.durationMonths = specDuration;
    await this.specializationRepo.save(specialization);

    // 2) Recalculate program duration from its specializations
    const programId = specialization.program_id;
    if (!programId) {
      return;
    }

    const specializations = await this.specializationRepo.find({
      where: { program_id: programId, company_id: companyId, status: Not(-2) },
    });

    const programDuration = specializations.reduce(
      (sum, s) => sum + (s.durationMonths ?? 0),
      0,
    );

    const program = await this.programRepo.findOne({
      where: { id: programId, company_id: companyId, status: Not(-2) },
    });

    if (!program) {
      return;
    }

    program.durationMonths = programDuration;
    await this.programRepo.save(program);
  }
}
