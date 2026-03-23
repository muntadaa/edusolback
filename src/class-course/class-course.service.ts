import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateClassCourseDto } from './dto/create-class-course.dto';
import { UpdateClassCourseDto } from './dto/update-class-course.dto';
import { ClassCourse } from './entities/class-course.entity';
import { Level } from '../level/entities/level.entity';
import { Module as ModuleEntity } from '../module/entities/module.entity';
import { Course } from '../course/entities/course.entity';
import { ClassCourseQueryDto } from './dto/class-course-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';

@Injectable()
export class ClassCourseService {
  constructor(
    @InjectRepository(ClassCourse)
    private readonly repo: Repository<ClassCourse>,
    @InjectRepository(Level)
    private readonly levelRepo: Repository<Level>,
    @InjectRepository(ModuleEntity)
    private readonly moduleRepo: Repository<ModuleEntity>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
  ) {}

  async create(dto: CreateClassCourseDto, companyId: number): Promise<ClassCourse> {
    await this.ensureForeignKeys(dto, companyId);
    await this.ensureNotDuplicate(dto, companyId);

    const entity = this.repo.create({
      ...dto,
      company_id: companyId,
    });

    try {
      const saved = await this.repo.save(entity);
      return this.findOne(saved.id, companyId);
    } catch (error) {
      throw new BadRequestException('Failed to create class course');
    }
  }

  async createMany(dtos: CreateClassCourseDto[], companyId: number): Promise<ClassCourse[]> {
    if (!dtos || dtos.length === 0) {
      throw new BadRequestException('At least one class course is required');
    }

    const seenCombos = new Set<string>();
    for (const dto of dtos) {
      await this.ensureForeignKeys(dto, companyId);
      await this.ensureNotDuplicate(dto, companyId);

      const key = `${dto.level_id}|${dto.module_id}|${dto.course_id}`;
      if (seenCombos.has(key)) {
        throw new BadRequestException(
          'Duplicate class course combination (level, module, course) found in request payload',
        );
      }
      seenCombos.add(key);
    }

    const entities = dtos.map(dto =>
      this.repo.create({
        ...dto,
        company_id: companyId,
      }),
    );

    try {
      const saved = await this.repo.save(entities);
      const ids = saved.map(entity => entity.id);

      return this.repo
        .createQueryBuilder('cc')
        .leftJoinAndSelect('cc.level', 'level')
        .leftJoinAndSelect('level.specialization', 'specialization')
        .leftJoinAndSelect('specialization.program', 'program')
        .leftJoinAndSelect('cc.module', 'module')
        .leftJoinAndSelect('cc.course', 'course')
        .where('cc.company_id = :companyId', { companyId })
        .andWhere('cc.id IN (:...ids)', { ids })
        .getMany();
    } catch (error) {
      throw new BadRequestException('Failed to create class courses');
    }
  }

  async findAll(query: ClassCourseQueryDto, companyId: number): Promise<PaginatedResponseDto<ClassCourse>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.repo
      .createQueryBuilder('cc')
      .leftJoinAndSelect('cc.level', 'level')
      .leftJoinAndSelect('level.specialization', 'specialization')
      .leftJoinAndSelect('specialization.program', 'program')
      .leftJoinAndSelect('cc.module', 'module')
      .leftJoinAndSelect('cc.course', 'course');

    qb.andWhere('cc.company_id = :companyId', { companyId });

    if (query.status !== undefined) {
      qb.andWhere('cc.status = :status', { status: query.status });
    } else {
      qb.andWhere('cc.status <> :deletedStatus', { deletedStatus: -2 });
    }

    if (query.search) {
      qb.andWhere('cc.description LIKE :search', {
        search: `%${query.search}%`,
      });
    }

    if (query.level_id) qb.andWhere('cc.level_id = :levelId', { levelId: query.level_id });
    if (query.module_id) qb.andWhere('cc.module_id = :moduleId', { moduleId: query.module_id });
    if (query.course_id) qb.andWhere('cc.course_id = :courseId', { courseId: query.course_id });
    
    if (query.allday !== undefined) qb.andWhere('cc.allday = :allday', { allday: query.allday });

    qb.orderBy('cc.id', 'DESC').skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<ClassCourse> {
    const found = await this.repo
      .createQueryBuilder('cc')
      .leftJoinAndSelect('cc.level', 'level')
      .leftJoinAndSelect('level.specialization', 'specialization')
      .leftJoinAndSelect('specialization.program', 'program')
      .leftJoinAndSelect('cc.module', 'module')
      .leftJoinAndSelect('cc.course', 'course')
      .where('cc.id = :id', { id })
      .andWhere('cc.company_id = :companyId', { companyId })
      .andWhere('cc.status <> :deletedStatus', { deletedStatus: -2 })
      .getOne();

    if (!found) {
      throw new NotFoundException('Class course not found');
    }

    return found;
  }

  async update(id: number, dto: UpdateClassCourseDto, companyId: number): Promise<ClassCourse> {
    const existing = await this.findOne(id, companyId);
    await this.ensureForeignKeys(dto, companyId);

    const dtoWithoutCompany = { ...dto };
    delete (dtoWithoutCompany as any).company_id;

    const merged = this.repo.merge(existing, dtoWithoutCompany);
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

  private async ensureForeignKeys(
    dto: Partial<Pick<CreateClassCourseDto, 'level_id' | 'module_id' | 'course_id'>>,
    companyId: number,
  ): Promise<void> {
    await Promise.all([
      this.ensureScopedEntity(this.levelRepo, 'level', dto.level_id, companyId, 'Level'),
      this.ensureScopedEntity(this.moduleRepo, 'mod', dto.module_id, companyId, 'Module', { allowNullCompany: true }),
      this.ensureScopedEntity(this.courseRepo, 'course', dto.course_id, companyId, 'Course', { allowNullCompany: true }),
    ]);
  }

  private async ensureNotDuplicate(
    dto: Partial<Pick<CreateClassCourseDto, 'level_id' | 'module_id' | 'course_id'>>,
    companyId: number,
  ): Promise<void> {
    if (!dto.level_id || !dto.module_id || !dto.course_id) return;

    const existing = await this.repo.findOne({
      where: {
        company_id: companyId,
        level_id: dto.level_id,
        module_id: dto.module_id,
        course_id: dto.course_id,
        status: Not(-2),
      },
    });

    if (existing) {
      throw new BadRequestException(
        'A programme course with the same level, module and course already exists',
      );
    }
  }

  private async ensureScopedEntity<T extends { status?: number; company_id?: number }>(
    repo: Repository<T>,
    alias: string,
    id: number | undefined,
    companyId: number,
    entityLabel: string,
    options: { allowNullCompany?: boolean } = {},
  ): Promise<void> {
    if (id === undefined) return;

    const qb = repo
      .createQueryBuilder(alias)
      .where(`${alias}.id = :id`, { id })
      .andWhere(`${alias}.status <> :deletedStatus`, { deletedStatus: -2 });

    if (options.allowNullCompany) {
      qb.andWhere(`(${alias}.company_id = :companyId OR ${alias}.company_id IS NULL)`, { companyId });
    } else {
      qb.andWhere(`${alias}.company_id = :companyId`, { companyId });
    }

    const entity = await qb.getOne();

    if (!entity) {
      throw new BadRequestException(`${entityLabel} not found or does not belong to your company`);
    }
  }
}
