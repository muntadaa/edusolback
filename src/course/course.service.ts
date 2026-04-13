import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not, In, QueryRunner } from 'typeorm';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { ModuleAssignmentDto, CourseModulesResponseDto } from './dto/module-assignment.dto';
import { Course } from './entities/course.entity';
import { Module } from '../module/entities/module.entity';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>,
    private dataSource: DataSource,
  ) {}

  async create(createCourseDto: CreateCourseDto, companyId: number): Promise<Course> {
    const courseData = {
      ...createCourseDto,
      intitule: createCourseDto.title,
      statut: createCourseDto.status,
      company_id: companyId,
    };
    const course = this.courseRepository.create(courseData);

    if (createCourseDto.module_ids?.length) {
      const uniqueModuleIds = [...new Set(createCourseDto.module_ids)];
      // Verify modules exist and belong to the same company
      const modules = await this.moduleRepository.find({
        where: { id: In(uniqueModuleIds), company_id: companyId },
      });
      if (modules.length !== uniqueModuleIds.length) {
        const foundIds = modules.map(module => module.id);
        const missing = uniqueModuleIds.filter(id => !foundIds.includes(id));
        throw new NotFoundException(`Modules with IDs ${missing.join(', ')} not found or do not belong to your company`);
      }
    }

    const savedCourse = await this.courseRepository.save(course);

    if (createCourseDto.module_ids?.length) {
      await this.replaceCourseModulesWithOrder(savedCourse.id, createCourseDto.module_ids);
    }

    return this.findOne(savedCourse.id, companyId);
  }

  async findAll(companyId: number): Promise<Course[]> {
    return await this.courseRepository.find({
      where: { company_id: companyId, statut: Not(-2) } as any,
      relations: ['company', 'modules'],
    });
  }

  async findAllWithPagination(queryDto: CourseQueryDto, companyId: number): Promise<PaginatedResponseDto<Course>> {
    const { page = 1, limit = 10, search, status } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.company', 'company')
      .leftJoinAndSelect('course.modules', 'modules')
      .skip(skip)
      .take(limit)
      .orderBy('course.created_at', 'DESC');

    queryBuilder.andWhere('course.statut <> :deletedStatus', { deletedStatus: -2 });
    // Always filter by company_id from authenticated user
    queryBuilder.andWhere('course.company_id = :company_id', { company_id: companyId });

    // Add search filter
    if (search) {
      queryBuilder.andWhere('course.intitule LIKE :search', { search: `%${search}%` });
    }

    // Add status filter
    if (status !== undefined) {
      queryBuilder.andWhere('course.statut = :status', { status });
    }

    const [courses, total] = await queryBuilder.getManyAndCount();

    return PaginationService.createResponse(courses, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id, company_id: companyId },
      relations: ['company', 'modules'],
    });
    
    if (!course || (course as any).statut === -2) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
    
    return course;
  }

  async update(id: number, updateCourseDto: UpdateCourseDto, companyId: number): Promise<Course> {
    const course = await this.findOne(id, companyId);

    if (updateCourseDto.module_ids !== undefined) {
      const uniqueModuleIds = [...new Set(updateCourseDto.module_ids)];
      if (uniqueModuleIds.length) {
        // Verify modules exist and belong to the same company
        const modules = await this.moduleRepository.find({
          where: { id: In(uniqueModuleIds), company_id: companyId },
        });
        if (modules.length !== uniqueModuleIds.length) {
          const foundIds = modules.map(module => module.id);
          const missing = uniqueModuleIds.filter(moduleId => !foundIds.includes(moduleId));
          throw new NotFoundException(`Modules with IDs ${missing.join(', ')} not found or do not belong to your company`);
        }
      }
    }

    // Prevent changing company_id - always use authenticated user's company
    const updateData = {
      ...updateCourseDto,
      intitule: updateCourseDto.title,
      statut: updateCourseDto.status,
    };
    delete (updateData as any).company_id;
    
    Object.assign(course, updateData);
    // Ensure company_id remains from authenticated user
    course.company_id = companyId;
    course.company = { id: companyId } as any;
    
    const savedCourse = await this.courseRepository.save(course);

    if (updateCourseDto.module_ids !== undefined) {
      await this.replaceCourseModulesWithOrder(savedCourse.id, updateCourseDto.module_ids);
    }

    return this.findOne(savedCourse.id, companyId);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const course = await this.findOne(id, companyId);
    await this.courseRepository.remove(course);
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

  private async replaceCourseModulesWithOrder(courseId: number, moduleIds: number[] = []): Promise<void> {
    await this.courseRepository.query('DELETE FROM module_course WHERE course_id = ?', [courseId]);

    const uniqueModuleIds = this.normalizeIds(moduleIds);
    if (!uniqueModuleIds.length) return;

    let tri = 0;
    for (const moduleId of uniqueModuleIds) {
      await this.courseRepository.query(
        'INSERT INTO module_course (module_id, course_id, tri) VALUES (?, ?, ?)',
        [moduleId, courseId, tri++],
      );
    }
  }

  private async getNextTriForCourse(courseId: number, runner?: QueryRunner): Promise<number> {
    const executor = runner ? runner.query.bind(runner) : this.courseRepository.query.bind(this.courseRepository);
    const result = await executor('SELECT COUNT(*) as total FROM module_course WHERE course_id = ?', [courseId]);
    const row = Array.isArray(result) ? result[0] : undefined;
    const value = row ? (row as any).total ?? Object.values(row)[0] : 0;
    return Number(value) || 0;
  }

  private async fetchAssignedModulesWithTri(courseId: number, companyId: number): Promise<Array<Module & { tri: number; assignment_created_at: Date }>> {
    const assignments = await this.courseRepository.query(
      'SELECT module_id, tri, created_at FROM module_course WHERE course_id = ? ORDER BY tri ASC, created_at DESC',
      [courseId],
    );

    if (!assignments.length) return [];

    const moduleIds = assignments.map((row: any) => row.module_id);
    // Only fetch modules that belong to the same company
    const modules = await this.moduleRepository.find({
      where: { id: In(moduleIds), company_id: companyId },
      relations: ['company'],
    });

    const moduleMap = new Map<number, Module>(modules.map(module => [module.id, module]));

    return assignments
      .map((row: any) => {
        const entity = moduleMap.get(row.module_id);
        if (!entity) return null;
        const clone = { ...entity } as Module & { tri: number; assignment_created_at: Date };
        (clone as any).tri = Number(row.tri ?? 0);
        (clone as any).assignment_created_at = row.created_at instanceof Date ? row.created_at : new Date(row.created_at);
        return clone;
      })
      .filter(Boolean) as Array<Module & { tri: number; assignment_created_at: Date }>;
  }


  /**
   * Get modules assigned and unassigned to a course for drag-and-drop interface
   */
  async getCourseModules(courseId: number, companyId: number): Promise<CourseModulesResponseDto> {
    // Verify course exists and belongs to company
    await this.findOne(courseId, companyId);

    const assignedModules = await this.fetchAssignedModulesWithTri(courseId, companyId);

    // Only show unassigned modules from the same company
    const unassignedModules = await this.moduleRepository
      .createQueryBuilder('module')
      .leftJoinAndSelect('module.company', 'company')
      .where('module.company_id = :companyId', { companyId })
      .andWhere('module.id NOT IN (SELECT mc.module_id FROM module_course mc WHERE mc.course_id = :courseId)', { courseId })
      .orderBy('module.created_at', 'DESC')
      .getMany();

    return {
      assigned: assignedModules,
      unassigned: unassignedModules,
    };
  }

  /**
   * Batch assign/unassign modules to/from a course
   */
  async batchManageCourseModules(courseId: number, assignmentDto: ModuleAssignmentDto, companyId: number): Promise<{ message: string; affected: number }> {
    // Verify course exists and belongs to company
    await this.findOne(courseId, companyId);

    if (!assignmentDto.add?.length && !assignmentDto.remove?.length) {
      throw new BadRequestException('At least one operation (add or remove) must be specified');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let affectedCount = 0;

      // Handle module additions
      if (assignmentDto.add?.length) {
        const modulesToAddIds = this.normalizeIds(assignmentDto.add);

        // Verify modules exist and belong to the same company
        const modulesToAdd = await this.moduleRepository.find({
          where: { id: In(modulesToAddIds), company_id: companyId },
        });
        if (modulesToAdd.length !== modulesToAddIds.length) {
          const foundIds = modulesToAdd.map(m => m.id);
          const missingIds = modulesToAddIds.filter(id => !foundIds.includes(id));
          throw new NotFoundException(`Modules with IDs ${missingIds.join(', ')} not found or do not belong to your company`);
        }

        let nextTri = await this.getNextTriForCourse(courseId, queryRunner);
        for (const moduleId of modulesToAddIds) {
          await queryRunner.query(
            'INSERT IGNORE INTO module_course (module_id, course_id, tri) VALUES (?, ?, ?)',
            [moduleId, courseId, nextTri]
          );
          nextTri += 1;
        }
        affectedCount += modulesToAddIds.length;
      }

      // Handle module removals
      if (assignmentDto.remove?.length) {
        // Remove relationships
        await queryRunner.query(
          'DELETE FROM module_course WHERE course_id = ? AND module_id IN (?)',
          [courseId, assignmentDto.remove]
        );
        affectedCount += assignmentDto.remove.length;
      }

      await queryRunner.commitTransaction();

      return {
        message: 'Module assignments updated successfully',
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
   * Add a single module to a course
   */
  async addModuleToCourse(courseId: number, moduleId: number, companyId: number): Promise<{ message: string; module: any }> {
    // Verify course exists and belongs to company
    await this.findOne(courseId, companyId);

    // Verify module exists and belongs to the same company
    const module = await this.moduleRepository.findOne({ 
      where: { id: moduleId, company_id: companyId },
      relations: ['company']
    });
    
    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found or does not belong to your company`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if relationship already exists
      const existingRelation = await queryRunner.query(
        'SELECT * FROM module_course WHERE course_id = ? AND module_id = ?',
        [courseId, moduleId]
      );

      if (existingRelation.length > 0) {
        throw new BadRequestException('Module is already assigned to this course');
      }

      const nextTri = await this.getNextTriForCourse(courseId, queryRunner);

      await queryRunner.query(
        'INSERT INTO module_course (module_id, course_id, tri) VALUES (?, ?, ?)',
        [moduleId, courseId, nextTri]
      );

      await queryRunner.commitTransaction();

      return {
        message: 'Module successfully assigned to course',
        module: module,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Remove a single module from a course
   */
  async removeModuleFromCourse(courseId: number, moduleId: number, companyId: number): Promise<{ message: string }> {
    // Verify course exists and belongs to company
    await this.findOne(courseId, companyId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if relationship exists
      const existingRelation = await queryRunner.query(
        'SELECT * FROM module_course WHERE course_id = ? AND module_id = ?',
        [courseId, moduleId]
      );

      if (existingRelation.length === 0) {
        throw new BadRequestException('Module is not assigned to this course');
      }

      // Remove relationship
      await queryRunner.query(
        'DELETE FROM module_course WHERE course_id = ? AND module_id = ?',
        [courseId, moduleId]
      );

      await queryRunner.commitTransaction();

      return {
        message: 'Module successfully removed from course',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
