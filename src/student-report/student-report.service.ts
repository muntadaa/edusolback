import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { CreateStudentReportDto } from './dto/create-student-report.dto';
import { UpdateStudentReportDto } from './dto/update-student-report.dto';
import { StudentReport } from './entities/student-report.entity';
import { StudentReportQueryDto } from './dto/student-report-query.dto';
import { PaginatedResponseDto, PaginationMetaDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { Student } from '../students/entities/student.entity';
import { SchoolYearPeriod } from '../school-year-periods/entities/school-year-period.entity';
import { SchoolYear } from '../school-years/entities/school-year.entity';
import { ReportDashboardQueryDto } from './dto/report-dashboard-query.dto';
import { ClassStudent } from '../class-student/entities/class-student.entity';
import { StudentsPlanning } from '../students-plannings/entities/students-planning.entity';
import { StudentPresence } from '../studentpresence/entities/studentpresence.entity';

@Injectable()
export class StudentReportService {
  constructor(
    @InjectRepository(StudentReport)
    private readonly repo: Repository<StudentReport>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(SchoolYearPeriod)
    private readonly periodRepo: Repository<SchoolYearPeriod>,
    @InjectRepository(SchoolYear)
    private readonly schoolYearRepo: Repository<SchoolYear>,
    @InjectRepository(ClassStudent)
    private readonly classStudentRepo: Repository<ClassStudent>,
    @InjectRepository(StudentsPlanning)
    private readonly planningRepo: Repository<StudentsPlanning>,
    @InjectRepository(StudentPresence)
    private readonly presenceRepo: Repository<StudentPresence>,
  ) {}

  async create(dto: CreateStudentReportDto, companyId: number): Promise<StudentReport> {
    // Verify student exists and belongs to the same company
    const student = await this.studentRepo.findOne({
      where: { id: dto.student_id, company_id: companyId, status: Not(-2) },
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${dto.student_id} not found or does not belong to your company`);
    }

    // Verify school year exists and belongs to the same company
    const schoolYear = await this.schoolYearRepo.findOne({
      where: { id: dto.school_year_id, status: Not(-2) },
      relations: ['company'],
    });
    if (!schoolYear) {
      throw new NotFoundException(`School year with ID ${dto.school_year_id} not found`);
    }
    if (schoolYear.company?.id !== companyId) {
      throw new BadRequestException('School year does not belong to your company');
    }

    // Verify school year period exists, belongs to the same company, and matches the provided year
    const period = await this.periodRepo.findOne({
      where: { id: dto.school_year_period_id, company_id: companyId, status: Not(-2) },
    });
    if (!period) {
      throw new NotFoundException(`School year period with ID ${dto.school_year_period_id} not found or does not belong to your company`);
    }
    if (period.school_year_id !== dto.school_year_id) {
      throw new BadRequestException('School year period does not belong to the provided school year');
    }

    const entity = this.repo.create({
      ...dto,
      passed: dto.passed ?? false,
      status: dto.status ?? 2,
      company_id: companyId,
    });

    const saved = await this.repo.save(entity);
    return this.findOne(saved.id, companyId);
  }

  async findAll(query: StudentReportQueryDto, companyId: number): Promise<PaginatedResponseDto<StudentReport>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.repo
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.student', 'student')
      .leftJoinAndSelect('report.period', 'period')
      .leftJoinAndSelect('report.year', 'year')
      .orderBy('report.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    qb.andWhere('report.status <> :deletedStatus', { deletedStatus: -2 });
    qb.andWhere('report.company_id = :company_id', { company_id: companyId });

    if (query.status !== undefined) {
      qb.andWhere('report.status = :status', { status: query.status });
    }

    if (query.student_id) {
      qb.andWhere('report.student_id = :student_id', { student_id: query.student_id });
    }

    if (query.school_year_period_id) {
      qb.andWhere('report.school_year_period_id = :school_year_period_id', {
        school_year_period_id: query.school_year_period_id,
      });
    }

    if (query.passed !== undefined) {
      qb.andWhere('report.passed = :passed', { passed: query.passed });
    }

    if (query.school_year_id) {
      qb.andWhere('report.school_year_id = :school_year_id', { school_year_id: query.school_year_id });
    }

    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<StudentReport> {
    const found = await this.repo
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.student', 'student')
      .leftJoinAndSelect('report.period', 'period')
      .leftJoinAndSelect('report.year', 'year')
      .where('report.id = :id', { id })
      .andWhere('report.company_id = :companyId', { companyId })
      .andWhere('report.status <> :deletedStatus', { deletedStatus: -2 })
      .getOne();
    
    if (!found) {
      throw new NotFoundException('Student report not found');
    }
    return found;
  }

  async update(id: number, dto: UpdateStudentReportDto, companyId: number): Promise<StudentReport> {
    const existing = await this.findOne(id, companyId);

    // If student_id is being updated, verify it belongs to the same company
    if (dto.student_id !== undefined) {
      const student = await this.studentRepo.findOne({
        where: { id: dto.student_id, company_id: companyId, status: Not(-2) },
      });
      if (!student) {
        throw new NotFoundException(`Student with ID ${dto.student_id} not found or does not belong to your company`);
      }
    }

    // If school_year_id is being updated, verify it belongs to the same company
    if (dto.school_year_id !== undefined) {
      const schoolYear = await this.schoolYearRepo.findOne({
        where: { id: dto.school_year_id, status: Not(-2) },
        relations: ['company'],
      });
      if (!schoolYear) {
        throw new NotFoundException(`School year with ID ${dto.school_year_id} not found`);
      }
      if (schoolYear.company?.id !== companyId) {
        throw new BadRequestException('School year does not belong to your company');
      }
    }

    // If school_year_period_id is being updated, verify it belongs to the same company
    if (dto.school_year_period_id !== undefined) {
      const period = await this.periodRepo.findOne({
        where: { id: dto.school_year_period_id, company_id: companyId, status: Not(-2) },
      });
      if (!period) {
        throw new NotFoundException(`School year period with ID ${dto.school_year_period_id} not found or does not belong to your company`);
      }
      const targetYearId = dto.school_year_id ?? existing.school_year_id;
      if (targetYearId && period.school_year_id !== targetYearId) {
        throw new BadRequestException('School year period does not belong to the provided school year');
      }
    }

    if (dto.school_year_id !== undefined && dto.school_year_period_id === undefined) {
      // Ensure current period still matches the new year
      const period = await this.periodRepo.findOne({
        where: { id: existing.school_year_period_id, company_id: companyId, status: Not(-2) },
      });
      if (period && period.school_year_id !== dto.school_year_id) {
        throw new BadRequestException('Existing school year period does not belong to the new school year');
      }
    }

    const merged = this.repo.merge(existing, dto);
    merged.company_id = companyId;
    await this.repo.save(merged);
    return this.findOne(id, companyId);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const existing = await this.findOne(id, companyId);
    existing.status = -2;
    await this.repo.save(existing);
  }

  async getDashboard(query: ReportDashboardQueryDto, companyId: number): Promise<{
    filters: Record<string, unknown>;
    students: Array<{ student_id: number; student: Student; report?: StudentReport | null }>;
    studentsPagination?: PaginationMetaDto;
    sessions: StudentsPlanning[];
    presences: StudentPresence[];
  }> {
    const {
      class_id,
      school_year_id,
      school_year_period_id,
      period_label,
      student_id,
      course_id,
      teacher_id,
      page,
      limit,
    } = query;

    const schoolYear = await this.schoolYearRepo.findOne({
      where: { id: school_year_id, status: Not(-2) },
      relations: ['company'],
    });
    if (!schoolYear) {
      throw new NotFoundException(`School year with ID ${school_year_id} not found`);
    }
    if (schoolYear.company?.id !== companyId) {
      throw new BadRequestException('School year does not belong to your company');
    }

    const period = await this.periodRepo.findOne({
      where: { id: school_year_period_id, company_id: companyId, status: Not(-2) },
    });
    if (!period) {
      throw new NotFoundException(`School year period with ID ${school_year_period_id} not found or does not belong to your company`);
    }
    if (period.school_year_id !== school_year_id) {
      throw new BadRequestException('School year period does not belong to the provided school year');
    }

    const effectivePeriodLabel = period_label ?? period.title;

    const studentsQb = this.classStudentRepo
      .createQueryBuilder('classStudent')
      .leftJoinAndSelect('classStudent.student', 'student')
      .where('classStudent.class_id = :classId', { classId: class_id })
      .andWhere('classStudent.status <> :deleted', { deleted: -2 })
      .andWhere('student.status <> :studentDeleted', { studentDeleted: -2 })
      .andWhere('student.company_id = :companyId', { companyId });

    if (student_id) {
      studentsQb.andWhere('classStudent.student_id = :studentId', { studentId: student_id });
    }

    const shouldPaginateStudents = limit !== undefined || page !== undefined;
    const safePage = Math.max(page ?? 1, 1);
    const safeLimit = Math.min(Math.max(limit ?? 25, 1), 100);

    let classStudents: ClassStudent[];
    let totalStudents: number;

    if (shouldPaginateStudents) {
      [classStudents, totalStudents] = await studentsQb
        .orderBy('student.last_name', 'ASC')
        .addOrderBy('student.first_name', 'ASC')
        .skip((safePage - 1) * safeLimit)
        .take(safeLimit)
        .getManyAndCount();
    } else {
      classStudents = await studentsQb.orderBy('student.last_name', 'ASC').addOrderBy('student.first_name', 'ASC').getMany();
      totalStudents = classStudents.length;
    }
    const studentIds = classStudents.map(cs => cs.student_id);

    const reportMap = new Map<number, StudentReport>();
    if (studentIds.length > 0) {
      const reports = await this.repo.find({
        where: {
          student_id: In(studentIds),
          school_year_id,
          school_year_period_id,
          status: Not(-2),
        },
      });
      reports.forEach(report => {
        reportMap.set(report.student_id, report);
      });
    }

    const studentsPayload = classStudents.map(cs => ({
      student_id: cs.student_id,
      student: cs.student,
      report: reportMap.get(cs.student_id) ?? null,
    }));

    const sessionsQb = this.planningRepo
      .createQueryBuilder('planning')
      .leftJoinAndSelect('planning.course', 'course')
      .leftJoinAndSelect('planning.teacher', 'teacher')
      .leftJoinAndSelect('planning.classRoom', 'classRoom')
      .leftJoinAndSelect('planning.planningSessionType', 'sessionType')
      .where('planning.class_id = :classId', { classId: class_id })
      .andWhere('planning.status <> :deleted', { deleted: -2 })
      .andWhere('planning.company_id = :companyId', { companyId });
    
    // Match by school_year_id if set in planning, or if NULL try to match by period string
    // This handles both cases: planning with school_year_id set, and legacy planning with only period string
    sessionsQb.andWhere(
      '(planning.school_year_id = :schoolYearId OR (planning.school_year_id IS NULL AND planning.period = :periodLabel))',
      { schoolYearId: school_year_id, periodLabel: effectivePeriodLabel }
    );

    if (course_id) {
      sessionsQb.andWhere('planning.course_id = :courseId', { courseId: course_id });
    }

    if (teacher_id) {
      sessionsQb.andWhere('planning.teacher_id = :teacherId', { teacherId: teacher_id });
    }

    const sessions = await sessionsQb.orderBy('planning.date_day', 'ASC').addOrderBy('planning.hour_start', 'ASC').getMany();

    const presencesQb = this.presenceRepo
      .createQueryBuilder('presence')
      .innerJoinAndSelect('presence.studentPlanning', 'presencePlanning')
      .leftJoinAndSelect('presence.student', 'presenceStudent')
      .leftJoinAndSelect('presencePlanning.course', 'presenceCourse')
      .leftJoinAndSelect('presencePlanning.teacher', 'presenceTeacher')
      .where('presence.company_id = :companyId', { companyId })
      .andWhere('presence.status <> :deleted', { deleted: -2 })
      .andWhere('presence.note > :minNote', { minNote: -1 })
      .andWhere('presencePlanning.class_id = :classId', { classId: class_id });
    
    // Match by school_year_id if set in planning, or if NULL try to match by period string
    presencesQb.andWhere(
      '(presencePlanning.school_year_id = :schoolYearId OR (presencePlanning.school_year_id IS NULL AND presencePlanning.period = :periodLabel))',
      { schoolYearId: school_year_id, periodLabel: effectivePeriodLabel }
    );

    if (student_id) {
      presencesQb.andWhere('presence.student_id = :presenceStudentId', { presenceStudentId: student_id });
    }

    if (course_id) {
      presencesQb.andWhere('presencePlanning.course_id = :presenceCourseId', { presenceCourseId: course_id });
    }

    if (teacher_id) {
      presencesQb.andWhere('presencePlanning.teacher_id = :presenceTeacherId', { presenceTeacherId: teacher_id });
    }

    const presences = await presencesQb.orderBy('presencePlanning.date_day', 'ASC').addOrderBy('presencePlanning.hour_start', 'ASC').getMany();

    return {
      filters: {
        class_id,
        school_year_id,
        school_year_period_id,
        period_label: effectivePeriodLabel,
        student_id: student_id ?? null,
        course_id: course_id ?? null,
        teacher_id: teacher_id ?? null,
      },
      students: studentsPayload,
      studentsPagination: shouldPaginateStudents ? PaginationService.createMeta(safePage, safeLimit, totalStudents) : undefined,
      sessions,
      presences,
    };
  }
}
