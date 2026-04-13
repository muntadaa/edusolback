import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not, In, QueryRunner } from 'typeorm';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { ModuleQueryDto } from './dto/module-query.dto';
import { CourseAssignmentDto, ModuleCoursesResponseDto } from './dto/course-assignment.dto';
import { Module } from './entities/module.entity';
import { Course } from '../course/entities/course.entity';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { ModuleCourseListItemDto } from './dto/module-course-list.dto';

@Injectable()
export class ModuleService {
  constructor(
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    private dataSource: DataSource,
  ) {}

  async create(createModuleDto: CreateModuleDto, companyId: number): Promise<Module> {
    // Always set company_id from authenticated user
    const moduleData = {
      ...createModuleDto,
      intitule: createModuleDto.title,
      status: createModuleDto.status,
      company_id: companyId,
    };
    const module = this.moduleRepository.create(moduleData);

    if (createModuleDto.course_ids?.length) {
      const uniqueCourseIds = this.normalizeIds(createModuleDto.course_ids);
      // Verify courses exist and belong to the same company
      const courses = await this.courseRepository.find({
        where: { id: In(uniqueCourseIds), company_id: companyId },
      });
      if (courses.length !== uniqueCourseIds.length) {
        const foundIds = courses.map(course => course.id);
        const missingIds = uniqueCourseIds.filter(courseId => !foundIds.includes(courseId));
        throw new NotFoundException(`Courses with IDs ${missingIds.join(', ')} not found or do not belong to your company`);
      }
    }

    const savedModule = await this.moduleRepository.save(module);

    if (createModuleDto.course_ids?.length) {
      await this.replaceModuleCoursesWithTri(savedModule.id, createModuleDto.course_ids);
    }

    return this.findOne(savedModule.id, companyId);
  }

  async findAll(companyId: number): Promise<Module[]> {
    return await this.moduleRepository.find({
      where: { company_id: companyId, status: Not(-2) } as any,
      relations: ['company', 'courses'],
    });
  }

  async findAllWithPagination(queryDto: ModuleQueryDto, companyId: number): Promise<PaginatedResponseDto<Module>> {
    const { page = 1, limit = 10, search, status } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.moduleRepository
      .createQueryBuilder('module')
      .leftJoinAndSelect('module.company', 'company')
      .leftJoinAndSelect('module.courses', 'courses')
      .skip(skip)
      .take(limit)
      .orderBy('module.created_at', 'DESC');

    queryBuilder.andWhere('module.statut <> :deletedStatus', { deletedStatus: -2 });
    // Always filter by company_id from authenticated user
    queryBuilder.andWhere('module.company_id = :company_id', { company_id: companyId });

    // Add search filter
    if (search) {
      queryBuilder.andWhere('module.intitule LIKE :search', { search: `%${search}%` });
    }

    // Add status filter
    if (status !== undefined) {
      queryBuilder.andWhere('module.statut = :status', { status });
    }

    const [modules, total] = await queryBuilder.getManyAndCount();

    return PaginationService.createResponse(modules, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<Module> {
    const module = await this.moduleRepository.findOne({
      where: { id, company_id: companyId },
      relations: ['company', 'courses'],
    });
    
    if (!module || (module as any).status === -2) {
      throw new NotFoundException(`Module with ID ${id} not found`);
    }
    
    return module;
  }

  async update(id: number, updateModuleDto: UpdateModuleDto, companyId: number): Promise<Module> {
    const module = await this.findOne(id, companyId);

    if (updateModuleDto.course_ids !== undefined) {
      const uniqueCourseIds = this.normalizeIds(updateModuleDto.course_ids);
      if (uniqueCourseIds.length) {
        // Verify courses exist and belong to the same company
        const courses = await this.courseRepository.find({
          where: { id: In(uniqueCourseIds), company_id: companyId },
        });
        if (courses.length !== uniqueCourseIds.length) {
          const foundIds = courses.map(course => course.id);
          const missingIds = uniqueCourseIds.filter(courseId => !foundIds.includes(courseId));
          throw new NotFoundException(`Courses with IDs ${missingIds.join(', ')} not found or do not belong to your company`);
        }
      }
    }

    // Prevent changing company_id - always use authenticated user's company
    const updateData = {
      ...updateModuleDto,
      intitule: updateModuleDto.title,
      status: updateModuleDto.status,
    };
    delete (updateData as any).company_id;
    Object.assign(module, updateData);
    // Ensure company_id remains from authenticated user
    module.company_id = companyId;
    module.company = { id: companyId } as any;
    const savedModule = await this.moduleRepository.save(module);

    if (updateModuleDto.course_ids !== undefined) {
      await this.replaceModuleCoursesWithTri(savedModule.id, updateModuleDto.course_ids);
    }

    return this.findOne(savedModule.id, companyId);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const module = await this.findOne(id, companyId);
    await this.moduleRepository.remove(module);
  }


  private normalizeIds(ids: number[] = []): number[] {
    const seen = new Set<number>();
    const ordered: number[] = [];
    ids.forEach(id => {
      if (id === undefined || id === null) return;
      if (!seen.has(id)) {
        seen.add(id);
        ordered.push(id);
      }
    });
    return ordered;
  }

  private async replaceModuleCoursesWithTri(moduleId: number, courseIds: number[] = []): Promise<void> {
    await this.moduleRepository.query('DELETE FROM module_course WHERE module_id = ?', [moduleId]);

    const uniqueCourseIds = this.normalizeIds(courseIds);
    if (!uniqueCourseIds.length) return;

    for (const courseId of uniqueCourseIds) {
      const nextTri = await this.getNextTriForCourse(courseId);
      await this.moduleRepository.query(
        'INSERT INTO module_course (module_id, course_id, tri) VALUES (?, ?, ?)',
        [moduleId, courseId, nextTri],
      );
    }
  }

  private async getNextTriForCourse(courseId: number, runner?: QueryRunner): Promise<number> {
    const executor = runner ? runner.query.bind(runner) : this.moduleRepository.query.bind(this.moduleRepository);
    const result = await executor('SELECT COUNT(*) as total FROM module_course WHERE course_id = ?', [courseId]);
    const row = Array.isArray(result) ? result[0] : undefined;
    const value = row ? (row as any).total ?? Object.values(row)[0] : 0;
    return Number(value) || 0;
  }

  private async fetchAssignedCoursesWithTri(moduleId: number, companyId: number): Promise<Array<Course & { tri: number; assignment_created_at: Date }>> {
    const assignments = await this.moduleRepository.query(
      'SELECT course_id, tri, created_at FROM module_course WHERE module_id = ? ORDER BY tri ASC, created_at DESC',
      [moduleId],
    );

    if (!assignments.length) return [];

    const courseIds = assignments.map((row: any) => row.course_id);
    // Only fetch courses that belong to the same company
    const courses = await this.courseRepository.find({
      where: { id: In(courseIds), company_id: companyId },
      relations: ['company'],
    });

    const courseMap = new Map<number, Course>(courses.map(course => [course.id, course]));

    return assignments
      .map((row: any) => {
        const entity = courseMap.get(row.course_id);
        if (!entity) return null;
        const clone = { ...entity } as Course & { tri: number; assignment_created_at: Date };
        (clone as any).tri = Number(row.tri ?? 0);
        (clone as any).assignment_created_at = row.created_at instanceof Date ? row.created_at : new Date(row.created_at);
        return clone;
      })
      .filter(Boolean) as Array<Course & { tri: number; assignment_created_at: Date }>;
  }


  /**
   * Get courses assigned and unassigned to a module for drag-and-drop interface
   */
  async getModuleCourses(moduleId: number, companyId: number): Promise<ModuleCoursesResponseDto> {
    // Verify module exists and belongs to company
    await this.findOne(moduleId, companyId);

    const assignedCourses = await this.fetchAssignedCoursesWithTri(moduleId, companyId);

    // Only show unassigned courses from the same company
    const unassignedCourses = await this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.company', 'company')
      .where('course.company_id = :companyId', { companyId })
      .andWhere('course.id NOT IN (SELECT mc.course_id FROM module_course mc WHERE mc.module_id = :moduleId)', { moduleId })
      .andWhere('course.statut <> :deletedStatus', { deletedStatus: -2 })
      .orderBy('course.created_at', 'DESC')
      .getMany();

    return {
      assigned: assignedCourses,
      unassigned: unassignedCourses,
    };
  }

  async getLinkedCourses(moduleId: number, companyId: number): Promise<ModuleCourseListItemDto[]> {
    await this.findOne(moduleId, companyId);
    const assignedCourses = await this.fetchAssignedCoursesWithTri(moduleId, companyId);

    return assignedCourses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description ?? null,
      volume: course.volume ?? null,
      coefficient: course.coefficient ?? null,
      status: course.status,
      tri: (course as any).tri ?? null,
    }));
  }

  /**
   * Batch assign/unassign courses to/from a module
   */
  async batchManageModuleCourses(moduleId: number, assignmentDto: CourseAssignmentDto, companyId: number): Promise<{ message: string; affected: number }> {
    // Verify module exists and belongs to company
    await this.findOne(moduleId, companyId);

    if (!assignmentDto.add?.length && !assignmentDto.remove?.length) {
      throw new BadRequestException('At least one operation (add or remove) must be specified');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let affectedCount = 0;

      // Handle course additions
      if (assignmentDto.add?.length) {
        const coursesToAddIds = this.normalizeIds(assignmentDto.add);
        // Verify courses exist and belong to the same company
        const coursesToAdd = await this.courseRepository.find({
          where: { id: In(coursesToAddIds), company_id: companyId },
        });
        if (coursesToAdd.length !== coursesToAddIds.length) {
          const foundIds = coursesToAdd.map(c => c.id);
          const missingIds = coursesToAddIds.filter(id => !foundIds.includes(id));
          throw new NotFoundException(`Courses with IDs ${missingIds.join(', ')} not found or do not belong to your company`);
        }

        for (const courseId of coursesToAddIds) {
          const nextTri = await this.getNextTriForCourse(courseId, queryRunner);
          await queryRunner.query(
            'INSERT IGNORE INTO module_course (module_id, course_id, tri) VALUES (?, ?, ?)',
            [moduleId, courseId, nextTri]
          );
        }
        affectedCount += coursesToAddIds.length;
      }

      // Handle course removals
      if (assignmentDto.remove?.length) {
        // Remove relationships
        await queryRunner.query(
          'DELETE FROM module_course WHERE module_id = ? AND course_id IN (?)',
          [moduleId, assignmentDto.remove]
        );
        affectedCount += assignmentDto.remove.length;
      }

      await queryRunner.commitTransaction();

      return {
        message: 'Course assignments updated successfully',
        affected: affectedCount,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Add a single course to a module
   */
  async addCourseToModule(moduleId: number, courseId: number, companyId: number): Promise<{ message: string; course: any }> {
    // Verify module exists and belongs to company
    await this.findOne(moduleId, companyId);

    // Verify course exists and belongs to the same company
    const course = await this.courseRepository.findOne({ 
      where: { id: courseId, company_id: companyId },
      relations: ['company']
    });
    
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found or does not belong to your company`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if relationship already exists
      const existingRelation = await queryRunner.query(
        'SELECT * FROM module_course WHERE module_id = ? AND course_id = ?',
        [moduleId, courseId]
      );

      if (existingRelation.length > 0) {
        throw new BadRequestException('Course is already assigned to this module');
      }

      const nextTri = await this.getNextTriForCourse(courseId, queryRunner);
      await queryRunner.query(
        'INSERT INTO module_course (module_id, course_id, tri) VALUES (?, ?, ?)',
        [moduleId, courseId, nextTri]
      );

      await queryRunner.commitTransaction();

      return {
        message: 'Course successfully assigned to module',
        course: course,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Remove a single course from a module
   */
  async removeCourseFromModule(moduleId: number, courseId: number, companyId: number): Promise<{ message: string }> {
    // Verify module exists and belongs to company
    await this.findOne(moduleId, companyId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if relationship exists
      const existingRelation = await queryRunner.query(
        'SELECT * FROM module_course WHERE module_id = ? AND course_id = ?',
        [moduleId, courseId]
      );

      if (existingRelation.length === 0) {
        throw new BadRequestException('Course is not assigned to this module');
      }

      // Remove relationship
      await queryRunner.query(
        'DELETE FROM module_course WHERE module_id = ? AND course_id = ?',
        [moduleId, courseId]
      );

      await queryRunner.commitTransaction();

      return {
        message: 'Course successfully removed from module',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
