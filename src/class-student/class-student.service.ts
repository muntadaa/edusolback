import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateClassStudentDto } from './dto/create-class-student.dto';
import { UpdateClassStudentDto } from './dto/update-class-student.dto';
import { ClassStudent } from './entities/class-student.entity';
import { ClassStudentQueryDto } from './dto/class-student-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { ClassEntity } from '../class/entities/class.entity';
import { StudentAccountingService } from '../student-accounting/student-accounting.service';

@Injectable()
export class ClassStudentService {
  constructor(
    @InjectRepository(ClassStudent)
    private readonly repo: Repository<ClassStudent>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
    private readonly studentAccountingService: StudentAccountingService,
  ) {}

  /**
   * Ensure a student is not already assigned to another class *in the same school year*.
   * Allows assigning the same student to different classes across different school years.
   */
  private async ensureStudentAssignable(
    studentId: number,
    classId: number,
    companyId: number,
    excludeId?: number,
  ): Promise<void> {
    if (!studentId || !classId) return;

    // Load the target class to get its school year
    const targetClass = await this.classRepo.findOne({
      where: {
        id: classId,
        company_id: companyId,
        status: Not(-2),
      },
    });

    if (!targetClass) {
      throw new BadRequestException('Class not found or does not belong to your company');
    }

    const schoolYearId = targetClass.school_year_id;

    const qb = this.repo
      .createQueryBuilder('cs')
      .innerJoin('cs.class', 'class')
      .where('cs.student_id = :studentId', { studentId })
      .andWhere('cs.company_id = :companyId', { companyId })
      .andWhere('cs.status <> :deletedStatus', { deletedStatus: -2 })
      .andWhere('class.status <> :classDeletedStatus', { classDeletedStatus: -2 })
      .andWhere('class.school_year_id = :schoolYearId', { schoolYearId });

    if (excludeId) {
      qb.andWhere('cs.id <> :excludeId', { excludeId });
    }

    const existing = await qb.getOne();
    if (existing) {
      throw new BadRequestException('Student is already assigned to a class in this school year');
    }
  }

  async create(dto: CreateClassStudentDto, companyId: number): Promise<ClassStudent> {
    await this.ensureStudentAssignable(dto.student_id, dto.class_id, companyId);

    // Always set company_id from authenticated user
    const dtoWithCompany = {
      ...dto,
      company_id: companyId,
    };

    const entity = this.repo.create(dtoWithCompany);

    try {
      const saved = await this.repo.save(entity);
      // Do NOT generate payment details here. Details are generated only when the student
      // is activated (status = 1) via PATCH /api/students/:id or set-password flow.
      return this.findOne(saved.id, companyId);
    } catch (error) {
      throw new BadRequestException('Failed to assign student to class');
    }
  }

  async findAll(query: ClassStudentQueryDto, companyId: number): Promise<PaginatedResponseDto<ClassStudent>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.repo
      .createQueryBuilder('cs')
      .leftJoinAndSelect('cs.student', 'student')
      .leftJoinAndSelect('cs.class', 'class')
      .leftJoinAndSelect('class.schoolYear', 'schoolYear')
      .leftJoinAndSelect('cs.company', 'company');

    qb.andWhere('cs.status <> :deletedStatus', { deletedStatus: -2 });
    qb.andWhere('student.status <> :studentDeletedStatus', { studentDeletedStatus: -2 });
    qb.andWhere('class.status <> :classDeletedStatus', { classDeletedStatus: -2 });
    // Always filter by company_id from authenticated user
    qb.andWhere('cs.company_id = :company_id', { company_id: companyId });

    if (query.search) {
      qb.andWhere(
        '(class.title LIKE :search OR student.first_name LIKE :search OR student.last_name LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.status !== undefined) qb.andWhere('cs.status = :status', { status: query.status });
    if (query.class_id) qb.andWhere('cs.class_id = :class_id', { class_id: query.class_id });
    if (query.student_id) qb.andWhere('cs.student_id = :student_id', { student_id: query.student_id });
    if (query.school_year_id) qb.andWhere('class.school_year_id = :school_year_id', { school_year_id: query.school_year_id });

    qb.orderBy('cs.tri', 'ASC').addOrderBy('cs.id', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<ClassStudent> {
    const found = await this.repo
      .createQueryBuilder('cs')
      .leftJoinAndSelect('cs.student', 'student')
      .leftJoinAndSelect('cs.class', 'class')
      .leftJoinAndSelect('class.schoolYear', 'schoolYear')
      .leftJoinAndSelect('cs.company', 'company')
      .where('cs.id = :id', { id })
      .andWhere('cs.company_id = :companyId', { companyId })
      .andWhere('cs.status <> :deletedStatus', { deletedStatus: -2 })
      .andWhere('student.status <> :studentDeletedStatus', { studentDeletedStatus: -2 })
      .andWhere('class.status <> :classDeletedStatus', { classDeletedStatus: -2 })
      .getOne();

    if (!found) {
      throw new NotFoundException('Class student assignment not found');
    }

    if (!found.student || found.student.status === -2 || !found.class || found.class.status === -2) {
      throw new NotFoundException('Class student assignment not found');
    }

    return found;
  }

  async update(id: number, dto: UpdateClassStudentDto, companyId: number): Promise<ClassStudent> {
    const existing = await this.findOne(id, companyId);

    const targetStudentId = dto.student_id ?? existing.student_id;
    const targetClassId = dto.class_id ?? existing.class_id;

    // Only re-check assignability if student or class is changing
    if (
      targetStudentId !== existing.student_id ||
      targetClassId !== existing.class_id
    ) {
      await this.ensureStudentAssignable(targetStudentId, targetClassId, companyId, id);
    }

    // Prevent changing company_id - always use authenticated user's company
    const dtoWithoutCompany = { ...dto };
    delete (dtoWithoutCompany as any).company_id;

    const merged = this.repo.merge(existing, dtoWithoutCompany);
    // Ensure company_id remains from authenticated user
    merged.company_id = companyId;
    merged.company = { id: companyId } as any;

    await this.repo.save(merged);
    await this.studentAccountingService.syncFromClassStudent(id, companyId);

    return this.findOne(id, companyId);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const existing = await this.findOne(id, companyId);
    await this.repo.remove(existing);
  }

  /**
   * Returns the full class assignment history for a student across all years
   * (for this company), ordered by school year then by assignment creation date.
   */
  async findHistoryForStudent(
    studentId: number,
    companyId: number,
    includeDeleted = false,
  ): Promise<
    {
      assignment_id: number;
      student_id: number;
      class_id: number;
      class_title: string | null;
      class_status: number;
      school_year_id: number;
      school_year_title: string;
      program_id: number;
      program_title: string;
      specialization_id: number;
      specialization_title: string;
      level_id: number;
      level_title: string;
      status: number;
      created_at: Date;
      ended_at: null;
    }[]
  > {
    const qb = this.repo
      .createQueryBuilder('cs')
      .innerJoin('cs.class', 'class')
      .innerJoin('class.schoolYear', 'schoolYear')
      .innerJoin('class.program', 'program')
      .innerJoin('class.specialization', 'specialization')
      .innerJoin('class.level', 'level')
      .where('cs.student_id = :studentId', { studentId })
      .andWhere('cs.company_id = :companyId', { companyId });

    if (!includeDeleted) {
      qb.andWhere('cs.status <> :deletedStatus', { deletedStatus: -2 });
      qb.andWhere('class.status <> :classDeletedStatus', {
        classDeletedStatus: -2,
      });
    }

    qb
      .orderBy('schoolYear.start_date', 'ASC')
      .addOrderBy('cs.created_at', 'ASC')
      .select([
        'cs.id AS assignment_id',
        'cs.student_id AS student_id',
        'class.id AS class_id',
        'class.title AS class_title',
        'class.status AS class_status',
        'schoolYear.id AS school_year_id',
        'schoolYear.title AS school_year_title',
        'program.id AS program_id',
        'program.title AS program_title',
        'specialization.id AS specialization_id',
        'specialization.title AS specialization_title',
        'level.id AS level_id',
        'level.title AS level_title',
        'cs.status AS status',
        'cs.created_at AS created_at',
      ]);

    const rows = await qb.getRawMany<{
      assignment_id: number;
      student_id: number;
      class_id: number;
      class_title: string | null;
      class_status: number;
      school_year_id: number;
      school_year_title: string;
      program_id: number;
      program_title: string;
      specialization_id: number;
      specialization_title: string;
      level_id: number;
      level_title: string;
      status: number;
      created_at: Date;
    }>();

    return rows.map((row) => ({
      ...row,
      ended_at: null,
    }));
  }
}
