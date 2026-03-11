import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateSpecializationDto } from './dto/create-specialization.dto';
import { UpdateSpecializationDto } from './dto/update-specialization.dto';
import { Specialization } from './entities/specialization.entity';
import { SpecializationQueryDto } from './dto/specialization-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { Program } from '../programs/entities/program.entity';

@Injectable()
export class SpecializationsService {
  constructor(
    @InjectRepository(Specialization)
    private repo: Repository<Specialization>,
    @InjectRepository(Program)
    private programRepo: Repository<Program>,
  ) {}

  async create(dto: CreateSpecializationDto, companyId: number): Promise<Specialization> {
    try {
      // Verify program exists and belongs to the same company
      const program = await this.programRepo.findOne({
        where: { id: dto.program_id, company_id: companyId },
      });
      if (!program) {
        throw new BadRequestException('Program not found or does not belong to your company');
      }

      // Always set company_id from authenticated user
      const dtoWithCompany = {
        ...dto,
        company_id: companyId,
      };
      const created = this.repo.create(dtoWithCompany);
      const saved = await this.repo.save(created);
      return this.findOne(saved.id, companyId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create specialization');
    }
  }

  async findAll(query: SpecializationQueryDto, companyId: number): Promise<PaginatedResponseDto<Specialization>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.repo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.program', 'p')
      .leftJoinAndSelect('s.levels', 'l');

    qb.andWhere('s.status <> :deletedStatus', { deletedStatus: -2 });
    // Always filter by company_id from authenticated user
    qb.andWhere('s.company_id = :company_id', { company_id: companyId });

    if (query.search) {
      qb.andWhere('(s.title LIKE :search OR s.description LIKE :search)', { search: `%${query.search}%` });
    }
    if (query.status !== undefined) qb.andWhere('s.status = :status', { status: query.status });
    if (query.program_id) qb.andWhere('s.program_id = :program_id', { program_id: query.program_id });

    qb.skip((page - 1) * limit).take(limit).orderBy('s.id', 'DESC');

    const [data, total] = await qb.getManyAndCount();

    // Ensure durationMonths is populated using levels when not explicitly set
    const enriched = data.map(spec => {
      if (!spec.durationMonths && spec.levels && spec.levels.length > 0) {
        spec.durationMonths = spec.levels.reduce((sum, level) => {
          return sum + (level.durationMonths ?? 0);
        }, 0);
      }
      return spec;
    });

    return PaginationService.createResponse(enriched, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<Specialization> {
    const found = await this.repo.findOne({
      where: { id, company_id: companyId, status: Not(-2) },
      relations: ['program', 'levels'],
    });
    if (!found) throw new NotFoundException('Specialization not found');
    // Compute duration from levels if not explicitly set
    if (!found.durationMonths && found.levels && found.levels.length > 0) {
      found.durationMonths = found.levels.reduce((sum, level) => {
        return sum + (level.durationMonths ?? 0);
      }, 0);
    }
    return found;
  }

  async update(id: number, dto: UpdateSpecializationDto, companyId: number): Promise<Specialization> {
    const existing = await this.findOne(id, companyId);

    // If program_id is being updated, verify it belongs to the same company
    if (dto.program_id !== undefined) {
      const program = await this.programRepo.findOne({
        where: { id: dto.program_id, company_id: companyId },
      });
      if (!program) {
        throw new BadRequestException('Program not found or does not belong to your company');
      }
      existing.program_id = dto.program_id;
      existing.program = { id: dto.program_id } as any;
    }

    // Prevent changing company_id - always use authenticated user's company
    const dtoWithoutCompany = { ...dto };
    delete (dtoWithoutCompany as any).company_id;
    delete (dtoWithoutCompany as any).program_id; // Already handled above

    const merged = this.repo.merge(existing, dtoWithoutCompany);
    // Ensure company_id remains from authenticated user
    merged.company_id = companyId;
    merged.company = { id: companyId } as any;

    // If duration is not provided explicitly, recompute from levels
    if (dtoWithoutCompany.durationMonths === undefined && merged.levels && merged.levels.length > 0) {
      merged.durationMonths = merged.levels.reduce((sum, level) => {
        return sum + (level.durationMonths ?? 0);
      }, 0);
    }

    await this.repo.save(merged);
    return this.findOne(id, companyId);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const existing = await this.findOne(id, companyId);
    await this.repo.remove(existing);
  }
}
