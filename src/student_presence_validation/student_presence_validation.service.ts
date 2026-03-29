import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Not, QueryFailedError, Repository } from 'typeorm';
import { StudentPresenceValidation, StudentPresenceValidationStatus } from './entities/student_presence_validation.entity';
import { StudentPresence } from '../studentpresence/entities/studentpresence.entity';
import { StudentsPlanning } from '../students-plannings/entities/students-planning.entity';
import { ClassCourse } from '../class-course/entities/class-course.entity';
import { ClassEntity } from '../class/entities/class.entity';
import { PresenceValidationQueryDto } from './dto/presence-validation-query.dto';

type ManagerLike = EntityManager | undefined;

@Injectable()
export class StudentPresenceValidationService {
  constructor(
    @InjectRepository(StudentPresenceValidation)
    private readonly repo: Repository<StudentPresenceValidation>,
    @InjectRepository(StudentPresence)
    private readonly presenceRepo: Repository<StudentPresence>,
    @InjectRepository(StudentsPlanning)
    private readonly planningRepo: Repository<StudentsPlanning>,
    @InjectRepository(ClassCourse)
    private readonly classCourseRepo: Repository<ClassCourse>,
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,
  ) {}

  private repos(manager?: ManagerLike) {
    const m = manager ?? this.repo.manager;
    return {
      validationRepo: m.getRepository(StudentPresenceValidation),
      presenceRepo: m.getRepository(StudentPresence),
      planningRepo: m.getRepository(StudentsPlanning),
      classCourseRepo: m.getRepository(ClassCourse),
      classRepo: m.getRepository(ClassEntity),
    };
  }

  async createValidationForPresence(
    presenceId: number,
    options?: { manager?: EntityManager },
  ): Promise<StudentPresenceValidation> {
    const { validationRepo, presenceRepo, planningRepo, classCourseRepo, classRepo } = this.repos(options?.manager);

    const existing = await validationRepo.findOne({
      where: { student_presence_id: presenceId },
    });
    if (existing) return existing;

    const presence = await presenceRepo.findOne({
      where: { id: presenceId, status: Not(-2) },
    });
    if (!presence) {
      throw new NotFoundException(`Student presence with ID ${presenceId} not found`);
    }

    const planning = await planningRepo.findOne({
      where: { id: presence.student_planning_id, company_id: presence.company_id, status: Not(-2) },
    });
    if (!planning) {
      throw new NotFoundException(
        `Planning session with ID ${presence.student_planning_id} not found for presence ${presenceId}`,
      );
    }

    let moduleId: number | undefined;
    if (planning.class_course_id) {
      const classCourse = await classCourseRepo.findOne({
        where: { id: planning.class_course_id, company_id: presence.company_id, status: Not(-2) },
      });
      moduleId = classCourse?.module_id;
    }

    // Fallback for sessions without class_course_id: resolve module from class level + course.
    if (!moduleId) {
      const classEntity = await classRepo.findOne({
        where: { id: planning.class_id, company_id: presence.company_id, status: Not(-2) },
      });
      if (!classEntity) {
        throw new NotFoundException(`Class with ID ${planning.class_id} not found`);
      }
      const classCourse = await classCourseRepo.findOne({
        where: {
          company_id: presence.company_id,
          level_id: classEntity.level_id,
          course_id: planning.course_id,
          status: Not(-2),
        },
      });
      moduleId = classCourse?.module_id;
    }

    if (!moduleId) {
      throw new BadRequestException(
        `Cannot create validation for presence ${presenceId}: module mapping is missing for session ${planning.id}.`,
      );
    }

    const created = validationRepo.create({
      student_presence_id: presence.id,
      student_id: presence.student_id,
      session_id: planning.id,
      course_id: planning.course_id,
      module_id: moduleId,
      class_id: planning.class_id,
      status: StudentPresenceValidationStatus.PENDING,
      validated_by: null,
      validated_at: null,
      rejection_reason: null,
    });

    try {
      return await validationRepo.save(created);
    } catch (error) {
      // Protect against concurrent requests that create the same validation row.
      if (error instanceof QueryFailedError) {
        const alreadyCreated = await validationRepo.findOne({
          where: { student_presence_id: presenceId },
        });
        if (alreadyCreated) return alreadyCreated;
      }
      throw error;
    }
  }

  async findAll(query: PresenceValidationQueryDto, companyId: number): Promise<StudentPresenceValidation[]> {
    const qb = this.repo
      .createQueryBuilder('validation')
      .innerJoinAndSelect('validation.studentPresence', 'presence')
      .where('presence.company_id = :companyId', { companyId })
      .andWhere('presence.status <> :deletedStatus', { deletedStatus: -2 })
      .orderBy('validation.created_at', 'DESC');

    const status = query.status ?? StudentPresenceValidationStatus.PENDING;
    qb.andWhere('validation.status = :status', { status });

    if (query.session_id !== undefined) {
      qb.andWhere('validation.session_id = :sessionId', { sessionId: query.session_id });
    }

    return qb.getMany();
  }

  async findOneOrFail(id: number, companyId: number): Promise<StudentPresenceValidation> {
    const found = await this.repo
      .createQueryBuilder('validation')
      .innerJoinAndSelect('validation.studentPresence', 'presence')
      .where('validation.id = :id', { id })
      .andWhere('presence.company_id = :companyId', { companyId })
      .andWhere('presence.status <> :deletedStatus', { deletedStatus: -2 })
      .getOne();

    if (!found) {
      throw new NotFoundException(`Presence validation ${id} not found`);
    }
    return found;
  }

  async approve(id: number, companyId: number, validatorUserId: number): Promise<StudentPresenceValidation> {
    const found = await this.findOneOrFail(id, companyId);
    found.status = StudentPresenceValidationStatus.APPROVED;
    found.validated_by = validatorUserId;
    found.validated_at = new Date();
    found.rejection_reason = null;
    return this.repo.save(found);
  }

  async reject(
    id: number,
    companyId: number,
    validatorUserId: number,
    rejectionReason: string,
  ): Promise<StudentPresenceValidation> {
    const found = await this.findOneOrFail(id, companyId);
    found.status = StudentPresenceValidationStatus.REJECTED;
    found.validated_by = validatorUserId;
    found.validated_at = new Date();
    found.rejection_reason = rejectionReason;
    return this.repo.save(found);
  }

  /**
   * Updates `student_presence.note` / `remarks` (canonical values) while scholarity review is still open.
   * Does not use student-presence DTO locks so notes can be corrected after teacher "Validate notes" lock.
   */
  async updatePendingNote(
    id: number,
    companyId: number,
    dto: { note?: number; remarks?: string },
  ): Promise<StudentPresenceValidation> {
    if (dto.note === undefined && dto.remarks === undefined) {
      throw new BadRequestException('Provide at least one of: note, remarks');
    }
    const found = await this.findOneOrFail(id, companyId);
    if (found.status !== StudentPresenceValidationStatus.PENDING) {
      throw new BadRequestException('Note/remarks can only be edited while validation status is pending');
    }
    const presence = await this.presenceRepo.findOne({
      where: { id: found.student_presence_id, company_id: companyId, status: Not(-2) },
    });
    if (!presence) {
      throw new NotFoundException('Linked student presence not found');
    }
    if (dto.note !== undefined) presence.note = dto.note;
    if (dto.remarks !== undefined) presence.remarks = dto.remarks;
    await this.presenceRepo.save(presence);
    return this.findOneOrFail(id, companyId);
  }
}
