import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository, QueryFailedError } from 'typeorm';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ClassEntity } from './entities/class.entity';
import { SchoolYear } from '../school-years/entities/school-year.entity';
import { ClassQueryDto } from './dto/class-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';

/** When `status` is omitted on batch create: pending (active is typically `1`). */
const BATCH_CREATE_DEFAULT_STATUS = 2;

@Injectable()
export class ClassService {
  private readonly logger = new Logger(ClassService.name);

  constructor(
    @InjectRepository(ClassEntity)
    private repo: Repository<ClassEntity>,
    @InjectRepository(SchoolYear)
    private schoolYearRepo: Repository<SchoolYear>,
  ) {}

  /**
   * Ensures every school year id exists for the company, is not soft-deleted, and is not completed.
   */
  private async assertSchoolYearsAllowNewClasses(
    schoolYearIds: number[],
    companyId: number,
  ): Promise<void> {
    const unique = [...new Set(schoolYearIds)];
    if (unique.length === 0) {
      return;
    }
    const schoolYears = await this.schoolYearRepo.find({
      where: {
        id: In(unique),
        company_id: companyId,
        status: Not(-2),
      },
    });
    const byId = new Map(schoolYears.map((sy) => [sy.id, sy]));
    for (const id of unique) {
      const schoolYear = byId.get(id);
      if (!schoolYear) {
        throw new BadRequestException(`School year with ID ${id} not found`);
      }
      if (schoolYear.lifecycle_status === 'completed') {
        throw new BadRequestException(
          `Cannot create class: School year "${schoolYear.title}" is completed. ` +
            `Completed school years cannot be used for new classes. Only planned or ongoing school years are allowed.`,
        );
      }
    }
  }

  /**
   * Single create: always inserts a new row (no school-year/level deduplication).
   * Deduplication by school year + level applies only to {@link createMany} (`POST /classes/batch`).
   */
  async create(dto: CreateClassDto, companyId: number): Promise<ClassEntity> {
    try {
      await this.assertSchoolYearsAllowNewClasses([dto.school_year_id], companyId);

      // Always set company_id from authenticated user
      const dtoWithCompany = {
        ...dto,
        company_id: companyId,
      };
      const created = this.repo.create(dtoWithCompany);
      const saved = await this.repo.save(created);
      return this.findOne(saved.id, companyId);
    } catch (error) {
      // If it's already a BadRequestException, re-throw it
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Log the actual error for debugging
      this.logger.error('Failed to create class', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        dto,
        companyId,
      });

      // Handle database errors
      if (error instanceof QueryFailedError) {
        const errorMessage = error.message;
        if (errorMessage.includes('Duplicate entry')) {
          const match = errorMessage.match(/Duplicate entry '(.+?)' for key/);
          if (match) {
            throw new BadRequestException(`Duplicate entry: ${match[1]} already exists`);
          }
          throw new BadRequestException('This record already exists');
        }
        if (errorMessage.includes('foreign key constraint')) {
          throw new BadRequestException('Cannot create class: Invalid reference (program, specialization, level, or school year not found)');
        }
        if (errorMessage.includes('cannot be null')) {
          throw new BadRequestException('Required field cannot be null');
        }
        if (process.env.NODE_ENV !== 'production') {
          throw new BadRequestException(`Database error: ${errorMessage}`);
        }
      }

      throw new BadRequestException('Failed to create class');
    }
  }

  /** Used only by {@link createMany}. Same school year + level (+ company) => skip insert, return existing. */
  private classLevelDuplicateKey(dto: CreateClassDto): string {
    return `${dto.school_year_id}:${dto.level_id}`;
  }

  /** Bulk insert + single relational reload; result order matches `dtos`. */
  private async bulkInsertClassesOrdered(
    classRepo: Repository<ClassEntity>,
    dtos: CreateClassDto[],
    companyId: number,
  ): Promise<ClassEntity[]> {
    if (dtos.length === 0) {
      return [];
    }
    const entities = dtos.map((dto) =>
      classRepo.create({
        title: dto.title ?? null,
        description: dto.description,
        program_id: dto.program_id,
        specialization_id: dto.specialization_id,
        level_id: dto.level_id,
        school_year_id: dto.school_year_id,
        company_id: companyId,
        status: dto.status ?? BATCH_CREATE_DEFAULT_STATUS,
      }),
    );
    const saved = await classRepo.save(entities);
    const ids = saved.map((c) => c.id);
    const loaded = await classRepo.find({
      where: { id: In(ids), company_id: companyId },
      relations: ['program', 'specialization', 'level', 'schoolYear'],
    });
    const byId = new Map(loaded.map((c) => [c.id, c]));
    return ids.map((id) => {
      const row = byId.get(id);
      if (!row) {
        throw new BadRequestException('Failed to load created classes after insert');
      }
      return row;
    });
  }

  private handleClassBatchPersistenceError(
    error: unknown,
    companyId: number,
    count: number,
    logMessage: string,
    userFallbackMessage: string,
  ): never {
    if (error instanceof BadRequestException) {
      throw error;
    }
    this.logger.error(logMessage, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      count,
      companyId,
    });
    if (error instanceof QueryFailedError) {
      const errorMessage = error.message;
      if (errorMessage.includes('Duplicate entry')) {
        const match = errorMessage.match(/Duplicate entry '(.+?)' for key/);
        if (match) {
          throw new BadRequestException(`Duplicate entry: ${match[1]} already exists`);
        }
        throw new BadRequestException('This record already exists');
      }
      if (errorMessage.includes('foreign key constraint')) {
        throw new BadRequestException(
          'Cannot create class: Invalid reference (program, specialization, level, or school year not found)',
        );
      }
      if (errorMessage.includes('cannot be null')) {
        throw new BadRequestException('Required field cannot be null');
      }
      if (process.env.NODE_ENV !== 'production') {
        throw new BadRequestException(`Database error: ${errorMessage}`);
      }
    }
    throw new BadRequestException(userFallbackMessage);
  }

  /**
   * Creates many classes in one transaction: one school-year validation query, one bulk save,
   * one relational reload — avoids N+1 round-trips for large batches.
   * Skips creating a row when a non-deleted class already exists for the same school year and level
   * (and company); duplicate rows in the same batch share one insert. Response order matches `items`.
   * New inserts default `status` to **2** (pending) when omitted.
   */
  async createMany(dtos: CreateClassDto[], companyId: number): Promise<ClassEntity[]> {
    if (!dtos || dtos.length === 0) {
      throw new BadRequestException('At least one class is required');
    }

    const schoolYearIds = dtos.map((d) => d.school_year_id);
    await this.assertSchoolYearsAllowNewClasses(schoolYearIds, companyId);

    try {
      return await this.repo.manager.transaction(async (em) => {
        const classRepo = em.getRepository(ClassEntity);
        const uniqueSchoolYears = [...new Set(schoolYearIds)];

        const existingRows = await classRepo.find({
          where: {
            company_id: companyId,
            school_year_id: In(uniqueSchoolYears),
            status: Not(-2),
          },
          relations: ['program', 'specialization', 'level', 'schoolYear'],
          order: { id: 'ASC' },
        });

        const existingByLevelKey = new Map<string, ClassEntity>();
        for (const row of existingRows) {
          const key = `${row.school_year_id}:${row.level_id}`;
          if (!existingByLevelKey.has(key)) {
            existingByLevelKey.set(key, row);
          }
        }

        const batchSeenNewKey = new Set<string>();
        const dtosToInsert: CreateClassDto[] = [];
        const insertKeyOrder: string[] = [];

        for (const dto of dtos) {
          const key = this.classLevelDuplicateKey(dto);
          if (existingByLevelKey.has(key)) {
            continue;
          }
          if (batchSeenNewKey.has(key)) {
            continue;
          }
          batchSeenNewKey.add(key);
          dtosToInsert.push(dto);
          insertKeyOrder.push(key);
        }

        const newByKey = new Map<string, ClassEntity>();
        if (dtosToInsert.length > 0) {
          const insertedOrdered = await this.bulkInsertClassesOrdered(classRepo, dtosToInsert, companyId);
          for (let i = 0; i < insertKeyOrder.length; i += 1) {
            newByKey.set(insertKeyOrder[i], insertedOrdered[i]);
          }
        }

        return dtos.map((dto) => {
          const key = this.classLevelDuplicateKey(dto);
          const fromExisting = existingByLevelKey.get(key);
          if (fromExisting) {
            return fromExisting;
          }
          const created = newByKey.get(key);
          if (created) {
            return created;
          }
          throw new BadRequestException('Failed to resolve class after batch create');
        });
      });
    } catch (error) {
      this.handleClassBatchPersistenceError(
        error,
        companyId,
        dtos.length,
        'Failed to create classes in batch',
        'Failed to create classes in batch',
      );
    }
  }

  /**
   * Like {@link createMany} but **always inserts one row per item** (same school year + level allowed,
   * including duplicates already in DB). No skip/reuse by year+level. Default `status` **2** (pending) when omitted.
   */
  async createManyAllowDuplicates(dtos: CreateClassDto[], companyId: number): Promise<ClassEntity[]> {
    if (!dtos || dtos.length === 0) {
      throw new BadRequestException('At least one class is required');
    }

    const schoolYearIds = dtos.map((d) => d.school_year_id);
    await this.assertSchoolYearsAllowNewClasses(schoolYearIds, companyId);

    try {
      return await this.repo.manager.transaction(async (em) => {
        const classRepo = em.getRepository(ClassEntity);
        return this.bulkInsertClassesOrdered(classRepo, dtos, companyId);
      });
    } catch (error) {
      this.handleClassBatchPersistenceError(
        error,
        companyId,
        dtos.length,
        'Failed to create classes in batch (allow duplicates)',
        'Failed to create classes in batch (allow duplicates)',
      );
    }
  }

  async findAll(query: ClassQueryDto, companyId: number): Promise<PaginatedResponseDto<ClassEntity>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.repo.createQueryBuilder('c')
      .leftJoinAndSelect('c.program', 'program')
      .leftJoinAndSelect('c.specialization', 'specialization')
      .leftJoinAndSelect('c.level', 'level')
      .leftJoinAndSelect('c.schoolYear', 'schoolYear');
      
    qb.andWhere('c.status <> :deletedStatus', { deletedStatus: -2 });
    // Always filter by company_id from authenticated user
    qb.andWhere('c.company_id = :company_id', { company_id: companyId });

    if (query.search) {
      qb.andWhere('(c.title LIKE :search OR c.description LIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    if (query.program_id) qb.andWhere('c.program_id = :program_id', { program_id: query.program_id });
    if (query.specialization_id) qb.andWhere('c.specialization_id = :specialization_id', { specialization_id: query.specialization_id });
    if (query.level_id) qb.andWhere('c.level_id = :level_id', { level_id: query.level_id });
    if (query.school_year_id) qb.andWhere('c.school_year_id = :school_year_id', { school_year_id: query.school_year_id });
    if (query.status !== undefined) qb.andWhere('c.status = :status', { status: query.status });

    qb.skip((page - 1) * limit).take(limit).orderBy('c.id', 'DESC');

    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<ClassEntity> {
    const found = await this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.program', 'program')
      .leftJoinAndSelect('c.specialization', 'specialization')
      .leftJoinAndSelect('c.level', 'level')
      .leftJoinAndSelect('c.schoolYear', 'schoolYear')
      .where('c.id = :id', { id })
      .andWhere('c.company_id = :companyId', { companyId })
      .andWhere('c.status <> :deletedStatus', { deletedStatus: -2 })
      .getOne();
    
    if (!found) throw new NotFoundException('Class not found');
    return found;
  }

  async update(id: number, dto: UpdateClassDto, companyId: number): Promise<ClassEntity> {
    try {
      const existing = await this.findOne(id, companyId);
      
      // If school_year_id is being updated, validate it's not completed
      if (dto.school_year_id !== undefined && dto.school_year_id !== existing.school_year_id) {
        const schoolYear = await this.schoolYearRepo.findOne({
          where: { 
            id: dto.school_year_id, 
            company_id: companyId,
            status: Not(-2), // Not deleted
          },
        });

        if (!schoolYear) {
          throw new BadRequestException(`School year with ID ${dto.school_year_id} not found`);
        }

        if (schoolYear.lifecycle_status === 'completed') {
          throw new BadRequestException(
            `Cannot update class: School year "${schoolYear.title}" is completed. ` +
            `Completed school years cannot be used for classes. Only planned or ongoing school years are allowed.`
          );
        }
      }
      
      // Prevent changing company_id - always use authenticated user's company
      const dtoWithoutCompany = { ...dto };
      delete (dtoWithoutCompany as any).company_id;
      delete (dtoWithoutCompany as any).school_year_period_id; // Remove period if present
      
      const merged = this.repo.merge(existing, dtoWithoutCompany);
      // Ensure company_id remains from authenticated user
      merged.company_id = companyId;
      merged.company = { id: companyId } as any;
      
      const relationMappings = {
        program_id: 'program',
        specialization_id: 'specialization',
        level_id: 'level',
        school_year_id: 'schoolYear',
      } as const;

      (Object.entries(relationMappings) as Array<[keyof UpdateClassDto, keyof ClassEntity]>).forEach(([idProp, relationProp]) => {
        const value = (dto as any)[idProp];
        if (value !== undefined) {
          (merged as any)[idProp] = value;
          (merged as any)[relationProp] = value ? ({ id: value } as any) : undefined;
        }
      });

      await this.repo.save(merged);
      return this.findOne(id, companyId);
    } catch (error) {
      // If it's already a BadRequestException or NotFoundException, re-throw it
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      // Log the actual error for debugging
      this.logger.error('Failed to update class', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        dto,
        companyId,
      });

      // Handle database errors
      if (error instanceof QueryFailedError) {
        const errorMessage = error.message;
        if (errorMessage.includes('foreign key constraint')) {
          throw new BadRequestException('Cannot update class: Invalid reference (program, specialization, level, or school year not found)');
        }
        if (errorMessage.includes('cannot be null')) {
          throw new BadRequestException('Required field cannot be null');
        }
        if (process.env.NODE_ENV !== 'production') {
          throw new BadRequestException(`Database error: ${errorMessage}`);
        }
      }

      throw new BadRequestException('Failed to update class');
    }
  }

  async remove(id: number, companyId: number): Promise<void> {
    const existing = await this.findOne(id, companyId);
    await this.repo.remove(existing);
  }
}
