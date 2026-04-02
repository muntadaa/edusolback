import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { RequiredDoc } from './entities/required-doc.entity';
import { CreateRequiredDocDto } from './dto/create-required-doc.dto';
import { UpdateRequiredDocDto } from './dto/update-required-doc.dto';
import { RequiredDocsQueryDto } from './dto/required-docs-query.dto';
import { Program } from '../programs/entities/program.entity';
import { Specialization } from '../specializations/entities/specialization.entity';
import { Level } from '../level/entities/level.entity';

@Injectable()
export class RequiredDocsService {
  constructor(
    @InjectRepository(RequiredDoc)
    private readonly repo: Repository<RequiredDoc>,
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,
    @InjectRepository(Specialization)
    private readonly specRepo: Repository<Specialization>,
    @InjectRepository(Level)
    private readonly levelRepo: Repository<Level>,
  ) {}

  private normalizeScope(
    programId?: number | null,
    specializationId?: number | null,
    levelId?: number | null,
  ): { program_id: number | null; specialization_id: number | null; level_id: number | null } {
    return {
      program_id: programId ?? null,
      specialization_id: specializationId ?? null,
      level_id: levelId ?? null,
    };
  }

  async assertValidRuleScope(
    companyId: number,
    programId?: number | null,
    specializationId?: number | null,
    levelId?: number | null,
  ): Promise<void> {
    const p = programId ?? null;
    const s = specializationId ?? null;
    const l = levelId ?? null;
    if (p == null && s == null && l == null) {
      throw new BadRequestException(
        'At least one of program_id, specialization_id, or level_id is required',
      );
    }

    if (l != null) {
      const level = await this.levelRepo.findOne({
        where: { id: l, company_id: companyId, status: Not(-2) },
      });
      if (!level) {
        throw new BadRequestException('Level not found for your company');
      }
      const spec = await this.specRepo.findOne({
        where: { id: level.specialization_id, company_id: companyId, status: Not(-2) },
      });
      if (!spec) {
        throw new BadRequestException('Level specialization not found');
      }
      if (s != null && level.specialization_id !== s) {
        throw new BadRequestException('Level does not belong to this specialization');
      }
      if (p != null && spec.program_id !== p) {
        throw new BadRequestException('Level does not belong to this program');
      }
      return;
    }

    if (s != null) {
      const spec = await this.specRepo.findOne({
        where: { id: s, company_id: companyId, status: Not(-2) },
      });
      if (!spec) {
        throw new BadRequestException('Specialization not found for your company');
      }
      if (p != null && spec.program_id !== p) {
        throw new BadRequestException('Specialization does not belong to this program');
      }
      return;
    }

    if (p != null) {
      const program = await this.programRepo.findOne({
        where: { id: p, company_id: companyId, status: Not(-2) },
      });
      if (!program) {
        throw new BadRequestException('Program not found for your company');
      }
    }
  }

  private async findDuplicate(
    companyId: number,
    title: string,
    scope: { program_id: number | null; specialization_id: number | null; level_id: number | null },
    excludeId?: number,
  ): Promise<RequiredDoc | null> {
    const qb = this.repo
      .createQueryBuilder('r')
      .where('r.company_id = :companyId', { companyId })
      .andWhere('r.title = :title', { title: title.trim() })
      .andWhere('r.program_id <=> :p', { p: scope.program_id })
      .andWhere('r.specialization_id <=> :s', { s: scope.specialization_id })
      .andWhere('r.level_id <=> :l', { l: scope.level_id });
    if (excludeId != null) {
      qb.andWhere('r.id != :excludeId', { excludeId });
    }
    return qb.getOne();
  }

  async create(dto: CreateRequiredDocDto, companyId: number): Promise<RequiredDoc> {
    const scope = this.normalizeScope(dto.program_id, dto.specialization_id, dto.level_id);
    await this.assertValidRuleScope(companyId, scope.program_id, scope.specialization_id, scope.level_id);
    const title = dto.title.trim();
    const dup = await this.findDuplicate(companyId, title, scope);
    if (dup) {
      throw new BadRequestException(
        'A required document with this title already exists for the same scope',
      );
    }
    const row = this.repo.create({
      company_id: companyId,
      program_id: scope.program_id,
      specialization_id: scope.specialization_id,
      level_id: scope.level_id,
      title,
      is_required: dto.is_required !== false,
    });
    return this.repo.save(row);
  }

  async findAll(companyId: number, q: RequiredDocsQueryDto): Promise<RequiredDoc[]> {
    const qb = this.repo
      .createQueryBuilder('r')
      .where('r.company_id = :companyId', { companyId })
      .orderBy('r.title', 'ASC')
      .addOrderBy('r.id', 'ASC');

    if (q.program_id != null) {
      qb.andWhere('(r.program_id IS NULL OR r.program_id = :programId)', {
        programId: q.program_id,
      });
    }
    if (q.specialization_id != null) {
      qb.andWhere('(r.specialization_id IS NULL OR r.specialization_id = :specializationId)', {
        specializationId: q.specialization_id,
      });
    }
    if (q.level_id != null) {
      qb.andWhere('(r.level_id IS NULL OR r.level_id = :levelId)', {
        levelId: q.level_id,
      });
    }
    if (q.search?.trim()) {
      const term = `%${q.search.trim()}%`;
      qb.andWhere('r.title LIKE :search', { search: term });
    }

    return qb.getMany();
  }

  /**
   * Templates that apply to a student’s academic triple (wildcard rules included).
   * Used when assigning class / level to auto-create student document rows.
   */
  async findApplicableTemplates(
    companyId: number,
    programId: number,
    specializationId: number,
    levelId: number,
  ): Promise<RequiredDoc[]> {
    return this.repo
      .createQueryBuilder('r')
      .where('r.company_id = :companyId', { companyId })
      .andWhere('(r.program_id IS NULL OR r.program_id = :programId)', { programId })
      .andWhere('(r.specialization_id IS NULL OR r.specialization_id = :specializationId)', {
        specializationId,
      })
      .andWhere('(r.level_id IS NULL OR r.level_id = :levelId)', { levelId })
      .orderBy('r.title', 'ASC')
      .addOrderBy('r.id', 'ASC')
      .getMany();
  }

  async findOne(id: number, companyId: number): Promise<RequiredDoc> {
    const row = await this.repo.findOne({ where: { id, company_id: companyId } });
    if (!row) {
      throw new NotFoundException(`Required document ${id} not found`);
    }
    return row;
  }

  async update(id: number, dto: UpdateRequiredDocDto, companyId: number): Promise<RequiredDoc> {
    const row = await this.findOne(id, companyId);
    const scope = this.normalizeScope(
      dto.program_id !== undefined ? dto.program_id : row.program_id,
      dto.specialization_id !== undefined ? dto.specialization_id : row.specialization_id,
      dto.level_id !== undefined ? dto.level_id : row.level_id,
    );
    await this.assertValidRuleScope(companyId, scope.program_id, scope.specialization_id, scope.level_id);
    const title =
      dto.title !== undefined ? dto.title.trim() : row.title;
    if (dto.title !== undefined && !title) {
      throw new BadRequestException('title cannot be empty');
    }
    const dup = await this.findDuplicate(companyId, title, scope, id);
    if (dup) {
      throw new BadRequestException(
        'A required document with this title already exists for the same scope',
      );
    }
    row.program_id = scope.program_id;
    row.specialization_id = scope.specialization_id;
    row.level_id = scope.level_id;
    row.title = title;
    if (dto.is_required !== undefined) {
      row.is_required = dto.is_required;
    }
    return this.repo.save(row);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const row = await this.findOne(id, companyId);
    await this.repo.remove(row);
  }
}
