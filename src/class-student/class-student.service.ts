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
import { Program } from '../programs/entities/program.entity';
import { Specialization } from '../specializations/entities/specialization.entity';
import { Level } from '../level/entities/level.entity';
import { SchoolYear } from '../school-years/entities/school-year.entity';

@Injectable()
export class ClassStudentService {
  constructor(
    @InjectRepository(ClassStudent)
    private readonly repo: Repository<ClassStudent>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,
    @InjectRepository(Specialization)
    private readonly specializationRepo: Repository<Specialization>,
    @InjectRepository(Level)
    private readonly levelRepo: Repository<Level>,
    @InjectRepository(SchoolYear)
    private readonly schoolYearRepo: Repository<SchoolYear>,
    private readonly studentAccountingService: StudentAccountingService,
  ) {}

  /**
   * Ensure a student is not already assigned to another class *in the same school year*.
   * Allows assigning the same student to different classes across different school years.
   */
  private async ensureStudentAssignable(
    studentId: number,
    classId: number | null | undefined,
    companyId: number,
    excludeId?: number,
    explicitSchoolYearId?: number | null,
  ): Promise<void> {
    if (!studentId) return;

    const schoolYearId =
      explicitSchoolYearId ??
      (classId
        ? (
            await this.classRepo.findOne({
              where: { id: classId, company_id: companyId, status: Not(-2) },
            })
          )?.school_year_id
        : null);

    if (!schoolYearId) {
      throw new BadRequestException('school_year_id is required to assign a student');
    }

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

  private async validateAcademicContext(
    programId: number,
    specializationId: number,
    levelId: number,
    schoolYearId: number,
    companyId: number,
  ): Promise<void> {
    const [program, specialization, level, schoolYear] = await Promise.all([
      this.programRepo.findOne({ where: { id: programId, company_id: companyId, status: Not(-2) } as any }),
      this.specializationRepo.findOne({ where: { id: specializationId, company_id: companyId, status: Not(-2) } as any }),
      this.levelRepo.findOne({ where: { id: levelId, company_id: companyId, status: Not(-2) } as any }),
      this.schoolYearRepo.findOne({ where: { id: schoolYearId, company_id: companyId, status: Not(-2) } as any }),
    ]);

    if (!program) throw new BadRequestException('Program not found or does not belong to your company');
    if (!specialization) throw new BadRequestException('Specialization not found or does not belong to your company');
    if (!level) throw new BadRequestException('Level not found or does not belong to your company');
    if (!schoolYear) throw new BadRequestException('School year not found or does not belong to your company');
  }

  async create(dto: CreateClassStudentDto, companyId: number): Promise<ClassStudent> {
    const hasClass = dto.class_id !== undefined && dto.class_id !== null;
    if (!hasClass) {
      if (
        dto.program_id == null ||
        dto.specialization_id == null ||
        dto.level_id == null ||
        dto.school_year_id == null
      ) {
        throw new BadRequestException(
          'When class_id is null, program_id, specialization_id, level_id and school_year_id are required',
        );
      }
      await this.validateAcademicContext(
        dto.program_id,
        dto.specialization_id,
        dto.level_id,
        dto.school_year_id,
        companyId,
      );
      await this.ensureStudentAssignable(
        dto.student_id,
        null,
        companyId,
        undefined,
        dto.school_year_id,
      );
    } else {
      await this.ensureStudentAssignable(dto.student_id, dto.class_id!, companyId);
    }

    // Always set company_id from authenticated user
    const dtoWithCompany = {
      ...dto,
      company_id: companyId,
    };

    // If class_id is provided, sync academic context from the class
    if (hasClass) {
      const cls = await this.classRepo.findOne({
        where: { id: dto.class_id!, company_id: companyId, status: Not(-2) },
      });
      if (!cls) throw new BadRequestException('Class not found or does not belong to your company');
      (dtoWithCompany as any).program_id = cls.program_id;
      (dtoWithCompany as any).specialization_id = cls.specialization_id;
      (dtoWithCompany as any).level_id = cls.level_id;
      (dtoWithCompany as any).school_year_id = cls.school_year_id;
    }

    const entity = this.repo.create(dtoWithCompany as any) as unknown as ClassStudent;

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
      .leftJoinAndSelect('cs.schoolYear', 'schoolYear')
      .leftJoinAndSelect('cs.program', 'program')
      .leftJoinAndSelect('cs.specialization', 'specialization')
      .leftJoinAndSelect('cs.level', 'level')
      .leftJoinAndSelect('cs.company', 'company');

    qb.andWhere('cs.status <> :deletedStatus', { deletedStatus: -2 });
    qb.andWhere('student.status <> :studentDeletedStatus', { studentDeletedStatus: -2 });
    qb.andWhere('(cs.class_id IS NULL OR class.status <> :classDeletedStatus)', {
      classDeletedStatus: -2,
    });
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
    if (query.school_year_id) qb.andWhere('cs.school_year_id = :school_year_id', { school_year_id: query.school_year_id });

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
      .leftJoinAndSelect('cs.schoolYear', 'schoolYear')
      .leftJoinAndSelect('cs.program', 'program')
      .leftJoinAndSelect('cs.specialization', 'specialization')
      .leftJoinAndSelect('cs.level', 'level')
      .leftJoinAndSelect('cs.company', 'company')
      .where('cs.id = :id', { id })
      .andWhere('cs.company_id = :companyId', { companyId })
      .andWhere('cs.status <> :deletedStatus', { deletedStatus: -2 })
      .andWhere('student.status <> :studentDeletedStatus', { studentDeletedStatus: -2 })
      .andWhere('(cs.class_id IS NULL OR class.status <> :classDeletedStatus)', {
        classDeletedStatus: -2,
      })
      .getOne();

    if (!found) {
      throw new NotFoundException('Class student assignment not found');
    }

    if (
      !found.student ||
      found.student.status === -2 ||
      (found.class_id !== null && (!found.class || found.class.status === -2))
    ) {
      throw new NotFoundException('Class student assignment not found');
    }

    return found;
  }

  async update(id: number, dto: UpdateClassStudentDto, companyId: number): Promise<ClassStudent> {
    const existing = await this.findOne(id, companyId);

    const targetStudentId = dto.student_id ?? existing.student_id;
    const targetClassId = dto.class_id !== undefined ? (dto.class_id as any) : existing.class_id;
    const targetSchoolYearId =
      dto.school_year_id !== undefined ? (dto.school_year_id as any) : existing.school_year_id;

    // Only re-check assignability if student or class is changing
    if (
      targetStudentId !== existing.student_id ||
      targetClassId !== existing.class_id
    ) {
      await this.ensureStudentAssignable(
        targetStudentId,
        targetClassId,
        companyId,
        id,
        targetClassId ? null : targetSchoolYearId,
      );
    }

    // Prevent changing company_id - always use authenticated user's company
    const dtoWithoutCompany = { ...dto };
    delete (dtoWithoutCompany as any).company_id;

    const hasClassUpdate =
      dtoWithoutCompany.class_id !== undefined && dtoWithoutCompany.class_id !== null;
    const isExplicitNullClass = dtoWithoutCompany.class_id === null;

    // If class_id is explicitly set (or changed), sync academic context from the class
    if (hasClassUpdate) {
      const cls = await this.classRepo.findOne({
        where: { id: dtoWithoutCompany.class_id as any, company_id: companyId, status: Not(-2) },
      });
      if (!cls) throw new BadRequestException('Class not found or does not belong to your company');
      (dtoWithoutCompany as any).program_id = cls.program_id;
      (dtoWithoutCompany as any).specialization_id = cls.specialization_id;
      (dtoWithoutCompany as any).level_id = cls.level_id;
      (dtoWithoutCompany as any).school_year_id = cls.school_year_id;
    }

    // If class_id is explicitly nulled, require academic context fields
    if (isExplicitNullClass) {
      const programId = (dtoWithoutCompany as any).program_id ?? existing.program_id;
      const specializationId = (dtoWithoutCompany as any).specialization_id ?? existing.specialization_id;
      const levelId = (dtoWithoutCompany as any).level_id ?? existing.level_id;
      const schoolYearId = (dtoWithoutCompany as any).school_year_id ?? existing.school_year_id;

      if (programId == null || specializationId == null || levelId == null || schoolYearId == null) {
        throw new BadRequestException(
          'When class_id is null, program_id, specialization_id, level_id and school_year_id are required',
        );
      }
      await this.validateAcademicContext(programId, specializationId, levelId, schoolYearId, companyId);
    }

    const merged = this.repo.merge(existing, dtoWithoutCompany);
    // Ensure company_id remains from authenticated user
    merged.company_id = companyId;
    merged.company = { id: companyId } as any;

    // IMPORTANT: if class_id is explicitly nulled, also null the relation.
    // Otherwise TypeORM may keep the loaded relation and persist the old FK.
    if (isExplicitNullClass) {
      (merged as any).class_id = null;
      (merged as any).class = null;
    }

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
