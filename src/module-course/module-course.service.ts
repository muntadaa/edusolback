import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateModuleCourseDto } from './dto/create-module-course.dto';
import { UpdateModuleCourseDto } from './dto/update-module-course.dto';
import { ModuleCourseQueryDto } from './dto/module-course-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { ModuleCourse } from './entities/module-course.entity';
import { Module as ModuleEntity } from '../module/entities/module.entity';
import { Course } from '../course/entities/course.entity';

@Injectable()
export class ModuleCourseService {
  constructor(
    @InjectRepository(ModuleCourse)
    private readonly repo: Repository<ModuleCourse>,
    @InjectRepository(ModuleEntity)
    private readonly moduleRepo: Repository<ModuleEntity>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
  ) {}

  async create(dto: CreateModuleCourseDto, companyId: number) {
    await this.ensureModuleExists(dto.module_id, companyId);
    await this.ensureCourseExists(dto.course_id, companyId);

    const existing = await this.repo.findOne({
      where: { module_id: dto.module_id, course_id: dto.course_id },
    });

    const tri = dto.tri ?? (await this.getNextTriForCourse(dto.course_id, companyId));
    const status = dto.status ?? 1; // Default to active (1)

    if (existing) {
      // If it exists and is deleted (status -2), restore it by updating status to 1
      if (Number(existing.status) === -2) {
        existing.tri = tri;
        existing.volume = dto.volume ?? null;
        existing.coefficient = dto.coefficient ?? null;
        existing.status = status;
        await this.repo.save(existing);
        return this.findOne(dto.module_id, dto.course_id, companyId);
      } else {
        // If it exists and is not deleted, throw error
        throw new BadRequestException('Module already linked to this course');
      }
    }

    const entity = this.repo.create({
      module_id: dto.module_id,
      course_id: dto.course_id,
      tri,
      volume: dto.volume ?? null,
      coefficient: dto.coefficient ?? null,
      status,
      module: { id: dto.module_id } as ModuleEntity,
      course: { id: dto.course_id } as Course,
    });

    await this.repo.save(entity);
    return this.findOne(dto.module_id, dto.course_id, companyId);
  }

  async findAll(query: ModuleCourseQueryDto, companyId: number): Promise<PaginatedResponseDto<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.repo
      .createQueryBuilder('mc')
      .leftJoinAndSelect('mc.module', 'module')
      .leftJoinAndSelect('mc.course', 'course');

    // Always filter by company_id through module or course
    qb.andWhere('(module.company_id = :companyId OR course.company_id = :companyId)', { companyId });

    if (query.status !== undefined) {
      qb.andWhere('mc.status = :status', { status: query.status });
    } else {
      qb.andWhere('mc.status <> :deletedStatus', { deletedStatus: -2 });
    }

    if (query.module_id) {
      qb.andWhere('mc.module_id = :moduleId', { moduleId: query.module_id });
    }
    if (query.course_id) {
      qb.andWhere('mc.course_id = :courseId', { courseId: query.course_id });
    }

    qb.orderBy('mc.course_id', 'ASC').addOrderBy('mc.tri', 'ASC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findOne(moduleId: number, courseId: number, companyId: number) {
    const entity = await this.repo
      .createQueryBuilder('mc')
      .leftJoinAndSelect('mc.module', 'module')
      .leftJoinAndSelect('mc.course', 'course')
      .where('mc.module_id = :moduleId', { moduleId })
      .andWhere('mc.course_id = :courseId', { courseId })
      .andWhere('mc.status <> :deletedStatus', { deletedStatus: -2 })
      .andWhere('(module.company_id = :companyId OR course.company_id = :companyId)', { companyId })
      .getOne();

    if (!entity) {
      throw new NotFoundException('Module-course relation not found');
    }

    return entity;
  }

  async update(moduleId: number, courseId: number, dto: UpdateModuleCourseDto, companyId: number) {
    const existing = await this.findOne(moduleId, courseId, companyId);

    const tri = dto.tri ?? existing.tri;
    const volume = dto.volume !== undefined ? dto.volume : existing.volume;
    const coefficient = dto.coefficient !== undefined ? dto.coefficient : existing.coefficient;
    const status = dto.status !== undefined ? dto.status : existing.status;

    existing.tri = tri;
    existing.volume = volume ?? null;
    existing.coefficient = coefficient ?? null;
    existing.status = status;

    await this.repo.save(existing);

    return this.findOne(moduleId, courseId, companyId);
  }

  async remove(moduleId: number, courseId: number, companyId: number): Promise<void> {
    const existing = await this.findOne(moduleId, courseId, companyId);
    await this.repo.remove(existing);
  }

  private async getNextTriForCourse(courseId: number, companyId: number): Promise<number> {
    const qb = this.repo
      .createQueryBuilder('mc')
      .leftJoin('mc.course', 'course')
      .where('mc.course_id = :courseId', { courseId })
      .andWhere('mc.status <> :deletedStatus', { deletedStatus: -2 })
      .andWhere('course.company_id = :companyId', { companyId });
    return qb.getCount();
  }

  private async ensureModuleExists(moduleId: number, companyId: number): Promise<void> {
    const module = await this.moduleRepo.findOne({ 
      where: { id: moduleId, company_id: companyId, status: Not(-2) } as any,
    });
    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found or does not belong to your company`);
    }
  }

  private async ensureCourseExists(courseId: number, companyId: number): Promise<void> {
    const course = await this.courseRepo.findOne({ 
      where: { id: courseId, company_id: companyId, status: Not(-2) },
    });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found or does not belong to your company`);
    }
  }
}
