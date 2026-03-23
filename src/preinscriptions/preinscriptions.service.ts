import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreatePreinscriptionDto } from './dto/create-preinscription.dto';
import { UpdatePreinscriptionDto } from './dto/update-preinscription.dto';
import { PreInscription } from './entities/preinscription.entity';
import { Company } from '../company/entities/company.entity';
import { PreinscriptionsQueryDto } from './dto/preinscriptions-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { PreInscriptionStatus } from './enums/preinscription-status.enum';
import { Level } from '../level/entities/level.entity';
import { PreInscriptionDiploma } from '../pre-inscription-diploma/entities/pre-inscription-diploma.entity';
import { PreInscriptionConversionService } from './preinscription-conversion.service';
import { canTransition } from './workflow/preinscription.workflow';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { RolePage } from '../pages/entities/role-page.entity';
import { Page } from '../pages/entities/page.entity';
import { PreinscriptionMeeting } from './entities/preinscription-meeting.entity';
import { CreatePreinscriptionMeetingDto } from './dto/create-preinscription-meeting.dto';
import { UpdatePreinscriptionMeetingDto } from './dto/update-preinscription-meeting.dto';
import { SchoolYear } from '../school-years/entities/school-year.entity';
import { Student } from '../students/entities/student.entity';
import { MailService } from '../mail/mail.service';
import { MailTemplateService } from '../mail/mail-template.service';

@Injectable()
export class PreinscriptionsService {
  private readonly logger = new Logger(PreinscriptionsService.name);

  constructor(
    @InjectRepository(PreInscription)
    private readonly repo: Repository<PreInscription>,
    @InjectRepository(PreinscriptionMeeting)
    private readonly meetingRepo: Repository<PreinscriptionMeeting>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(Level)
    private readonly levelRepo: Repository<Level>,
    @InjectRepository(SchoolYear)
    private readonly schoolYearRepo: Repository<SchoolYear>,
    @InjectRepository(PreInscriptionDiploma)
    private readonly diplomaRepo: Repository<PreInscriptionDiploma>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(RolePage)
    private readonly rolePageRepo: Repository<RolePage>,
    @InjectRepository(Page)
    private readonly pageRepo: Repository<Page>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly mailService: MailService,
    private readonly mailTemplateService: MailTemplateService,
    private readonly conversionService: PreInscriptionConversionService,
  ) {}

  private validateBirthDateNotFuture(birthDate?: string | Date | null): void {
    if (!birthDate) {
      return;
    }

    const parsed = birthDate instanceof Date ? birthDate : new Date(birthDate);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('birth_date is invalid');
    }

    // Compare by day only to allow any time component on the same day.
    const birthDay = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime();
    const today = new Date();
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    if (birthDay > todayDay) {
      throw new BadRequestException('birth_date cannot be in the future');
    }
  }

  private async resolveCompanyByPublicToken(publicToken: string): Promise<Company> {
    const company = await this.companyRepo.findOne({
      where: { publicToken, status: Not(-2) },
    });
    if (!company) {
      throw new NotFoundException('Company not found for the provided public token');
    }
    return company;
  }

  async create(createPreinscriptionDto: CreatePreinscriptionDto): Promise<PreInscription> {
    this.validateBirthDateNotFuture(createPreinscriptionDto.birth_date as any);
    const entity = this.repo.create({
      ...createPreinscriptionDto,
      status: PreInscriptionStatus.NEW,
    });
    return this.repo.save(entity);
  }

  /**
   * Public endpoint: create a pre-inscription using company publicToken.
   * Used before any user is connected.
   */
  async createForPublicToken(
    publicToken: string,
    createPreinscriptionDto: CreatePreinscriptionDto,
  ): Promise<PreInscription> {
    const company = await this.resolveCompanyByPublicToken(publicToken);
    const payload: CreatePreinscriptionDto = {
      ...createPreinscriptionDto,
      company_id: company.id,
    };
    return this.create(payload);
  }

  /**
   * Find a pre-inscription by company publicToken and student email.
   * Used to pre-fill/synchronize data when the student starts registration.
   */
  async findByPublicTokenAndEmail(
    publicToken: string,
    email: string,
  ): Promise<PreInscription> {
    const company = await this.resolveCompanyByPublicToken(publicToken);
    const preinscription = await this.repo.findOne({
      where: { company_id: company.id, email },
    });
    if (!preinscription) {
      throw new NotFoundException(
        'Pre-inscription not found for this company and email',
      );
    }
    return preinscription;
  }

  async findAll(): Promise<PreInscription[]> {
    return this.repo.find({
      order: { created_at: 'DESC' },
    });
  }

  async findAllByCompany(
    query: PreinscriptionsQueryDto,
    companyId: number,
  ): Promise<PaginatedResponseDto<PreInscription>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.repo
      .createQueryBuilder('pre')
      .where('pre.company_id = :companyId', { companyId })
      .orderBy('pre.created_at', 'DESC');

    if (query.search) {
      const search = `%${query.search}%`;
      qb.andWhere(
        '(pre.first_name LIKE :search OR pre.last_name LIKE :search OR pre.email LIKE :search OR pre.city LIKE :search OR pre.desired_formation LIKE :search)',
        { search },
      );
    }

    if (query.country) {
      qb.andWhere('pre.nationality LIKE :country', {
        country: `%${query.country}%`,
      });
    }

    if (query.city) {
      qb.andWhere('pre.city LIKE :city', { city: `%${query.city}%` });
    }

    if (query.desired_formation) {
      qb.andWhere('pre.desired_formation LIKE :desiredFormation', {
        desiredFormation: `%${query.desired_formation}%`,
      });
    }

    if (query.commercial_id !== undefined) {
      qb.andWhere('pre.commercial_id = :commercialId', {
        commercialId: query.commercial_id,
      });
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(data, page, limit, total);
  }

  async getEligibleCommercialUsers(companyId: number): Promise<
    Array<{
      id: number;
      username: string;
      email: string;
      phone: string | null;
      picture: string | null;
    }>
  > {
    const route = '/preinscriptions/commercial';

    return this.userRepo
      .createQueryBuilder('u')
      .innerJoin(UserRole, 'ur', 'ur.user_id = u.id AND ur.company_id = :companyId', {
        companyId,
      })
      .innerJoin(RolePage, 'rp', 'rp.role_id = ur.role_id AND rp.company_id = :companyId', {
        companyId,
      })
      .innerJoin(Page, 'p', 'p.id = rp.page_id AND p.route = :route', { route })
      .where('u.company_id = :companyId', { companyId })
      .andWhere('u.status <> :deletedStatus', { deletedStatus: -2 })
      .select([
        'u.id AS id',
        'u.username AS username',
        'u.email AS email',
        'u.phone AS phone',
        'u.picture AS picture',
      ])
      .distinct(true)
      .orderBy('u.username', 'ASC')
      .getRawMany();
  }

  async findOne(id: number): Promise<PreInscription> {
    const preinscription = await this.repo.findOne({ where: { id } });
    if (!preinscription) {
      throw new NotFoundException(`Pre-inscription with id ${id} not found`);
    }
    return preinscription;
  }

  async findOneByCompany(id: number, companyId: number): Promise<PreInscription> {
    const preinscription = await this.repo.findOne({
      where: { id, company_id: companyId },
    });
    if (!preinscription) {
      throw new NotFoundException(`Pre-inscription with id ${id} not found`);
    }
    return preinscription;
  }

  async findMeetingsByPreinscription(
    preinscriptionId: number,
    companyId: number,
  ): Promise<PreinscriptionMeeting[]> {
    await this.findOneByCompany(preinscriptionId, companyId);
    return this.meetingRepo.find({
      where: { preinscription_id: preinscriptionId },
      order: { meeting_at: 'DESC', created_at: 'DESC' },
    });
  }

  async createMeeting(
    preinscriptionId: number,
    companyId: number,
    dto: CreatePreinscriptionMeetingDto,
  ): Promise<PreinscriptionMeeting> {
    const pre = await this.findOneByCompany(preinscriptionId, companyId);
    const meeting = this.meetingRepo.create({
      preinscription_id: preinscriptionId,
      meeting_at: new Date(dto.meeting_at),
      meeting_notes: dto.meeting_notes ?? null,
    });
    const savedMeeting = await this.meetingRepo.save(meeting);

    // Email is best-effort: meeting creation must still succeed if SMTP/template fails.
    try {
      await this.sendMeetingScheduledEmail(pre, savedMeeting, companyId);
    } catch (error: any) {
      this.logger.error(
        `Failed to send meeting email for preinscription ${preinscriptionId}: ${error?.message ?? error}`,
      );
    }

    return savedMeeting;
  }

  private async sendMeetingScheduledEmail(
    pre: PreInscription,
    meeting: PreinscriptionMeeting,
    companyId: number,
  ): Promise<void> {
    if (!pre.email) {
      return;
    }

    const company = await this.companyRepo.findOne({
      where: { id: companyId, status: Not(-2) },
    });
    const commercialId = pre.commercial_id ?? pre.assigned_commercial_id ?? null;
    const commercial = commercialId
      ? await this.userRepo.findOne({
          where: { id: commercialId, company_id: companyId, status: Not(-2) },
        })
      : null;

    const companyName = company?.name || 'Your School';
    const commercialName = commercial?.username || 'our commercial team';
    const meetingDateTime = new Date(meeting.meeting_at).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const html = this.mailTemplateService.renderTemplate('preinscription-meeting', {
      companyName,
      studentName: `${pre.first_name} ${pre.last_name}`,
      meetingDateTime,
      commercialName,
      meetingNotes: meeting.meeting_notes || 'No additional notes.',
    });

    await this.mailService.sendMail(
      pre.email,
      `Meeting scheduled with ${companyName}`,
      html,
    );
  }

  async updateMeeting(
    preinscriptionId: number,
    meetingId: number,
    companyId: number,
    dto: UpdatePreinscriptionMeetingDto,
  ): Promise<PreinscriptionMeeting> {
    await this.findOneByCompany(preinscriptionId, companyId);
    const meeting = await this.meetingRepo.findOne({
      where: { id: meetingId, preinscription_id: preinscriptionId },
    });
    if (!meeting) {
      throw new NotFoundException(`Meeting with id ${meetingId} not found for this pre-inscription`);
    }
    if (dto.meeting_at !== undefined) meeting.meeting_at = new Date(dto.meeting_at);
    if (dto.meeting_notes !== undefined) meeting.meeting_notes = dto.meeting_notes;
    return this.meetingRepo.save(meeting);
  }

  async removeMeeting(
    preinscriptionId: number,
    meetingId: number,
    companyId: number,
  ): Promise<void> {
    await this.findOneByCompany(preinscriptionId, companyId);
    const meeting = await this.meetingRepo.findOne({
      where: { id: meetingId, preinscription_id: preinscriptionId },
    });
    if (!meeting) {
      throw new NotFoundException(`Meeting with id ${meetingId} not found for this pre-inscription`);
    }
    await this.meetingRepo.remove(meeting);
  }

  async update(
    id: number,
    updatePreinscriptionDto: UpdatePreinscriptionDto,
  ): Promise<PreInscription> {
    if (updatePreinscriptionDto.birth_date !== undefined) {
      this.validateBirthDateNotFuture(updatePreinscriptionDto.birth_date as any);
    }
    const existing = await this.findOne(id);
    const merged = this.repo.merge(existing, updatePreinscriptionDto);
    return this.repo.save(merged);
  }

  async updateByCompany(
    id: number,
    companyId: number,
    updatePreinscriptionDto: UpdatePreinscriptionDto,
  ): Promise<PreInscription> {
    if (updatePreinscriptionDto.birth_date !== undefined) {
      this.validateBirthDateNotFuture(updatePreinscriptionDto.birth_date as any);
    }
    const existing = await this.findOneByCompany(id, companyId);
    // Prevent changing company_id from payload
    const dtoWithoutCompany = { ...updatePreinscriptionDto } as any;
    delete dtoWithoutCompany.company_id;
    // Prevent creating invalid workflow jumps through the generic update endpoint for now
    delete dtoWithoutCompany.status;
    const merged = this.repo.merge(existing, dtoWithoutCompany);
    merged.company_id = companyId;
    return this.repo.save(merged);
  }

  /**
   * Commercial/admin phase: update pre-inscription "student" personal data only.
   * Prevents status/company_id changes and blocks updates outside workflow phases.
   */
  async updateStudentDataInPhase(
    id: number,
    companyId: number,
    updateDto: UpdatePreinscriptionDto,
    actorId: number,
    actorType: 'commercial' | 'admin',
  ): Promise<PreInscription> {
    const pre = await this.findOneByCompany(id, companyId);

    const allowedStatuses = actorType === 'commercial'
      ? [PreInscriptionStatus.ASSIGNED_TO_COMMERCIAL, PreInscriptionStatus.COMMERCIAL_REVIEW]
      : [PreInscriptionStatus.SENT_TO_ADMIN, PreInscriptionStatus.APPROVED];

    if (!allowedStatuses.includes(pre.status)) {
      throw new BadRequestException('Pre-inscription is not in a phase that allows student data update');
    }

    if (actorType === 'commercial') {
      // Only the assigned commercial can edit personal data
      const effectiveCommercialId = pre.assigned_commercial_id ?? pre.commercial_id;
      if (!effectiveCommercialId || effectiveCommercialId !== actorId) {
        throw new BadRequestException('You are not assigned to this pre-inscription');
      }
    }

    // Reuse existing updateByCompany but block status/company_id updates
    return this.updateByCompany(id, companyId, updateDto);
  }

  /**
   * Commercial/admin phase: set or update the pre-inscription picture (single image upload).
   */
  async setPictureInPhase(
    id: number,
    companyId: number,
    actorId: number,
    actorType: 'commercial' | 'admin',
    picturePath: string,
  ): Promise<PreInscription> {
    const pre = await this.findOneByCompany(id, companyId);

    const allowedStatuses = actorType === 'commercial'
      ? [PreInscriptionStatus.ASSIGNED_TO_COMMERCIAL, PreInscriptionStatus.COMMERCIAL_REVIEW]
      : [PreInscriptionStatus.SENT_TO_ADMIN, PreInscriptionStatus.APPROVED];

    if (!allowedStatuses.includes(pre.status)) {
      throw new BadRequestException('Pre-inscription is not in a phase that allows picture update');
    }

    if (actorType === 'commercial') {
      const effectiveCommercialId = pre.assigned_commercial_id ?? pre.commercial_id;
      if (!effectiveCommercialId || effectiveCommercialId !== actorId) {
        throw new BadRequestException('You are not assigned to this pre-inscription');
      }
    }

    pre.picture = picturePath;
    return this.repo.save(pre);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.findOne(id);
    await this.repo.remove(existing);
  }

  async removeByCompany(id: number, companyId: number): Promise<void> {
    const existing = await this.findOneByCompany(id, companyId);
    await this.repo.remove(existing);
  }

  async assignCommercial(
    preInscriptionId: number,
    commercialId: number,
  ): Promise<PreInscription> {
    const preinscription = await this.findOne(preInscriptionId);
    const commercial = await this.userRepo.findOne({
      where: {
        id: commercialId,
        company_id: preinscription.company_id,
        status: Not(-2),
      },
    });
    if (!commercial) {
      throw new NotFoundException('Commercial user not found in this company');
    }

    const hasCommercialPageAccess = await this.userHasAccessToRoute(
      commercialId,
      preinscription.company_id,
      '/preinscriptions/commercial',
    );
    if (!hasCommercialPageAccess) {
      throw new BadRequestException(
        'Selected user does not have page access to /preinscriptions/commercial',
      );
    }

    if (!canTransition(preinscription.status, PreInscriptionStatus.ASSIGNED_TO_COMMERCIAL)) {
      throw new BadRequestException(
        `Invalid status transition: ${preinscription.status} -> ${PreInscriptionStatus.ASSIGNED_TO_COMMERCIAL}`,
      );
    }
    preinscription.commercial_id = commercialId;
    preinscription.status = PreInscriptionStatus.ASSIGNED_TO_COMMERCIAL;
    return this.repo.save(preinscription);
  }

  async assignCommercialBulk(
    commercialId: number,
    preinscriptionIds: number[],
    companyId: number,
  ): Promise<{
    assigned: number[];
    failed: Array<{ id: number; reason: string }>;
  }> {
    const commercial = await this.userRepo.findOne({
      where: { id: commercialId, company_id: companyId, status: Not(-2) },
    });
    if (!commercial) {
      throw new NotFoundException('Commercial user not found in this company');
    }
    const hasAccess = await this.userHasAccessToRoute(
      commercialId,
      companyId,
      '/preinscriptions/commercial',
    );
    if (!hasAccess) {
      throw new BadRequestException(
        'Selected user does not have page access to /preinscriptions/commercial',
      );
    }

    const assigned: number[] = [];
    const failed: Array<{ id: number; reason: string }> = [];

    for (const id of preinscriptionIds) {
      try {
        const pre = await this.findOne(id);
        if (pre.company_id !== companyId) {
          failed.push({ id, reason: 'Pre-inscription does not belong to your company' });
          continue;
        }
        if (!canTransition(pre.status, PreInscriptionStatus.ASSIGNED_TO_COMMERCIAL)) {
          failed.push({
            id,
            reason: `Invalid status: ${pre.status} (must be NEW or ASSIGNED_TO_COMMERCIAL to assign)`,
          });
          continue;
        }
        pre.commercial_id = commercialId;
        pre.status = PreInscriptionStatus.ASSIGNED_TO_COMMERCIAL;
        await this.repo.save(pre);
        assigned.push(id);
      } catch (err: any) {
        failed.push({
          id,
          reason: err?.message ?? 'Unknown error',
        });
      }
    }

    return { assigned, failed };
  }

  private async userHasAccessToRoute(
    userId: number,
    companyId: number,
    route: string,
  ): Promise<boolean> {
    const page = await this.pageRepo.findOne({ where: { route } });
    if (!page) {
      return false;
    }

    const roleAssignments = await this.userRoleRepo.find({
      where: { user_id: userId, company_id: companyId },
    });
    if (roleAssignments.length === 0) {
      return false;
    }

    const roleIds = roleAssignments.map((x) => x.role_id);
    return this.rolePageRepo
      .createQueryBuilder('rp')
      .where('rp.page_id = :pageId', { pageId: page.id })
      .andWhere('rp.company_id = :companyId', { companyId })
      .andWhere('rp.role_id IN (:...roleIds)', { roleIds })
      .getExists();
  }

  async updateCommercialEvaluation(
    id: number,
    dto: {
      commercial_comment?: string | null;
      proposed_program_id?: number | null;
      proposed_specialization_id?: number | null;
      proposed_level_id?: number | null;
      proposed_school_year_id?: number | null;
    },
  ): Promise<PreInscription> {
    const preinscription = await this.findOne(id);
    if (!canTransition(preinscription.status, PreInscriptionStatus.COMMERCIAL_REVIEW)) {
      throw new BadRequestException(
        `Invalid status transition: ${preinscription.status} -> ${PreInscriptionStatus.COMMERCIAL_REVIEW}`,
      );
    }

    if (dto.commercial_comment !== undefined) {
      preinscription.commercial_comment = dto.commercial_comment;
    }
    if (dto.proposed_program_id !== undefined) {
      preinscription.proposed_program_id = dto.proposed_program_id;
    }
    if (dto.proposed_specialization_id !== undefined) {
      preinscription.proposed_specialization_id = dto.proposed_specialization_id;
    }
    if (dto.proposed_level_id !== undefined) {
      preinscription.proposed_level_id = dto.proposed_level_id;
    }
    if (dto.proposed_school_year_id !== undefined) {
      preinscription.proposed_school_year_id = dto.proposed_school_year_id;
    }

    if (!preinscription.proposed_program_id) {
      throw new BadRequestException(
        'proposed_program_id is required before moving to COMMERCIAL_REVIEW',
      );
    }
    if (!preinscription.proposed_specialization_id) {
      throw new BadRequestException(
        'proposed_specialization_id is required before moving to COMMERCIAL_REVIEW',
      );
    }
    if (!preinscription.proposed_level_id) {
      throw new BadRequestException(
        'proposed_level_id is required before moving to COMMERCIAL_REVIEW',
      );
    }

    preinscription.status = PreInscriptionStatus.COMMERCIAL_REVIEW;
    return this.repo.save(preinscription);
  }

  async submitToAdministration(id: number): Promise<PreInscription> {
    const preinscription = await this.findOne(id);
    if (!canTransition(preinscription.status, PreInscriptionStatus.SENT_TO_ADMIN)) {
      throw new BadRequestException(
        `Invalid status transition: ${preinscription.status} -> ${PreInscriptionStatus.SENT_TO_ADMIN}`,
      );
    }

    const proposedLevelId = preinscription.proposed_level_id;
    if (!proposedLevelId) {
      throw new BadRequestException('proposed_level_id is required before submitting to administration');
    }

    const proposedSchoolYearId = preinscription.proposed_school_year_id;
    if (!proposedSchoolYearId) {
      throw new BadRequestException('proposed_school_year_id is required before submitting to administration');
    }

    const level = await this.levelRepo.findOne({
      where: {
        id: proposedLevelId,
        company_id: preinscription.company_id,
        status: Not(-2),
      },
    });
    if (!level) {
      throw new BadRequestException(`proposed_level_id ${proposedLevelId} is invalid`);
    }

    const schoolYear = await this.schoolYearRepo.findOne({
      where: {
        id: proposedSchoolYearId,
        company_id: preinscription.company_id,
        status: Not(-2),
      },
    });
    if (!schoolYear) {
      throw new BadRequestException(`proposed_school_year_id ${proposedSchoolYearId} is invalid`);
    }

    const diplomaCount = await this.diplomaRepo.count({
      where: { preinscription_id: preinscription.id },
    });
    if (diplomaCount < 1) {
      throw new BadRequestException('At least one diploma is required before submitting to administration');
    }

    const meetingCount = await this.meetingRepo.count({
      where: { preinscription_id: preinscription.id },
    });
    if (meetingCount < 1) {
      throw new BadRequestException('At least one meeting is required before submitting to administration');
    }

    preinscription.status = PreInscriptionStatus.SENT_TO_ADMIN;
    return this.repo.save(preinscription);
  }

  async adminDecision(
    id: number,
    decisionDto: {
      approved: boolean;
      final_program_id?: number | null;
      final_specialization_id?: number | null;
      final_level_id?: number | null;
      final_school_year_id?: number | null;
      admin_comment?: string | null;
    },
  ): Promise<PreInscription> {
    const preinscription = await this.findOne(id);
    const targetStatus = decisionDto.approved
      ? PreInscriptionStatus.APPROVED
      : PreInscriptionStatus.REJECTED;
    if (!canTransition(preinscription.status, targetStatus)) {
      throw new BadRequestException(
        `Invalid status transition: ${preinscription.status} -> ${targetStatus}`,
      );
    }

    if (decisionDto.final_program_id !== undefined) {
      preinscription.final_program_id = decisionDto.final_program_id;
    }
    if (decisionDto.final_specialization_id !== undefined) {
      preinscription.final_specialization_id = decisionDto.final_specialization_id;
    }
    if (decisionDto.final_level_id !== undefined) {
      preinscription.final_level_id = decisionDto.final_level_id;
    }
    if (decisionDto.final_school_year_id !== undefined) {
      preinscription.final_school_year_id = decisionDto.final_school_year_id;
    }
    if (decisionDto.admin_comment !== undefined) {
      preinscription.admin_comment = decisionDto.admin_comment;
    }

    // For approval, validate all blockers BEFORE saving status.
    if (decisionDto.approved) {
      if (!preinscription.final_level_id) {
        throw new BadRequestException('final_level_id is required to approve a pre-inscription');
      }
      if (!preinscription.final_school_year_id) {
        throw new BadRequestException('final_school_year_id is required to approve a pre-inscription');
      }

      const existingStudent = await this.studentRepo.findOne({
        where: {
          email: preinscription.email,
          company_id: preinscription.company_id,
          status: Not(-2),
        },
      });
      if (existingStudent) {
        throw new BadRequestException(
          `A student with email ${preinscription.email} already exists`,
        );
      }
    }

    preinscription.status = targetStatus;

    preinscription.decision_at = new Date();
    await this.repo.save(preinscription);

    if (decisionDto.approved) {
      await this.conversionService.convertToStudent(id);
      return this.findOne(id);
    }

    return this.findOne(id);
  }

  /**
   * Synchronize a pre-inscription into the students/users tables.
   * Behaves like creating a new student: uses StudentsService.create under the hood.
   * Throws if student/user with this email already exists for the company.
   */
  async syncToStudent(preinscriptionId: number, companyIdFromUser: number) {
    const pre = await this.findOne(preinscriptionId);

    if (pre.company_id !== companyIdFromUser) {
      throw new BadRequestException(
        'Pre-inscription does not belong to your company',
      );
    }

    return this.conversionService.convertToStudent(preinscriptionId);
  }

  /**
   * Synchronize multiple pre-inscriptions into students/users in one call.
   * Returns per-ID status: created, skipped_existing, or error.
   */
  async syncManyToStudents(ids: number[], companyIdFromUser: number) {
    const results: {
      id: number;
      status: 'created' | 'skipped_existing' | 'error';
      message?: string;
      student?: any;
    }[] = [];

    for (const id of ids) {
      try {
        const student = await this.syncToStudent(id, companyIdFromUser);
        results.push({ id, status: 'created', student });
      } catch (error: any) {
        // If student/user already exists, mark as skipped but do not fail the whole batch
        if (error instanceof BadRequestException) {
          results.push({
            id,
            status: 'skipped_existing',
            message: error.message,
          });
          continue;
        }
        results.push({
          id,
          status: 'error',
          message: error?.message ?? 'Unknown error',
        });
      }
    }

    return results;
  }
}
