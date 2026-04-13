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
import { CourseNotesAggregateQueryDto } from './dto/course-notes-aggregate-query.dto';
import { ClassStudent } from '../class-student/entities/class-student.entity';
import { StudentsPlanning } from '../students-plannings/entities/students-planning.entity';
import { StudentPresence } from '../studentpresence/entities/studentpresence.entity';
import {
  StudentPresenceValidation,
  StudentPresenceValidationStatus,
} from '../student_presence_validation/entities/student_presence_validation.entity';

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

  /**
   * planning_students.id must belong to company, match class, and match school year / period label (same as list filters).
   */
  private async assertStudentPlanningMatchesReportScope(
    studentPlanningId: number,
    classId: number,
    schoolYearId: number,
    effectivePeriodLabel: string,
    companyId: number,
  ): Promise<StudentsPlanning> {
    const p = await this.planningRepo.findOne({
      where: { id: studentPlanningId, company_id: companyId, status: Not(-2) },
    });
    if (!p) {
      throw new NotFoundException(`Planning session with ID ${studentPlanningId} not found`);
    }
    if (p.class_id !== classId) {
      throw new BadRequestException('student_planning_id does not match class_id');
    }
    const yearOk =
      p.school_year_id === schoolYearId ||
      (p.school_year_id == null && p.period === effectivePeriodLabel);
    if (!yearOk) {
      throw new BadRequestException(
        'student_planning_id does not match the requested school year / period (planning.school_year_id or planning.period)',
      );
    }
    return p;
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

  /**
   * Aggregated course notes per student for the Courses & notes screen.
   * Groups by (student_id, course_id, teacher_id) — Option A: separate rows per teacher when the same course has multiple teachers.
   * Planning scope matches getDashboard (class + school year + period label on planning).
   */
  async getCourseNotesAggregates(query: CourseNotesAggregateQueryDto, companyId: number) {
    const {
      class_id,
      school_year_id,
      school_year_period_id,
      period_label,
      student_ids,
      course_ids,
      teacher_ids,
      sort,
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
      throw new NotFoundException(
        `School year period with ID ${school_year_period_id} not found or does not belong to your company`,
      );
    }
    if (period.school_year_id !== school_year_id) {
      throw new BadRequestException('School year period does not belong to the provided school year');
    }

    const effectivePeriodLabel = period_label ?? period.title;
    const deleted = -2;

    const sumNotesExpr = 'SUM(CASE WHEN sp.note > -1 THEN sp.note ELSE 0 END)';
    const gradedCountExpr = 'SUM(CASE WHEN sp.note > -1 THEN 1 ELSE 0 END)';

    const qb = this.presenceRepo
      .createQueryBuilder('sp')
      .innerJoin('sp.studentPlanning', 'p')
      .innerJoin('sp.student', 'stu')
      .innerJoin('p.course', 'c')
      .innerJoin('p.teacher', 't')
      .innerJoin(
        StudentPresenceValidation,
        'spv',
        'spv.student_presence_id = sp.id AND spv.status = :approvalStatus',
        { approvalStatus: StudentPresenceValidationStatus.APPROVED },
      )
      .innerJoin(
        ClassStudent,
        'cs',
        'cs.student_id = sp.student_id AND cs.class_id = :classId AND cs.company_id = :companyId AND cs.status <> :deleted',
      )
      .leftJoin('p.classCourse', 'cc')
      .leftJoin('cc.module', 'mo')
      .where('p.class_id = :classId', { classId: class_id })
      .andWhere('sp.company_id = :companyId', { companyId })
      .andWhere('p.company_id = :companyId')
      .andWhere('stu.company_id = :companyId')
      .andWhere('c.company_id = :companyId')
      .andWhere('t.company_id = :companyId')
      .andWhere('sp.status <> :deleted', { deleted })
      .andWhere('p.status <> :deleted')
      .andWhere(
        '(p.school_year_id = :schoolYearId OR (p.school_year_id IS NULL AND p.period = :periodLabel))',
        { schoolYearId: school_year_id, periodLabel: effectivePeriodLabel },
      );

    if (student_ids?.length) {
      qb.andWhere('sp.student_id IN (:...studentIds)', { studentIds: student_ids });
    }
    if (course_ids?.length) {
      qb.andWhere('p.course_id IN (:...courseIds)', { courseIds: course_ids });
    }
    if (teacher_ids?.length) {
      qb.andWhere('p.teacher_id IN (:...teacherIds)', { teacherIds: teacher_ids });
    }

    qb
      .select('sp.student_id', 'student_id')
      .addSelect('p.course_id', 'course_id')
      .addSelect('p.teacher_id', 'teacher_id')
      .addSelect('COUNT(sp.id)', 'session_count')
      .addSelect(sumNotesExpr, 'notes_sum')
      .addSelect(gradedCountExpr, 'graded_session_count')
      .addSelect(`CASE WHEN (${gradedCountExpr}) > 0 THEN (${sumNotesExpr}) / (${gradedCountExpr}) ELSE NULL END`, 'notes_avg')
      .addSelect('MAX(stu.first_name)', 'student_first_name')
      .addSelect('MAX(stu.last_name)', 'student_last_name')
      .addSelect('MAX(stu.picture)', 'student_picture')
      .addSelect('MAX(c.title)', 'course_title')
      .addSelect('MAX(t.first_name)', 'teacher_first_name')
      .addSelect('MAX(t.last_name)', 'teacher_last_name')
      .addSelect('MAX(cc.module_id)', 'module_id')
      .addSelect('MAX(mo.title)', 'module_title')
      .groupBy('sp.student_id')
      .addGroupBy('p.course_id')
      .addGroupBy('p.teacher_id');

    const orderParts = this.parseCourseNotesSort(sort, sumNotesExpr, gradedCountExpr);
    for (const { expr, dir } of orderParts) {
      qb.addOrderBy(expr, dir);
    }

    const raw = await qb.getRawMany();

    const rows = raw.map((r) => {
      const sessionCount = Number(r.session_count) || 0;
      const notesSum = Number(r.notes_sum) || 0;
      const graded = Number(r.graded_session_count) || 0;
      const notesAvgRaw = r.notes_avg;
      const notesAvg =
        notesAvgRaw !== null && notesAvgRaw !== undefined && String(notesAvgRaw) !== ''
          ? Number(notesAvgRaw)
          : null;

      return {
        student_id: Number(r.student_id),
        student: {
          first_name: String(r.student_first_name ?? ''),
          last_name: String(r.student_last_name ?? ''),
          picture: r.student_picture ?? null,
        },
        course_id: Number(r.course_id),
        course: {
          id: Number(r.course_id),
          title: String(r.course_title ?? ''),
          code: null as string | null,
        },
        teacher_id: Number(r.teacher_id),
        teacher: {
          id: Number(r.teacher_id),
          first_name: String(r.teacher_first_name ?? ''),
          last_name: String(r.teacher_last_name ?? ''),
        },
        module_id: r.module_id != null && r.module_id !== '' ? Number(r.module_id) : null,
        module_title: r.module_title != null && r.module_title !== '' ? String(r.module_title) : null,
        session_count: sessionCount,
        notes_sum: notesSum,
        notes_avg: graded > 0 && notesAvg !== null && !Number.isNaN(notesAvg) ? notesAvg : null,
        graded_session_count: graded,
      };
    });

    return {
      filters: {
        class_id,
        school_year_id,
        school_year_period_id,
        period_label: effectivePeriodLabel,
        student_ids: student_ids?.length ? [...student_ids] : undefined,
        course_ids: course_ids?.length ? [...course_ids] : undefined,
        teacher_ids: teacher_ids?.length ? [...teacher_ids] : undefined,
        sort: sort?.trim() || null,
        group_by: 'student_id,course_id,teacher_id',
        only_approved_presence_validation: true,
      },
      rows,
      aggregation_rules:
        'Only student_presence rows with student_presence_validation.status = approved are included. session_count = COUNT(presence rows) in group. notes_sum = SUM(note) with note <= -1 treated as 0. graded_session_count = sessions with note > -1. notes_avg = notes_sum / graded_session_count when graded_session_count > 0, else null. Planning scope matches GET /student-reports/dashboard (class, school year, period label on planning row).',
    };
  }

  private parseCourseNotesSort(
    sort: string | undefined,
    sumNotesExpr: string,
    gradedCountExpr: string,
  ): Array<{ expr: string; dir: 'ASC' | 'DESC' }> {
    const defaults: Array<{ expr: string; dir: 'ASC' | 'DESC' }> = [
      { expr: 'MAX(stu.last_name)', dir: 'ASC' },
      { expr: 'MAX(stu.first_name)', dir: 'ASC' },
      { expr: 'MAX(c.title)', dir: 'ASC' },
      { expr: 'p.teacher_id', dir: 'ASC' },
    ];
    if (!sort?.trim()) return defaults;

    const notesAvgExpr = `CASE WHEN (${gradedCountExpr}) > 0 THEN (${sumNotesExpr}) / (${gradedCountExpr}) ELSE NULL END`;

    const keyToExpr: Record<string, string | string[]> = {
      student_name: ['MAX(stu.last_name)', 'MAX(stu.first_name)'],
      course_title: 'MAX(c.title)',
      teacher_name: ['MAX(t.last_name)', 'MAX(t.first_name)'],
      session_count: 'COUNT(sp.id)',
      notes_sum: sumNotesExpr,
      notes_avg: notesAvgExpr,
    };

    const out: Array<{ expr: string; dir: 'ASC' | 'DESC' }> = [];
    for (const part of sort.split(',')) {
      const token = part.trim();
      if (!token) continue;
      const [rawKey, dirRaw] = token.split(':').map((s) => s.trim());
      const dir = dirRaw?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
      const exprs = keyToExpr[rawKey];
      if (!exprs) continue;
      if (Array.isArray(exprs)) {
        for (const e of exprs) out.push({ expr: e, dir });
      } else {
        out.push({ expr: exprs, dir });
      }
    }
    return out.length ? out : defaults;
  }
}
