import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateStudentPresenceDto } from './dto/create-studentpresence.dto';
import { UpdateStudentPresenceDto } from './dto/update-studentpresence.dto';
import { StudentPresence } from './entities/studentpresence.entity';
import { StudentPresenceQueryDto } from './dto/studentpresence-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { Student } from '../students/entities/student.entity';
import { StudentsPlanning } from '../students-plannings/entities/students-planning.entity';
import { StudentReport } from '../student-report/entities/student-report.entity';

@Injectable()
export class StudentPresenceService {
  constructor(
    @InjectRepository(StudentPresence)
    private readonly repo: Repository<StudentPresence>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(StudentsPlanning)
    private readonly planningRepo: Repository<StudentsPlanning>,
    @InjectRepository(StudentReport)
    private readonly reportRepo: Repository<StudentReport>,
  ) {}

  /**
   * Create or update presence: one row per (student_id, student_planning_id).
   * If a row already exists for this student and session, it is updated (upsert).
   * Teacher and controller share the same row; no duplicates.
   */
  async create(dto: CreateStudentPresenceDto, companyId: number): Promise<StudentPresence> {
    // Verify student exists and belongs to the same company
    const student = await this.studentRepo.findOne({
      where: { id: dto.student_id, company_id: companyId, status: Not(-2) },
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${dto.student_id} not found or does not belong to your company`);
    }

    // Verify student planning exists and belongs to the same company
    const planning = await this.planningRepo.findOne({
      where: { id: dto.student_planning_id, company_id: companyId, status: Not(-2) },
    });
    if (!planning) {
      throw new NotFoundException(`Student planning with ID ${dto.student_planning_id} not found or does not belong to your company`);
    }

    // Upsert: if a row already exists for (student_id, student_planning_id), update it instead of creating a duplicate
    const existing = await this.repo.findOne({
      where: {
        student_id: dto.student_id,
        student_planning_id: dto.student_planning_id,
        company_id: companyId,
        status: Not(-2),
      },
      relations: ['student', 'studentPlanning', 'company', 'studentReport'],
    });

    if (existing) {
      const report = dto.report_id !== undefined ? await this.validateStudentReport(dto.report_id, companyId, dto.student_id) : null;
      const updates: Partial<StudentPresence> = {
        presence: dto.presence ?? existing.presence,
        note: dto.note !== undefined ? dto.note : existing.note,
        remarks: dto.remarks !== undefined ? dto.remarks : existing.remarks,
        validate_report: dto.validate_report !== undefined ? dto.validate_report : existing.validate_report,
      };
      if (report !== null) {
        (updates as any).report_id = dto.report_id;
        (updates as any).studentReport = report;
      }
      this.repo.merge(existing, updates);
      await this.repo.save(existing);
      return this.findOne(existing.id, companyId);
    }

    const report = dto.report_id !== undefined ? await this.validateStudentReport(dto.report_id, companyId, dto.student_id) : null;

    const entity = this.repo.create({
      ...dto,
      presence: dto.presence ?? 'absent',
      note: dto.note ?? -1,
      status: dto.status ?? 2,
      company_id: companyId,
      studentReport: report ?? undefined,
      validate_report: dto.validate_report ?? false,
    });

    const saved = await this.repo.save(entity);
    return this.findOne(saved.id, companyId);
  }

  async findAll(query: StudentPresenceQueryDto, companyId: number): Promise<PaginatedResponseDto<StudentPresence>> {
    const page = query.page ?? 1;

    // Listing presence for one session must return every student row; default limit was 10
    // so students beyond the first page looked "absent" after refresh even when saved in DB.
    const forOneSession =
      query.student_planning_id !== undefined &&
      query.student_planning_id !== null &&
      Number(query.student_planning_id) > 0;

    const defaultLimit = forOneSession ? 5000 : 10;
    const maxLimit = forOneSession ? 10000 : 100;
    const rawLimit = query.limit ?? defaultLimit;
    const limit = Math.min(Math.max(1, rawLimit), maxLimit);

    const qb = this.repo
      .createQueryBuilder('presence')
      .leftJoinAndSelect('presence.student', 'student')
      .leftJoinAndSelect('presence.studentPlanning', 'studentPlanning')
      .leftJoinAndSelect('presence.company', 'company')
      .leftJoinAndSelect('presence.studentReport', 'studentReport')
      .orderBy('presence.student_id', 'ASC')
      .addOrderBy('presence.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    qb.andWhere('presence.status <> :deletedStatus', { deletedStatus: -2 });
    // Always filter by company_id from authenticated user
    qb.andWhere('presence.company_id = :company_id', { company_id: companyId });

    if (query.status !== undefined) {
      qb.andWhere('presence.status = :status', { status: query.status });
    }

    if (query.student_id) {
      qb.andWhere('presence.student_id = :student_id', { student_id: query.student_id });
    }

    if (query.student_planning_id) {
      qb.andWhere('presence.student_planning_id = :student_planning_id', {
        student_planning_id: query.student_planning_id,
      });
    }

    if (query.report_id) {
      qb.andWhere('presence.report_id = :report_id', { report_id: query.report_id });
    }

    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<StudentPresence> {
    const found = await this.repo.findOne({
      where: { id, company_id: companyId, status: Not(-2) },
      relations: ['student', 'studentPlanning', 'company', 'studentReport'],
    });
    if (!found) {
      throw new NotFoundException('Student presence record not found');
    }
    return found;
  }

  async update(id: number, dto: UpdateStudentPresenceDto, companyId: number): Promise<StudentPresence> {
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

    // If student_planning_id is being updated, verify it belongs to the same company
    if (dto.student_planning_id !== undefined) {
      const planning = await this.planningRepo.findOne({
        where: { id: dto.student_planning_id, company_id: companyId, status: Not(-2) },
      });
      if (!planning) {
        throw new NotFoundException(`Student planning with ID ${dto.student_planning_id} not found or does not belong to your company`);
      }
    }

    // If report_id is being updated, verify it belongs to the student & company
    let validatedReport: StudentReport | undefined;
    if (dto.report_id !== undefined) {
      const targetStudentId = dto.student_id ?? existing.student_id;
      validatedReport = await this.validateStudentReport(dto.report_id, companyId, targetStudentId);
    }

    // Prevent changing company_id - always use authenticated user's company
    const dtoWithoutCompany: any = { ...dto };
    delete (dtoWithoutCompany as any).company_id;
    if (validatedReport) {
      dtoWithoutCompany.studentReport = validatedReport;
    }

    const merged = this.repo.merge(existing, dtoWithoutCompany);
    // Ensure company_id remains from authenticated user
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

  private async validateStudentReport(reportId: number, companyId: number, studentId: number): Promise<StudentReport> {
    const report = await this.reportRepo.findOne({
      where: { id: reportId, status: Not(-2) },
      relations: ['student'],
    });
    if (!report || report.student?.company_id !== companyId) {
      throw new NotFoundException(`Student report with ID ${reportId} not found or does not belong to your company`);
    }
    if (report.student_id !== studentId) {
      throw new BadRequestException('The provided student report does not belong to the specified student');
    }
    return report;
  }
}
