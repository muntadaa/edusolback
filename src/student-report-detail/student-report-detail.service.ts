import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { CreateStudentReportDetailDto } from './dto/create-student-report-detail.dto';
import { CreateManyStudentReportDetailsDto } from './dto/create-many-student-report-details.dto';
import { UpdateStudentReportDetailDto } from './dto/update-student-report-detail.dto';
import { StudentReportDetail } from './entities/student-report-detail.entity';
import { StudentReportDetailQueryDto } from './dto/student-report-detail-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { StudentReport } from '../student-report/entities/student-report.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Course } from '../course/entities/course.entity';

@Injectable()
export class StudentReportDetailService {
  constructor(
    @InjectRepository(StudentReportDetail)
    private readonly repo: Repository<StudentReportDetail>,
    @InjectRepository(StudentReport)
    private readonly studentReportRepo: Repository<StudentReport>,
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
  ) {}

  async create(dto: CreateStudentReportDetailDto, companyId: number): Promise<StudentReportDetail> {
    // Verify student report exists and belongs to the same company (through student)
    const studentReport = await this.studentReportRepo.findOne({
      where: { id: dto.student_report_id, status: Not(-2) },
      relations: ['student'],
    });
    if (!studentReport) {
      throw new NotFoundException(`Student report with ID ${dto.student_report_id} not found`);
    }
    if (studentReport.company_id !== companyId) {
      throw new BadRequestException('Student report does not belong to your company');
    }

    // Verify teacher exists and belongs to the same company if provided
    if (dto.teacher_id !== undefined && dto.teacher_id !== null) {
      const teacher = await this.teacherRepo.findOne({
        where: { id: dto.teacher_id, company_id: companyId, status: Not(-2) },
      });
      if (!teacher) {
        throw new NotFoundException(`Teacher with ID ${dto.teacher_id} not found or does not belong to your company`);
      }
    }

    // Verify course exists and belongs to the same company if provided
    if (dto.course_id !== undefined && dto.course_id !== null) {
      const course = await this.courseRepo.findOne({
        where: { id: dto.course_id, company_id: companyId, status: Not(-2) },
      });
      if (!course) {
        throw new NotFoundException(`Course with ID ${dto.course_id} not found or does not belong to your company`);
      }
    }

    const entity = this.repo.create({
      ...dto,
      status: dto.status ?? 2,
    });
    const saved = await this.repo.save(entity);
    return this.findOne(saved.id, companyId);
  }

  /**
   * Create many detail rows for one student report in a single transaction.
   * Validates all referenced teachers and courses (batch) before insert.
   */
  async createMany(dto: CreateManyStudentReportDetailsDto, companyId: number): Promise<StudentReportDetail[]> {
    const { student_report_id, details } = dto;

    const studentReport = await this.studentReportRepo.findOne({
      where: { id: student_report_id, status: Not(-2) },
      relations: ['student'],
    });
    if (!studentReport) {
      throw new NotFoundException(`Student report with ID ${student_report_id} not found`);
    }
    if (studentReport.company_id !== companyId) {
      throw new BadRequestException('Student report does not belong to your company');
    }

    const teacherIdSet = new Set<number>();
    const courseIdSet = new Set<number>();
    for (const item of details) {
      if (item.teacher_id != null && item.teacher_id !== undefined) {
        teacherIdSet.add(Number(item.teacher_id));
      }
      if (item.course_id != null && item.course_id !== undefined) {
        courseIdSet.add(Number(item.course_id));
      }
    }

    const teacherIds = [...teacherIdSet];
    if (teacherIds.length > 0) {
      const teachers = await this.teacherRepo.find({
        where: { id: In(teacherIds), company_id: companyId, status: Not(-2) },
      });
      if (teachers.length !== teacherIds.length) {
        throw new BadRequestException('One or more teachers were not found or do not belong to your company');
      }
    }

    const courseIds = [...courseIdSet];
    if (courseIds.length > 0) {
      const courses = await this.courseRepo.find({
        where: { id: In(courseIds), company_id: companyId, status: Not(-2) },
      });
      if (courses.length !== courseIds.length) {
        throw new BadRequestException('One or more courses were not found or do not belong to your company');
      }
    }

    return this.repo.manager.transaction(async (em) => {
      const detailRepo = em.getRepository(StudentReportDetail);
      const entities = details.map((item) =>
        detailRepo.create({
          student_report_id,
          teacher_id: item.teacher_id ?? null,
          course_id: item.course_id ?? null,
          remarks: item.remarks,
          note: item.note,
          status: item.status ?? 2,
        }),
      );
      const saved = await detailRepo.save(entities);
      const ids = saved.map((r) => r.id);
      return detailRepo.find({
        where: { id: In(ids) },
        relations: ['studentReport', 'studentReport.student', 'teacher', 'course'],
        order: { id: 'ASC' },
      });
    });
  }

  async findAll(query: StudentReportDetailQueryDto, companyId: number): Promise<PaginatedResponseDto<StudentReportDetail>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.repo
      .createQueryBuilder('detail')
      .leftJoinAndSelect('detail.studentReport', 'studentReport')
      .leftJoinAndSelect('studentReport.student', 'student')
      .leftJoinAndSelect('detail.teacher', 'teacher')
      .leftJoinAndSelect('detail.course', 'course')
      .orderBy('detail.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    qb.andWhere('detail.status <> :deletedStatus', { deletedStatus: -2 });
    qb.andWhere('studentReport.company_id = :company_id', { company_id: companyId });

    if (query.status !== undefined) {
      qb.andWhere('detail.status = :status', { status: query.status });
    }

    if (query.student_id) {
      qb.andWhere('student.id = :student_id', { student_id: query.student_id });
    }

    if (query.student_report_id) {
      qb.andWhere('detail.student_report_id = :student_report_id', { student_report_id: query.student_report_id });
    }

    if (query.teacher_id) {
      qb.andWhere('detail.teacher_id = :teacher_id', { teacher_id: query.teacher_id });
    }

    if (query.course_id) {
      qb.andWhere('detail.course_id = :course_id', { course_id: query.course_id });
    }

    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<StudentReportDetail> {
    const found = await this.repo
      .createQueryBuilder('detail')
      .leftJoinAndSelect('detail.studentReport', 'studentReport')
      .leftJoinAndSelect('studentReport.student', 'student')
      .leftJoinAndSelect('detail.teacher', 'teacher')
      .leftJoinAndSelect('detail.course', 'course')
      .where('detail.id = :id', { id })
      .andWhere('detail.status <> :deletedStatus', { deletedStatus: -2 })
      .andWhere('studentReport.company_id = :companyId', { companyId })
      .getOne();
    
    if (!found) {
      throw new NotFoundException('Student report detail not found');
    }
    return found;
  }

  async update(id: number, dto: UpdateStudentReportDetailDto, companyId: number): Promise<StudentReportDetail> {
    const existing = await this.findOne(id, companyId);

    // If student_report_id is being updated, verify it belongs to the same company
    if (dto.student_report_id !== undefined) {
      const studentReport = await this.studentReportRepo.findOne({
        where: { id: dto.student_report_id, status: Not(-2) },
        relations: ['student'],
      });
      if (!studentReport) {
        throw new NotFoundException(`Student report with ID ${dto.student_report_id} not found`);
      }
      if (studentReport.company_id !== companyId) {
        throw new BadRequestException('Student report does not belong to your company');
      }
    }

    // If teacher_id is being updated, verify it belongs to the same company
    if (dto.teacher_id !== undefined && dto.teacher_id !== null) {
      const teacher = await this.teacherRepo.findOne({
        where: { id: dto.teacher_id, company_id: companyId, status: Not(-2) },
      });
      if (!teacher) {
        throw new NotFoundException(`Teacher with ID ${dto.teacher_id} not found or does not belong to your company`);
      }
    }

    // If course_id is being updated, verify it belongs to the same company
    if (dto.course_id !== undefined && dto.course_id !== null) {
      const course = await this.courseRepo.findOne({
        where: { id: dto.course_id, company_id: companyId, status: Not(-2) },
      });
      if (!course) {
        throw new NotFoundException(`Course with ID ${dto.course_id} not found or does not belong to your company`);
      }
    }

    const merged = this.repo.merge(existing, dto);
    await this.repo.save(merged);
    return this.findOne(id, companyId);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const existing = await this.findOne(id, companyId);
    existing.status = -2;
    await this.repo.save(existing);
  }
}
