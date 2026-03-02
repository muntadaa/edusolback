import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateTeacherCourseDto } from './dto/create-teacher-course.dto';
import { UpdateTeacherCourseDto } from './dto/update-teacher-course.dto';
import { TeacherCourseQueryDto } from './dto/teacher-course-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { TeacherCourse } from './entities/teacher-course.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Course } from '../course/entities/course.entity';

@Injectable()
export class TeacherCourseService {
  constructor(
    @InjectRepository(TeacherCourse)
    private readonly repo: Repository<TeacherCourse>,
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
  ) {}

  async create(dto: CreateTeacherCourseDto, companyId: number): Promise<TeacherCourse> {
    await this.ensureTeacherExists(dto.teacher_id, companyId);
    await this.ensureCourseExists(dto.course_id, companyId);

    const existing = await this.repo.findOne({
      where: { teacher_id: dto.teacher_id, course_id: dto.course_id },
    });

    const status = dto.status ?? 1; // Default to active (1)

    if (existing) {
      // If it exists and is deleted (status -2), restore it by updating status to 1
      if (Number(existing.status) === -2) {
        existing.status = status;
        await this.repo.save(existing);
        return this.findOne(dto.teacher_id, dto.course_id, companyId);
      } else {
        // If it exists and is not deleted, throw error
        throw new BadRequestException('Teacher already assigned to this course');
      }
    }

    const entity = this.repo.create({
      teacher_id: dto.teacher_id,
      course_id: dto.course_id,
      status,
      teacher: { id: dto.teacher_id } as Teacher,
      course: { id: dto.course_id } as Course,
    });

    await this.repo.save(entity);
    return this.findOne(dto.teacher_id, dto.course_id, companyId);
  }

  async findAll(query: TeacherCourseQueryDto, companyId: number): Promise<PaginatedResponseDto<TeacherCourse>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.repo
      .createQueryBuilder('tc')
      .leftJoinAndSelect('tc.teacher', 'teacher')
      .leftJoinAndSelect('tc.course', 'course');

    // Always filter by company_id through teacher or course
    qb.andWhere('(teacher.company_id = :companyId OR course.company_id = :companyId)', { companyId });

    if (query.status !== undefined) {
      qb.andWhere('tc.status = :status', { status: query.status });
    } else {
      qb.andWhere('tc.status <> :deletedStatus', { deletedStatus: -2 });
    }

    if (query.teacher_id) {
      qb.andWhere('tc.teacher_id = :teacherId', { teacherId: query.teacher_id });
    }
    if (query.course_id) {
      qb.andWhere('tc.course_id = :courseId', { courseId: query.course_id });
    }

    qb.orderBy('tc.course_id', 'ASC').addOrderBy('tc.teacher_id', 'ASC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findOne(teacherId: number, courseId: number, companyId: number): Promise<TeacherCourse> {
    const entity = await this.repo
      .createQueryBuilder('tc')
      .leftJoinAndSelect('tc.teacher', 'teacher')
      .leftJoinAndSelect('tc.course', 'course')
      .where('tc.teacher_id = :teacherId', { teacherId })
      .andWhere('tc.course_id = :courseId', { courseId })
      .andWhere('tc.status <> :deletedStatus', { deletedStatus: -2 })
      .andWhere('(teacher.company_id = :companyId OR course.company_id = :companyId)', { companyId })
      .getOne();

    if (!entity) {
      throw new NotFoundException('Teacher-course relation not found');
    }

    return entity;
  }

  async update(teacherId: number, courseId: number, dto: UpdateTeacherCourseDto, companyId: number): Promise<TeacherCourse> {
    const existing = await this.findOne(teacherId, courseId, companyId);

    const status = dto.status !== undefined ? dto.status : existing.status;

    existing.status = status;

    await this.repo.save(existing);

    return this.findOne(teacherId, courseId, companyId);
  }

  async remove(teacherId: number, courseId: number, companyId: number): Promise<void> {
    const existing = await this.findOne(teacherId, courseId, companyId);
    existing.status = -2;
    await this.repo.save(existing);
  }

  /**
   * Get all teachers assigned to a specific course
   */
  async getTeachersByCourse(courseId: number, companyId: number): Promise<Teacher[]> {
    // First verify course exists and belongs to company
    await this.ensureCourseExists(courseId, companyId);

    const teacherCourses = await this.repo
      .createQueryBuilder('tc')
      .leftJoinAndSelect('tc.teacher', 'teacher')
      .leftJoinAndSelect('tc.course', 'course')
      .where('tc.course_id = :courseId', { courseId })
      .andWhere('tc.status <> :deletedStatus', { deletedStatus: -2 })
      .andWhere('teacher.company_id = :companyId', { companyId })
      .andWhere('teacher.status <> :teacherDeletedStatus', { teacherDeletedStatus: -2 })
      .orderBy('teacher.last_name', 'ASC')
      .addOrderBy('teacher.first_name', 'ASC')
      .getMany();

    // Extract teachers from teacher-course relations
    return teacherCourses.map(tc => tc.teacher).filter(teacher => teacher !== null) as Teacher[];
  }

  private async ensureTeacherExists(teacherId: number, companyId: number): Promise<void> {
    const teacher = await this.teacherRepo.findOne({ 
      where: { id: teacherId, company_id: companyId, status: Not(-2) },
    });
    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found or does not belong to your company`);
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
