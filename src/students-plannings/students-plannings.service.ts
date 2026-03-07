import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { CreateStudentsPlanningDto } from './dto/create-students-planning.dto';
import { UpdateStudentsPlanningDto } from './dto/update-students-planning.dto';
import { StudentsPlanning } from './entities/students-planning.entity';
import { StudentsPlanningQueryDto } from './dto/students-planning-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { Teacher } from '../teachers/entities/teacher.entity';
import { ClassEntity } from '../class/entities/class.entity';
import { ClassRoom } from '../class-rooms/entities/class-room.entity';
import { PlanningSessionType } from '../planning-session-types/entities/planning-session-type.entity';
import { SchoolYear } from '../school-years/entities/school-year.entity';
import { Course } from '../course/entities/course.entity';
import { ClassCourse } from '../class-course/entities/class-course.entity';
import { DuplicatePlanningDto, DuplicationType } from './dto/duplicate-planning.dto';
import { StudentPresence } from '../studentpresence/entities/studentpresence.entity';

/** Session status: 3 = ACTIVATED (legacy); 1 = ACTIVATED per teacher/controller spec */
export const SESSION_STATUS_ACTIVATED = 3;

/** Validation status: 0=DRAFT, 1=TEACHER_VALIDATED, 2=LOCKED (irreversible) */
export const VALIDATION_DRAFT = 0;
export const VALIDATION_TEACHER_VALIDATED = 1;
export const VALIDATION_LOCKED = 2;

@Injectable()
export class StudentsPlanningsService {
  constructor(
    @InjectRepository(StudentsPlanning)
    private readonly repo: Repository<StudentsPlanning>,
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
    @InjectRepository(ClassRoom)
    private readonly classRoomRepo: Repository<ClassRoom>,
    @InjectRepository(PlanningSessionType)
    private readonly planningSessionTypeRepo: Repository<PlanningSessionType>,
    @InjectRepository(SchoolYear)
    private readonly schoolYearRepo: Repository<SchoolYear>,
    @InjectRepository(ClassCourse)
    private readonly classCourseRepo: Repository<ClassCourse>,
    @InjectRepository(StudentPresence)
    private readonly presenceRepo: Repository<StudentPresence>,
  ) {}

  async create(dto: CreateStudentsPlanningDto, companyId: number): Promise<StudentsPlanning> {
    // Verify teacher exists and belongs to the same company
    const teacher = await this.teacherRepo.findOne({
      where: { id: dto.teacher_id, company_id: companyId, status: Not(-2) },
    });
    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${dto.teacher_id} not found or does not belong to your company`);
    }

    // Verify course exists and belongs to the same company
    const course = await this.courseRepo.findOne({
      where: { id: dto.course_id, company_id: companyId, status: Not(-2) },
    });
    if (!course) {
      throw new NotFoundException(`Course with ID ${dto.course_id} not found or does not belong to your company`);
    }

    // Verify class exists and belongs to the same company
    const classEntity = await this.classRepo.findOne({
      where: { id: dto.class_id, company_id: companyId, status: Not(-2) },
    });
    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${dto.class_id} not found or does not belong to your company`);
    }

    // Verify class room exists and belongs to the same company (if provided)
    if (dto.class_room_id !== undefined && dto.class_room_id !== null) {
      const classRoom = await this.classRoomRepo.findOne({
        where: { id: dto.class_room_id, company_id: companyId, status: Not(-2) },
      });
      if (!classRoom) {
        throw new NotFoundException(`Class room with ID ${dto.class_room_id} not found or does not belong to your company`);
      }
    }

    // Verify planning session type exists and belongs to the same company (if provided)
    if (dto.planning_session_type_id !== undefined && dto.planning_session_type_id !== null) {
      const planningSessionType = await this.planningSessionTypeRepo.findOne({
        where: { id: dto.planning_session_type_id, company_id: companyId },
      });
      if (!planningSessionType) {
        throw new NotFoundException(`Planning session type with ID ${dto.planning_session_type_id} not found or does not belong to your company`);
      }
    }

    // Verify school year exists and belongs to the same company if provided
    if (dto.school_year_id) {
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

    // Verify class course exists and belongs to the same company if provided
    if (dto.class_course_id !== undefined && dto.class_course_id !== null) {
      const classCourse = await this.classCourseRepo.findOne({
        where: { id: dto.class_course_id, company_id: companyId, status: Not(-2) },
      });
      if (!classCourse) {
        throw new NotFoundException(`Class course with ID ${dto.class_course_id} not found or does not belong to your company`);
      }
    }

    this.ensureValidTimeRange(dto.hour_start, dto.hour_end);
    
    // Check for exact duplicates (same date, time, class, teacher, course, classroom)
    await this.checkExactDuplicate(dto, undefined, companyId);
    
    // Check for overlaps (time conflicts)
    await this.ensureNoOverlap(dto, undefined, companyId);

    // Always set company_id from authenticated user; accept hasNotes or has_notes
    const hasNotes = dto.hasNotes ?? (dto as any).has_notes;
    const entity = this.repo.create({
      ...dto,
      hasNotes,
      status: dto.status ?? 2,
      company_id: companyId,
    });

    const saved = await this.repo.save(entity);
    return this.findOne(saved.id, companyId);
  }

  async findAll(query: StudentsPlanningQueryDto, companyId: number): Promise<PaginatedResponseDto<StudentsPlanning>> {
    const page = Math.max(1, query.page ?? 1);
    const order = (query.order ?? 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const qb = this.repo
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.teacher', 'teacher')
      .leftJoinAndSelect('plan.course', 'course')
      .leftJoinAndSelect('plan.class', 'class')
      .leftJoinAndSelect('plan.classRoom', 'classRoom')
      .leftJoinAndSelect('plan.company', 'company')
      .leftJoinAndSelect('plan.planningSessionType', 'planningSessionType')
      .leftJoinAndSelect('plan.schoolYear', 'schoolYear')
      .leftJoinAndSelect('plan.classCourse', 'classCourse');

    // Always filter by company_id from authenticated user
    qb.andWhere('plan.company_id = :company_id', { company_id: companyId });
    // Exclude soft-deleted records (status = -2)
    qb.andWhere('plan.status <> :deletedStatus', { deletedStatus: -2 });

    if (query.status !== undefined) qb.andWhere('plan.status = :status', { status: query.status });
    if (query.class_id) qb.andWhere('plan.class_id = :class_id', { class_id: query.class_id });
    if (query.class_room_id) qb.andWhere('plan.class_room_id = :class_room_id', { class_room_id: query.class_room_id });
    if (query.teacher_id) qb.andWhere('plan.teacher_id = :teacher_id', { teacher_id: query.teacher_id });
    if (query.course_id) qb.andWhere('plan.course_id = :course_id', { course_id: query.course_id });
    if (query.planning_session_type_id) qb.andWhere('plan.planning_session_type_id = :planning_session_type_id', { planning_session_type_id: query.planning_session_type_id });
    if (query.school_year_id) qb.andWhere('plan.school_year_id = :school_year_id', { school_year_id: query.school_year_id });
    if (query.class_course_id) qb.andWhere('plan.class_course_id = :class_course_id', { class_course_id: query.class_course_id });

    // Date range filter: when both date_day_from and date_day_to are present, restrict to that range (inclusive)
    if (query.date_day_from && query.date_day_to) {
      qb.andWhere('plan.date_day >= :date_day_from', { date_day_from: query.date_day_from });
      qb.andWhere('plan.date_day <= :date_day_to', { date_day_to: query.date_day_to });
    }

    qb.orderBy('plan.date_day', order as 'ASC' | 'DESC').addOrderBy('plan.hour_start', order as 'ASC' | 'DESC');
    
    // Apply pagination only if limit is provided, otherwise return all results
    if (query.limit !== undefined && query.limit > 0) {
      qb.skip((page - 1) * query.limit).take(query.limit);
    }

    const [data, total] = await qb.getManyAndCount();
    const limit = query.limit ?? total; // Use total as limit if not specified for proper pagination metadata
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findForPresence(
    query: StudentsPlanningQueryDto,
    companyId: number,
  ): Promise<PaginatedResponseDto<StudentsPlanning>> {
    const now = new Date();
    const today = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const fourMonthsAgoDate = new Date(now);
    fourMonthsAgoDate.setMonth(fourMonthsAgoDate.getMonth() - 4);
    const fourMonthsAgo = fourMonthsAgoDate.toISOString().slice(0, 10);
    const page = Math.max(1, query.page ?? 1);
    const order = (query.order ?? 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.repo
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.teacher', 'teacher')
      .leftJoinAndSelect('plan.course', 'course')
      .leftJoinAndSelect('plan.class', 'class')
      .leftJoinAndSelect('plan.classRoom', 'classRoom')
      .leftJoinAndSelect('plan.company', 'company')
      .leftJoinAndSelect('plan.planningSessionType', 'planningSessionType')
      .leftJoinAndSelect('plan.schoolYear', 'schoolYear')
      .leftJoinAndSelect('plan.classCourse', 'classCourse');

    qb.andWhere('plan.company_id = :company_id', { company_id: companyId });
    qb.andWhere('plan.status <> :deletedStatus', { deletedStatus: -2 });
    qb.andWhere('plan.date_day BETWEEN :from AND :to', {
      from: fourMonthsAgo,
      to: today,
    });

    if (query.status !== undefined) qb.andWhere('plan.status = :status', { status: query.status });
    if (query.class_id) qb.andWhere('plan.class_id = :class_id', { class_id: query.class_id });
    if (query.class_room_id) qb.andWhere('plan.class_room_id = :class_room_id', { class_room_id: query.class_room_id });
    if (query.teacher_id) qb.andWhere('plan.teacher_id = :teacher_id', { teacher_id: query.teacher_id });
    if (query.course_id) qb.andWhere('plan.course_id = :course_id', { course_id: query.course_id });
    if (query.planning_session_type_id) {
      qb.andWhere('plan.planning_session_type_id = :planning_session_type_id', {
        planning_session_type_id: query.planning_session_type_id,
      });
    }
    if (query.school_year_id) qb.andWhere('plan.school_year_id = :school_year_id', { school_year_id: query.school_year_id });
    if (query.class_course_id) qb.andWhere('plan.class_course_id = :class_course_id', { class_course_id: query.class_course_id });

    qb.orderBy('plan.date_day', order as 'ASC' | 'DESC').addOrderBy('plan.hour_start', order as 'ASC' | 'DESC');

    if (query.limit !== undefined && query.limit > 0) {
      qb.skip((page - 1) * query.limit).take(query.limit);
    }

    const [data, total] = await qb.getManyAndCount();
    const limit = query.limit ?? total;
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<StudentsPlanning> {
    const found = await this.repo
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.teacher', 'teacher')
      .leftJoinAndSelect('plan.course', 'course')
      .leftJoinAndSelect('plan.class', 'class')
      .leftJoinAndSelect('plan.classRoom', 'classRoom')
      .leftJoinAndSelect('plan.company', 'company')
      .leftJoinAndSelect('plan.planningSessionType', 'planningSessionType')
      .leftJoinAndSelect('plan.schoolYear', 'schoolYear')
      .leftJoinAndSelect('plan.classCourse', 'classCourse')
      .leftJoinAndSelect('classCourse.level', 'level')
      .leftJoinAndSelect('level.specialization', 'specialization')
      .leftJoinAndSelect('specialization.program', 'program')
      .leftJoinAndSelect('classCourse.module', 'module')
      .where('plan.id = :id', { id })
      .andWhere('plan.company_id = :companyId', { companyId })
      .andWhere('plan.status <> :deletedStatus', { deletedStatus: -2 })
      .getOne();
    
    if (!found) throw new NotFoundException('Planning record not found');
    return found;
  }

  async update(id: number, dto: UpdateStudentsPlanningDto, companyId: number): Promise<StudentsPlanning> {
    const existing = await this.findOne(id, companyId);

    // If teacher_id is being updated, verify it belongs to the same company
    if (dto.teacher_id !== undefined) {
      const teacher = await this.teacherRepo.findOne({
        where: { id: dto.teacher_id, company_id: companyId, status: Not(-2) },
      });
      if (!teacher) {
        throw new NotFoundException(`Teacher with ID ${dto.teacher_id} not found or does not belong to your company`);
      }
    }

    // If course_id is being updated, verify it belongs to the same company
    if (dto.course_id !== undefined) {
      const course = await this.courseRepo.findOne({
        where: { id: dto.course_id, company_id: companyId, status: Not(-2) },
      });
      if (!course) {
        throw new NotFoundException(`Course with ID ${dto.course_id} not found or does not belong to your company`);
      }
    }

    // If class_id is being updated, verify it belongs to the same company
    if (dto.class_id !== undefined) {
      const classEntity = await this.classRepo.findOne({
        where: { id: dto.class_id, company_id: companyId, status: Not(-2) },
      });
      if (!classEntity) {
        throw new NotFoundException(`Class with ID ${dto.class_id} not found or does not belong to your company`);
      }
    }

    // If class_room_id is being updated, verify it belongs to the same company (or allow null)
    if (dto.class_room_id !== undefined) {
      if (dto.class_room_id !== null) {
        const classRoom = await this.classRoomRepo.findOne({
          where: { id: dto.class_room_id, company_id: companyId, status: Not(-2) },
        });
        if (!classRoom) {
          throw new NotFoundException(`Class room with ID ${dto.class_room_id} not found or does not belong to your company`);
        }
      }
      // If null, allow it (removing the classroom assignment)
    }

    // If planning_session_type_id is being updated, verify it belongs to the same company (or allow null)
    if (dto.planning_session_type_id !== undefined) {
      if (dto.planning_session_type_id !== null) {
        const planningSessionType = await this.planningSessionTypeRepo.findOne({
          where: { id: dto.planning_session_type_id, company_id: companyId },
        });
        if (!planningSessionType) {
          throw new NotFoundException(`Planning session type with ID ${dto.planning_session_type_id} not found or does not belong to your company`);
        }
      }
      // If null, allow it (removing the session type assignment)
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

    // If class_course_id is being updated, verify it belongs to the same company (or allow null)
    if (dto.class_course_id !== undefined) {
      if (dto.class_course_id !== null) {
        const classCourse = await this.classCourseRepo.findOne({
          where: { id: dto.class_course_id, company_id: companyId, status: Not(-2) },
        });
        if (!classCourse) {
          throw new NotFoundException(`Class course with ID ${dto.class_course_id} not found or does not belong to your company`);
        }
      }
      // If null, allow it (removing the class-course reference)
    }

    const mergedPayload = {
      ...existing,
      ...dto,
    } as CreateStudentsPlanningDto & { status?: number };

    this.ensureValidTimeRange(mergedPayload.hour_start, mergedPayload.hour_end);
    
    // Check for exact duplicates (excluding current planning)
    await this.checkExactDuplicate(mergedPayload, id, companyId);
    
    // Check for overlaps (excluding current planning)
    await this.ensureNoOverlap(mergedPayload, id, companyId);

    // Prevent changing company_id - always use authenticated user's company
    const dtoWithoutCompany = { ...dto };
    delete (dtoWithoutCompany as any).company_id;
    if ((dto as any).has_notes !== undefined || dto.hasNotes !== undefined) {
      (dtoWithoutCompany as any).hasNotes = dto.hasNotes ?? (dto as any).has_notes;
    }

    // Four booleans: presence_validated_teacher, presence_validated_controleur, notes_validated_teacher, notes_validated_controleur
    const pt = dto.presence_validated_teacher ?? (dto as any).presence_validated_teacher;
    const pc = dto.presence_validated_controleur ?? (dto as any).presence_validated_controleur;
    const nt = dto.notes_validated_teacher ?? (dto as any).notes_validated_teacher;
    const nc = dto.notes_validated_controleur ?? (dto as any).notes_validated_controleur;

    const curPt = existing.presence_validated_teacher ?? false;
    const curPc = existing.presence_validated_controleur ?? false;
    const curNt = existing.notes_validated_teacher ?? false;
    const curNc = existing.notes_validated_controleur ?? false;

    // Irreversible: once true, cannot set back to false
    if (pt === false && curPt) throw new BadRequestException('presence_validated_teacher cannot be reverted to false');
    if (pc === false && curPc) throw new BadRequestException('presence_validated_controleur cannot be reverted to false');
    if (nt === false && curNt) throw new BadRequestException('notes_validated_teacher cannot be reverted to false');
    if (nc === false && curNc) throw new BadRequestException('notes_validated_controleur cannot be reverted to false');

    // Controller can set presence_validated_controleur only when presence_validated_teacher is true
    if (pc === true && !curPt && pt !== true) {
      throw new BadRequestException('presence_validated_controleur can only be set when presence_validated_teacher is true');
    }
    // Teacher can set notes_validated_teacher only when presence_validated_teacher is true
    if (nt === true && !curPt && pt !== true) {
      throw new BadRequestException('notes_validated_teacher can only be set when presence_validated_teacher is true');
    }
    // Controller can set notes_validated_controleur only when notes_validated_teacher is true
    if (nc === true && !curNt && nt !== true) {
      throw new BadRequestException('notes_validated_controleur can only be set when notes_validated_teacher is true');
    }
    // Notes validation only when session has notes
    if ((nt === true || nc === true) && !existing.hasNotes) {
      throw new BadRequestException('Notes validation is only allowed when the session has notes (has_notes === true)');
    }

    // When teacher activates presence (presence_validated_teacher: true): require at least one present, set status to 1
    if (pt === true && !curPt) {
      (dtoWithoutCompany as any).status = 1;
      const presences = await this.presenceRepo.find({
        where: { student_planning_id: id, company_id: companyId },
      });
      const atLeastOnePresent = presences.some((p) => p.presence === 'present');
      if (!atLeastOnePresent) {
        throw new BadRequestException('At least one student must be marked present before activating presence');
      }
    }

    // Legacy status fields: still accept 0/1/2 and apply same rules (optional backward compat)
    const newPresenceStatus = dto.presence_validation_status ?? (dto as any).presence_validation_status;
    const newNotesStatus = dto.notes_validation_status ?? (dto as any).notes_validation_status;
    const curPresence = existing.presence_validation_status ?? VALIDATION_DRAFT;
    const curNotes = existing.notes_validation_status ?? VALIDATION_DRAFT;
    if (newPresenceStatus !== undefined) {
      if (curPresence === VALIDATION_LOCKED && newPresenceStatus < VALIDATION_LOCKED) {
        throw new BadRequestException('Presence validation cannot be reverted from LOCKED (2)');
      }
      if (newPresenceStatus === VALIDATION_TEACHER_VALIDATED) {
        (dtoWithoutCompany as any).presence_validated_teacher = true;
        if (!(dtoWithoutCompany as any).status) (dtoWithoutCompany as any).status = 1;
        const presences = await this.presenceRepo.find({
          where: { student_planning_id: id, company_id: companyId },
        });
        if (!presences.some((p) => p.presence === 'present')) {
          throw new BadRequestException('At least one student must be marked present before activating presence');
        }
      }
      if (newPresenceStatus === VALIDATION_LOCKED) (dtoWithoutCompany as any).presence_validated_controleur = true;
    }
    if (newNotesStatus !== undefined) {
      if (curNotes === VALIDATION_LOCKED && newNotesStatus < VALIDATION_LOCKED) {
        throw new BadRequestException('Notes validation cannot be reverted from LOCKED (2)');
      }
      if (newNotesStatus === VALIDATION_TEACHER_VALIDATED) {
        if (!existing.hasNotes) throw new BadRequestException('Notes validation is only allowed when the session has notes');
        (dtoWithoutCompany as any).notes_validated_teacher = true;
      }
      if (newNotesStatus === VALIDATION_LOCKED) (dtoWithoutCompany as any).notes_validated_controleur = true;
    }

    const merged = this.repo.merge(existing, dtoWithoutCompany);
    merged.company_id = companyId;
    merged.company = { id: companyId } as any;

    // Sync legacy status from booleans for GET backward compat
    merged.presence_validation_status = merged.presence_validated_teacher && merged.presence_validated_controleur
      ? VALIDATION_LOCKED
      : merged.presence_validated_teacher
        ? VALIDATION_TEACHER_VALIDATED
        : VALIDATION_DRAFT;
    merged.notes_validation_status = merged.notes_validated_teacher && merged.notes_validated_controleur
      ? VALIDATION_LOCKED
      : merged.notes_validated_teacher
        ? VALIDATION_TEACHER_VALIDATED
        : VALIDATION_DRAFT;

    await this.repo.save(merged);

    // When presence or notes is fully locked (both booleans true), lock all presence rows
    const presenceLocked = merged.presence_validated_teacher && merged.presence_validated_controleur;
    const notesLocked = merged.notes_validated_teacher && merged.notes_validated_controleur;
    if (presenceLocked || notesLocked) {
      const presences = await this.presenceRepo.find({
        where: { student_planning_id: id, company_id: companyId },
      });
      for (const p of presences) {
        p.locked = true;
      }
      if (presences.length) await this.presenceRepo.save(presences);
    }

    return this.findOne(id, companyId);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const existing = await this.findOne(id, companyId);
    await this.repo.remove(existing);
  }

  /**
   * Session activation: lock presence and set session status to ACTIVATED.
   * Does NOT check or validate notes.
   */
  async activateSession(id: number, companyId: number): Promise<StudentsPlanning> {
    const session = await this.findOne(id, companyId);
    session.status = SESSION_STATUS_ACTIVATED;
    await this.repo.save(session);
    const presences = await this.presenceRepo.find({
      where: { student_planning_id: id, company_id: companyId },
    });
    for (const p of presences) {
      p.locked = true;
    }
    if (presences.length) await this.presenceRepo.save(presences);
    return this.findOne(id, companyId);
  }

  /**
   * Notes validation: lock all notes for this session. Only allowed when hasNotes === true.
   */
  async validateNotes(id: number, companyId: number): Promise<{ message: string }> {
    const session = await this.findOne(id, companyId);
    if (!session.hasNotes) {
      throw new BadRequestException('Notes validation is only allowed when the session has notes (hasNotes === true)');
    }
    const presences = await this.presenceRepo.find({
      where: { student_planning_id: id, company_id: companyId },
    });
    for (const p of presences) {
      p.locked = true;
    }
    if (presences.length) await this.presenceRepo.save(presences);
    return { message: 'Notes locked successfully' };
  }

  private ensureValidTimeRange(start: string, end: string): void {
    if (!start || !end) {
      throw new BadRequestException('Start and end time are required');
    }
    if (start >= end) {
      throw new BadRequestException('End time must be after start time');
    }
  }

  /**
   * Checks for exact duplicate plannings (same date, time, class, teacher, course, classroom)
   * @private
   */
  private async checkExactDuplicate(
    dto: Pick<CreateStudentsPlanningDto, 'date_day' | 'hour_start' | 'hour_end' | 'class_id' | 'class_room_id' | 'teacher_id' | 'course_id'> & {
      status?: number;
      company_id?: number;
    },
    excludeId?: number,
    companyId?: number,
  ): Promise<void> {
    const qb = this.repo
      .createQueryBuilder('plan')
      .where('plan.date_day = :date_day', { date_day: dto.date_day })
      .andWhere('plan.hour_start = :hour_start', { hour_start: dto.hour_start })
      .andWhere('plan.hour_end = :hour_end', { hour_end: dto.hour_end })
      .andWhere('plan.class_id = :class_id', { class_id: dto.class_id })
      .andWhere('plan.teacher_id = :teacher_id', { teacher_id: dto.teacher_id })
      .andWhere('plan.course_id = :course_id', { course_id: dto.course_id })
      .andWhere('plan.status <> :deletedStatus', { deletedStatus: -2 });

    // Handle nullable class_room_id
    if (dto.class_room_id !== undefined && dto.class_room_id !== null) {
      qb.andWhere('plan.class_room_id = :class_room_id', { class_room_id: dto.class_room_id });
    } else {
      qb.andWhere('plan.class_room_id IS NULL');
    }

    if (companyId) {
      qb.andWhere('plan.company_id = :company_id', { company_id: companyId });
    }

    if (excludeId) {
      qb.andWhere('plan.id <> :excludeId', { excludeId });
    }

    const duplicate = await qb.getOne();
    if (duplicate) {
      throw new BadRequestException(
        'An identical planning already exists with the same date, time, class, teacher, course, and classroom.'
      );
    }
  }

  private async ensureNoOverlap(
    dto: Pick<CreateStudentsPlanningDto, 'date_day' | 'hour_start' | 'hour_end' | 'class_id' | 'class_room_id' | 'teacher_id'> & {
      status?: number;
      company_id?: number;
    },
    excludeId?: number,
    companyId?: number,
  ): Promise<void> {
    const qb = this.repo
      .createQueryBuilder('plan')
      .where('plan.date_day = :date_day', { date_day: dto.date_day })
      .andWhere('NOT (plan.hour_end <= :start OR plan.hour_start >= :end)', {
        start: dto.hour_start,
        end: dto.hour_end,
      })
      .andWhere('plan.status <> :deletedStatus', { deletedStatus: -2 });

    // Always filter by company_id to only check overlaps within the same company
    if (companyId) {
      qb.andWhere('plan.company_id = :company_id', { company_id: companyId });
    }

    if (excludeId) {
      qb.andWhere('plan.id <> :excludeId', { excludeId });
    }

    const scopeConditions: string[] = [];
    const params: Record<string, any> = {};

    if (dto.class_id) {
      scopeConditions.push('plan.class_id = :class_id');
      params.class_id = dto.class_id;
    }
    if (dto.class_room_id) {
      scopeConditions.push('plan.class_room_id = :class_room_id');
      params.class_room_id = dto.class_room_id;
    }
    if (dto.teacher_id) {
      scopeConditions.push('plan.teacher_id = :teacher_id');
      params.teacher_id = dto.teacher_id;
    }

    if (scopeConditions.length) {
      qb.andWhere(`(${scopeConditions.join(' OR ')})`, params);
    }

    const conflict = await qb.getOne();
    if (conflict) {
      throw new BadRequestException('Planning overlaps with another session for the same class, teacher, or classroom.');
    }
  }

  /**
   * Duplicates a planning based on the specified type
   * @param dto Duplication parameters
   * @param companyId Company ID
   * @returns Created plannings and count
   */
  async duplicatePlanning(dto: DuplicatePlanningDto, companyId: number): Promise<{ message: string; created_count: number; plannings: StudentsPlanning[] }> {
    // Validate type-specific requirements
    if (dto.type === DuplicationType.WEEK) {
      if (!dto.number_of_weeks || dto.number_of_weeks < 1 || dto.number_of_weeks > 52) {
        throw new BadRequestException('number_of_weeks is required and must be between 1 and 52 for week duplication');
      }
      // Clear duration_months if accidentally sent
      delete (dto as any).duration_months;
    } else if (dto.type === DuplicationType.RECURRING) {
      if (!dto.duration_months || dto.duration_months < 1 || dto.duration_months > 24) {
        throw new BadRequestException('duration_months is required and must be between 1 and 24 for recurring duplication');
      }
      // Clear number_of_weeks if accidentally sent
      delete (dto as any).number_of_weeks;
    } else if (dto.type === DuplicationType.FREQUENCY) {
      // Clear both if accidentally sent
      delete (dto as any).number_of_weeks;
      delete (dto as any).duration_months;
    }

    // Get source planning
    const sourcePlanning = await this.findOne(dto.source_planning_id, companyId);
    
    // Get the class to retrieve level_id
    const classEntity = await this.classRepo.findOne({
      where: {
        id: sourcePlanning.class_id,
        company_id: companyId,
        status: Not(-2),
      },
    });

    if (!classEntity) {
      throw new NotFoundException('Class not found for the source planning.');
    }

    // Get ClassCourse to check frequency and allday
    // ClassCourse now uses level_id instead of class_id, and teacher_id is removed
    const classCourse = await this.classCourseRepo.findOne({
      where: {
        level_id: classEntity.level_id,
        course_id: sourcePlanning.course_id,
        company_id: companyId,
        status: Not(-2),
      },
    });

    if (!classCourse) {
      throw new NotFoundException('ClassCourse not found. Cannot determine frequency for duplication.');
    }

    const createdPlannings: StudentsPlanning[] = [];
    const sourceDate = new Date(sourcePlanning.date_day);
    const sourceDayOfWeek = sourceDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    switch (dto.type) {
      case DuplicationType.WEEK:
        if (!dto.number_of_weeks || dto.number_of_weeks < 1) {
          throw new BadRequestException('number_of_weeks is required and must be at least 1 for week duplication');
        }
        if (!classCourse.allday) {
          throw new BadRequestException('Week duplication is only available for all-day courses (allday = true)');
        }

        // Create plannings for each week (Mon-Sat, 6 days per week)
        for (let week = 0; week < dto.number_of_weeks; week++) {
          // Days: Monday (1) to Saturday (6)
          for (let dayOffset = 0; dayOffset < 6; dayOffset++) {
            const targetDate = new Date(sourceDate);
            // Calculate date: start from Monday of the week, then add week offset and day offset
            const daysFromMonday = (sourceDayOfWeek === 0 ? 6 : sourceDayOfWeek - 1); // Convert Sunday=0 to Monday=0
            targetDate.setDate(sourceDate.getDate() - daysFromMonday + (week * 7) + dayOffset);
            
            const planningData = {
              period: sourcePlanning.period,
              teacher_id: sourcePlanning.teacher_id,
              course_id: sourcePlanning.course_id,
              class_id: sourcePlanning.class_id,
              class_room_id: sourcePlanning.class_room_id,
              planning_session_type_id: sourcePlanning.planning_session_type_id,
              date_day: targetDate.toISOString().split('T')[0], // YYYY-MM-DD format
              hour_start: sourcePlanning.hour_start,
              hour_end: sourcePlanning.hour_end,
              company_id: companyId,
              school_year_id: sourcePlanning.school_year_id,
              status: sourcePlanning.status,
              is_duplicated: true,
              duplication_source_id: sourcePlanning.id,
            };

            // Check for exact duplicates and overlaps before creating
            try {
              await this.checkExactDuplicate(planningData as any, undefined, companyId);
              await this.ensureNoOverlap(planningData as any, undefined, companyId);
              const created = this.repo.create(planningData);
              const saved = await this.repo.save(created);
              createdPlannings.push(saved);
            } catch (error) {
              // Skip if duplicate or overlap exists, continue with next
              if (error instanceof BadRequestException && 
                  (error.message.includes('overlaps') || error.message.includes('identical planning'))) {
                continue;
              }
              throw error;
            }
          }
        }
        break;

      case DuplicationType.FREQUENCY:
        const frequency = classCourse.weeklyFrequency || 1;
        
        // Create placeholders (same date/time as source, frontend will update)
        for (let i = 0; i < frequency; i++) {
          const planningData = {
            period: sourcePlanning.period,
            teacher_id: sourcePlanning.teacher_id,
            course_id: sourcePlanning.course_id,
            class_id: sourcePlanning.class_id,
            class_room_id: sourcePlanning.class_room_id,
            planning_session_type_id: sourcePlanning.planning_session_type_id,
            date_day: sourcePlanning.date_day, // Same date, frontend will update
            hour_start: sourcePlanning.hour_start, // Same time, frontend will update
            hour_end: sourcePlanning.hour_end,
            company_id: companyId,
            school_year_id: sourcePlanning.school_year_id,
            status: sourcePlanning.status,
            is_duplicated: true,
            duplication_source_id: sourcePlanning.id,
          };

          const created = this.repo.create(planningData);
          const saved = await this.repo.save(created);
          createdPlannings.push(saved);
        }
        break;

      case DuplicationType.RECURRING:
        if (!dto.duration_months || dto.duration_months < 1) {
          throw new BadRequestException('duration_months is required and must be at least 1 for recurring duplication');
        }

        // Calculate end date
        const endDate = new Date(sourceDate);
        endDate.setMonth(endDate.getMonth() + dto.duration_months);

        // Create plannings for each occurrence (same day of week, same time)
        const currentDate = new Date(sourceDate);
        let occurrenceCount = 0;

        while (currentDate <= endDate) {
          // Check if current date matches the day of week
          if (currentDate.getDay() === sourceDayOfWeek) {
            const planningData = {
              period: sourcePlanning.period,
              teacher_id: sourcePlanning.teacher_id,
              course_id: sourcePlanning.course_id,
              class_id: sourcePlanning.class_id,
              class_room_id: sourcePlanning.class_room_id,
              planning_session_type_id: sourcePlanning.planning_session_type_id,
              date_day: currentDate.toISOString().split('T')[0],
              hour_start: sourcePlanning.hour_start,
              hour_end: sourcePlanning.hour_end,
              company_id: companyId,
              school_year_id: sourcePlanning.school_year_id,
              status: sourcePlanning.status,
              is_duplicated: true,
              duplication_source_id: sourcePlanning.id,
            };

            // Check for exact duplicates and overlaps before creating
            try {
              await this.checkExactDuplicate(planningData as any, undefined, companyId);
              await this.ensureNoOverlap(planningData as any, undefined, companyId);
              const created = this.repo.create(planningData);
              const saved = await this.repo.save(created);
              createdPlannings.push(saved);
              occurrenceCount++;
            } catch (error) {
              // Skip if duplicate or overlap exists, continue with next
              if (error instanceof BadRequestException && 
                  (error.message.includes('overlaps') || error.message.includes('identical planning'))) {
                currentDate.setDate(currentDate.getDate() + 7); // Skip to next week
                continue;
              }
              throw error;
            }
          }
          
          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
        break;

      default:
        throw new BadRequestException(`Invalid duplication type: ${dto.type}`);
    }

    return {
      message: `${createdPlannings.length} planning(s) created successfully`,
      created_count: createdPlannings.length,
      plannings: createdPlannings,
    };
  }
}
