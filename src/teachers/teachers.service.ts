import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository, QueryFailedError } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { TeachersQueryDto } from './dto/teachers-query.dto';
import { Teacher } from './entities/teacher.entity';
import { User } from '../users/entities/user.entity';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { UsersService } from '../users/users.service';
import { passwordSetTokenLookup } from '../common/utils/password-invite-token.util';
import { RolesService } from '../roles/roles.service';
import { UserRolesService } from '../user-roles/user-roles.service';
import { Student } from '../students/entities/student.entity';
import { ClassStudent } from '../class-student/entities/class-student.entity';
import { StudentsPlanning } from '../students-plannings/entities/students-planning.entity';
import { MailService } from '../mail/mail.service';
import { MAX_STUDENTS_PER_SHARE, ShareTeacherResourceDto } from './dto/share-teacher-resource.dto';
import * as path from 'path';

@Injectable()
export class TeachersService {
  private readonly logger = new Logger(TeachersService.name);

  constructor(
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(ClassStudent)
    private classStudentRepository: Repository<ClassStudent>,
    private usersService: UsersService,
    private rolesService: RolesService,
    private userRolesService: UserRolesService,
    private mailService: MailService,
  ) {}

  async create(createTeacherDto: CreateTeacherDto, companyId: number): Promise<Teacher> {
    try {
      // Check if email already exists in teachers table (excluding deleted teachers)
      const existingActiveTeacher = await this.teacherRepository.findOne({
        where: { 
          email: createTeacherDto.email, 
          company_id: companyId,
          status: Not(-2), // Exclude deleted teachers
        },
      });
      if (existingActiveTeacher) {
        throw new BadRequestException(`A teacher with email ${createTeacherDto.email} already exists`);
      }

      // Check if there's a deleted teacher with this email - if so, we'll restore it
      const deletedTeacher = await this.teacherRepository.findOne({
        where: { 
          email: createTeacherDto.email, 
          company_id: companyId,
          status: -2, // Only deleted teachers
        },
      });

      // Check if email already exists in users table (excluding deleted users)
      const existingActiveUser = await this.userRepository.findOne({
        where: { 
          email: createTeacherDto.email, 
          company_id: companyId,
          status: Not(-2), // Exclude deleted users
        },
      });
      if (existingActiveUser) {
        throw new BadRequestException(`A user with email ${createTeacherDto.email} already exists`);
      }

      // Generate unique username by trying different name combinations
      const uniqueUsername = await this.generateUniqueUsername(
        createTeacherDto.first_name,
        createTeacherDto.last_name,
        createTeacherDto.email,
        companyId
      );

      let saved: Teacher;

      if (deletedTeacher) {
        // Restore and update the deleted teacher
        this.logger.log(`Restoring deleted teacher ${deletedTeacher.id} with email ${createTeacherDto.email}`);
        Object.assign(deletedTeacher, {
          ...createTeacherDto,
          company_id: companyId,
          status: 2, // Always set to pending (2) for new/restored teachers
        });
        saved = await this.teacherRepository.save(deletedTeacher);
      } else {
        // Create new teacher - always set status to pending (2) regardless of what frontend sends
        const dtoWithCompany = {
          ...createTeacherDto,
          company_id: companyId,
          status: 2, // Always set to pending (2) - teachers become active only after setting password
        };
        // Remove class_room_id if present (no longer supported)
        delete (dtoWithCompany as any).class_room_id;
        const created = this.teacherRepository.create(dtoWithCompany);
        // Explicitly set status to ensure it's pending (overrides any default)
        created.status = 2;
        saved = await this.teacherRepository.save(created);
      }

      // Check if there's a deleted user with this email - if so, restore it
      const deletedUser = await this.userRepository.findOne({
        where: { 
          email: createTeacherDto.email, 
          company_id: companyId,
          status: -2, // Only deleted users
        },
      });

      // Create or restore user account for the teacher with 'teacher' role
      // Password will be null, status will be pending (2), and NO email will be sent automatically
      // Frontend must trigger email sending via POST /api/teachers/:id/send-password-invitation
      try {
        // Find teacher role
        const teacherRole = await this.rolesService.findByCode('teacher', companyId);
        if (!teacherRole) {
          throw new BadRequestException('Teacher role not found. Please ensure system roles are seeded.');
        }

        if (deletedUser) {
          // Restore and update the deleted user
          this.logger.log(`Restoring deleted user ${deletedUser.id} with email ${createTeacherDto.email}`);
          // Generate new token for password invitation
          const plainToken = randomBytes(32).toString('hex');
          const salt = await bcrypt.genSalt(10);
          const hashedToken = await bcrypt.hash(plainToken, salt);
          const tokenExpiresAt = new Date();
          tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24);
          
          Object.assign(deletedUser, {
            username: uniqueUsername,
            email: createTeacherDto.email,
            company_id: companyId,
            password: null,
            status: 2, // Set to pending (2)
            password_set_token: hashedToken,
            password_set_token_lookup: passwordSetTokenLookup(plainToken),
            password_set_token_expires_at: tokenExpiresAt,
          });
          const restoredUser = await this.userRepository.save(deletedUser);
          
          // Assign teacher role
          await this.userRolesService.replaceUserRoles(restoredUser.id, [teacherRole.id], companyId);
          this.logger.log(`User account restored for teacher ${saved.id} with email ${createTeacherDto.email} (status: pending)`);
        } else {
          // Create new user - NO email will be sent automatically (frontend will trigger it)
          await this.usersService.create(
            {
              username: uniqueUsername,
              email: createTeacherDto.email,
              role_ids: [teacherRole.id],
              company_id: companyId,
              password: undefined, // No password - email will be sent when frontend triggers it
              status: 2, // Set to pending (2) by default
            },
            companyId,
            false, // Don't send email automatically - frontend will trigger it via button
          );
          this.logger.log(`User account created for teacher ${saved.id} with email ${createTeacherDto.email} (status: pending, email will be sent when frontend triggers it)`);
        }
      } catch (userError: any) {
        // If user creation/restoration fails, rollback teacher creation/restoration
        this.logger.error(`Failed to create/restore user account for teacher ${saved.id}: ${userError.message}`);
        
        // If we restored a deleted teacher, mark it as deleted again
        if (deletedTeacher) {
          saved.status = -2;
          await this.teacherRepository.save(saved);
        } else {
          // If we created a new teacher, delete it
          await this.teacherRepository.remove(saved);
        }
        
        // Re-throw with a clear error message
        if (userError instanceof BadRequestException) {
          throw userError;
        }
        throw new BadRequestException(`Failed to create user account: ${userError.message}`);
      }

      return this.findOne(saved.id, companyId);
    } catch (error) {
      // Re-throw BadRequestException and NotFoundException as-is (they already have clear messages)
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      // Log the actual error for debugging
      this.logger.error('Failed to create teacher', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        createTeacherDto: { ...createTeacherDto, email: createTeacherDto.email },
        companyId,
      });

      // Handle database errors
      if (error instanceof QueryFailedError) {
        const errorMessage = error.message;
        if (errorMessage.includes('Duplicate entry')) {
          const match = errorMessage.match(/Duplicate entry '(.+?)' for key/);
          if (match) {
            throw new BadRequestException(`Duplicate entry: ${match[1]} already exists`);
          }
          throw new BadRequestException('This record already exists');
        }
        if (errorMessage.includes('foreign key constraint')) {
          throw new BadRequestException('Cannot create teacher: Invalid reference');
        }
        if (errorMessage.includes('cannot be null')) {
          throw new BadRequestException('Required field cannot be null');
        }
        if (process.env.NODE_ENV !== 'production') {
          throw new BadRequestException(`Database error: ${errorMessage}`);
        }
      }

      throw new BadRequestException('Failed to create teacher');
    }
  }

  async findAll(query: TeachersQueryDto, companyId: number): Promise<PaginatedResponseDto<Teacher>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.teacherRepository.createQueryBuilder('t')
      .leftJoinAndSelect('t.company', 'company');

    qb.andWhere('t.status <> :deletedStatus', { deletedStatus: -2 });
    // Always filter by company_id from authenticated user
    qb.andWhere('t.company_id = :company_id', { company_id: companyId });

    if (query.search) {
      qb.andWhere(
        '(t.first_name LIKE :search OR t.last_name LIKE :search OR t.email LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.status !== undefined) qb.andWhere('t.status = :status', { status: query.status });

    qb.skip((page - 1) * limit).take(limit).orderBy('t.id', 'DESC');

    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<Teacher> {
    const found = await this.teacherRepository.findOne({
      where: { id, company_id: companyId, status: Not(-2) },
      relations: ['company'],
    });
    if (!found) throw new NotFoundException('Teacher not found');
    return found;
  }

  async update(id: number, updateTeacherDto: UpdateTeacherDto, companyId: number): Promise<Teacher> {
    try {
      const existing = await this.findOne(id, companyId);

      // Prevent changing company_id - always use authenticated user's company
      const dtoWithoutCompany = { ...updateTeacherDto };
      delete (dtoWithoutCompany as any).company_id;
      // Remove class_room_id if present (no longer supported)
      delete (dtoWithoutCompany as any).class_room_id;

      const emailChanged =
        dtoWithoutCompany.email !== undefined &&
        dtoWithoutCompany.email !== null &&
        dtoWithoutCompany.email !== existing.email;

      const merged = this.teacherRepository.merge(existing, dtoWithoutCompany);
      // Ensure company_id remains from authenticated user
      merged.company_id = companyId;
      merged.company = { id: companyId } as any;

      // If email changed, also update the linked User.email (same company)
      if (emailChanged && dtoWithoutCompany.email) {
        const currentEmail = existing.email;
        const newEmail = dtoWithoutCompany.email;

        const user = await this.userRepository.findOne({
          where: { email: currentEmail, company_id: companyId, status: Not(-2) },
        });

        if (user) {
          const conflict = await this.userRepository.findOne({
            where: {
              email: newEmail,
              company_id: companyId,
              status: Not(-2),
              id: Not(user.id),
            },
          });

          if (conflict) {
            throw new BadRequestException(`A user with email ${newEmail} already exists`);
          }

          user.email = newEmail;
          await this.userRepository.save(user);
        }
      }

      await this.teacherRepository.save(merged);
      return this.findOne(id, companyId);
    } catch (error) {
      // If it's already a BadRequestException or NotFoundException, re-throw it
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      // Log the actual error for debugging
      this.logger.error('Failed to update teacher', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        updateTeacherDto,
        companyId,
      });

      // Handle database errors
      if (error instanceof QueryFailedError) {
        const errorMessage = error.message;
        if (errorMessage.includes('foreign key constraint')) {
          throw new BadRequestException('Cannot update teacher: Invalid reference');
        }
        if (errorMessage.includes('cannot be null')) {
          throw new BadRequestException('Required field cannot be null');
        }
        if (process.env.NODE_ENV !== 'production') {
          throw new BadRequestException(`Database error: ${errorMessage}`);
        }
      }

      throw new BadRequestException('Failed to update teacher');
    }
  }

  async remove(id: number, companyId: number): Promise<void> {
    const existing = await this.findOne(id, companyId);
    // Soft delete teacher (set status to -2)
    existing.status = -2;
    await this.teacherRepository.save(existing);

    // Also soft delete the corresponding user account with same email in this company
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ status: -2 })
      .where('email = :email AND company_id = :companyId AND status <> :deletedStatus', {
        email: existing.email,
        companyId: companyId,
        deletedStatus: -2,
      })
      .execute();
    
    this.logger.log(`Soft deleted teacher ${id} and user account with email ${existing.email}`);
  }

  /**
   * Normalizes a string for username generation
   * @private
   */
  private normalize(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]/g, '.') // Replace non-alphanumeric with dots
      .replace(/\.+/g, '.') // Replace multiple dots with single dot
      .replace(/^\.|\.$/g, ''); // Remove leading/trailing dots
  }

  /**
   * Generates possible username variations from teacher's first name, last name, and email
   * @private
   */
  private generateUsernameVariations(firstName: string, lastName: string, email: string): string[] {
    const normalizedFirst = this.normalize(firstName);
    const normalizedLast = this.normalize(lastName);
    const emailPrefix = this.normalize(email.split('@')[0]);

    const variations: string[] = [];

    // If both names are available, try different combinations
    if (normalizedFirst && normalizedLast) {
      // 1. firstname.lastname
      variations.push(`${normalizedFirst}.${normalizedLast}`);
      // 2. lastname.firstname
      variations.push(`${normalizedLast}.${normalizedFirst}`);
      // 3. firstname_lastname (underscore)
      variations.push(`${normalizedFirst}_${normalizedLast}`);
      // 4. lastname_firstname (underscore)
      variations.push(`${normalizedLast}_${normalizedFirst}`);
      // 5. first initial + lastname
      if (normalizedFirst.length > 0) {
        variations.push(`${normalizedFirst[0]}.${normalizedLast}`);
      }
      // 6. firstname + last initial
      if (normalizedLast.length > 0) {
        variations.push(`${normalizedFirst}.${normalizedLast[0]}`);
      }
    }

    // Fallback to email prefix if names are not available
    if (variations.length === 0 && emailPrefix) {
      variations.push(emailPrefix);
    }

    return variations;
  }

  /**
   * Generates a unique username by trying different name combinations first, then appending numbers if needed
   * @private
   */
  private async generateUniqueUsername(firstName: string, lastName: string, email: string, companyId: number): Promise<string> {
    // Get all possible username variations
    const variations = this.generateUsernameVariations(firstName, lastName, email);

    // Try each variation
    for (const username of variations) {
      const userExists = await this.userRepository.findOne({
        where: { username, company_id: companyId },
      });

      if (!userExists) {
        return username; // Username is available
      }
    }

    // If all variations are taken, try appending numbers to the first variation
    const baseUsername = variations[0] || this.normalize(email.split('@')[0]);
    let counter = 1;
    const maxAttempts = 100; // Prevent infinite loop

    while (counter <= maxAttempts) {
      const username = `${baseUsername}${counter}`;
      const userExists = await this.userRepository.findOne({
        where: { username, company_id: companyId },
      });

      if (!userExists) {
        return username;
      }

      counter++;
    }

    // Final fallback: use timestamp
    return `${baseUsername}_${Date.now()}`;
  }

  /**
   * Get teacher by email (used for activation after password set)
   */
  async findByEmail(email: string, companyId: number): Promise<Teacher | null> {
    return await this.teacherRepository.findOne({
      where: { email, company_id: companyId, status: Not(-2) },
    });
  }

  /**
   * Sends password invitation email for a teacher
   * @param teacherId Teacher ID
   * @param companyId Company ID
   * @returns Success message
   */
  async sendPasswordInvitation(teacherId: number, companyId: number): Promise<{ message: string }> {
    const teacher = await this.findOne(teacherId, companyId);
    return await this.usersService.sendPasswordInvitationByEmail(teacher.email, companyId);
  }

  private requesterHasAdminRole(requestUser: User): boolean {
    return (
      requestUser.userRoles?.some((ur) => String(ur.role?.code ?? '').toLowerCase() === 'admin') ?? false
    );
  }

  private requesterHasTeacherRole(requestUser: User): boolean {
    return (
      requestUser.userRoles?.some((ur) => String(ur.role?.code ?? '').toLowerCase() === 'teacher') ?? false
    );
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private sanitizeAttachmentFilename(name: string): string {
    const base = path.basename(name || 'attachment').replace(/[^\w.\-()+ ]/g, '_');
    return base.slice(0, 200) || 'attachment';
  }

  /** Bulk: student ids this teacher may contact via class + planning (same company). */
  private async getTeacherReachableStudentIdSet(
    teacherId: number,
    studentIds: number[],
    companyId: number,
  ): Promise<Set<number>> {
    if (studentIds.length === 0) {
      return new Set();
    }
    const rows = await this.classStudentRepository
      .createQueryBuilder('cs')
      .select('cs.student_id', 'student_id')
      .distinct(true)
      .innerJoin(
        StudentsPlanning,
        'ps',
        'ps.class_id = cs.class_id AND ps.teacher_id = :teacherId AND ps.status <> :pdel',
        { teacherId, pdel: -2 },
      )
      .where('cs.student_id IN (:...ids)', { ids: studentIds })
      .andWhere('cs.company_id = :companyId', { companyId })
      .andWhere('cs.class_id IS NOT NULL')
      .andWhere('cs.status <> :del', { del: -2 })
      .getRawMany<Record<string, unknown>>();
    const parsed = rows
      .map((r) => {
        const v = r.student_id ?? r.cs_student_id;
        if (typeof v === 'string') return parseInt(v, 10);
        if (typeof v === 'number') return v;
        return NaN;
      })
      .filter((n) => Number.isFinite(n) && n >= 1);
    return new Set(parsed);
  }

  private parseStudentIdsFromDto(dto: ShareTeacherResourceDto): number[] {
    if (!dto.student_id?.trim() && !dto.student_ids?.trim()) {
      throw new BadRequestException('Provide student_id and/or student_ids');
    }
    const ids = new Set<number>();
    if (dto.student_id?.trim()) {
      const n = parseInt(dto.student_id.trim(), 10);
      if (!Number.isFinite(n) || n < 1) {
        throw new BadRequestException('Invalid student_id');
      }
      ids.add(n);
    }
    if (dto.student_ids?.trim()) {
      const parts = dto.student_ids
        .split(/[,\s]+/)
        .map((p) => p.trim())
        .filter(Boolean);
      for (const part of parts) {
        const n = parseInt(part, 10);
        if (!Number.isFinite(n) || n < 1) {
          throw new BadRequestException(`Invalid student id in student_ids: "${part}"`);
        }
        ids.add(n);
      }
    }
    const arr = [...ids].sort((a, b) => a - b);
    if (arr.length === 0) {
      throw new BadRequestException('Provide at least one valid student id');
    }
    if (arr.length > MAX_STUDENTS_PER_SHARE) {
      throw new BadRequestException(`At most ${MAX_STUDENTS_PER_SHARE} students per request`);
    }
    return arr;
  }

  private buildShareResourceEmailHtml(
    studentFirstName: string,
    teacherName: string,
    linkTrimmed: string,
    linkHref: string,
    description: string | undefined,
    hasFile: boolean,
  ): string {
    const parts: string[] = [];
    parts.push(`<p>Hello ${this.escapeHtml(studentFirstName)},</p>`);
    parts.push(
      `<p><strong>${this.escapeHtml(teacherName)}</strong> shared something with you from your school.</p>`,
    );
    if (description?.trim()) {
      parts.push(
        `<div style="margin:16px 0;">${this.escapeHtml(description.trim()).replace(/\n/g, '<br/>')}</div>`,
      );
    }
    if (linkHref) {
      parts.push(
        `<p>Link: <a href="${this.escapeHtml(linkHref)}">${this.escapeHtml(linkTrimmed)}</a></p>`,
      );
    }
    if (hasFile) {
      parts.push('<p>An attachment is included with this email.</p>');
    }
    parts.push('<p style="color:#64748b;font-size:12px;">This message was sent by your school.</p>');
    return `<!DOCTYPE html><html><body style="font-family:sans-serif;line-height:1.5;">${parts.join('')}</body></html>`;
  }

  /**
   * Email a link and/or attachment to one or more students (teacher portal).
   * Admins may send to any student in the company; teachers only to students in their planned classes.
   */
  async shareResourceWithStudent(
    dto: ShareTeacherResourceDto,
    file: Express.Multer.File | undefined,
    requestUser: User,
    companyId: number,
  ): Promise<{ message: string; count: number }> {
    const isAdmin = this.requesterHasAdminRole(requestUser);
    const isTeacherRole = this.requesterHasTeacherRole(requestUser);
    if (!isAdmin && !isTeacherRole) {
      throw new ForbiddenException('Only teachers or administrators can share resources with students.');
    }

    const studentIds = this.parseStudentIdsFromDto(dto);

    const linkTrimmed = dto.link?.trim() ?? '';
    const hasFile = !!file?.buffer && file.size > 0;
    if (!linkTrimmed && !hasFile) {
      throw new BadRequestException('Provide at least one of: link or file');
    }

    let linkHref = '';
    if (linkTrimmed) {
      try {
        const u = new URL(linkTrimmed);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
          throw new BadRequestException('link must use http or https');
        }
        linkHref = u.href;
      } catch (e) {
        if (e instanceof BadRequestException) throw e;
        throw new BadRequestException('link must be a valid URL');
      }
    }

    const students = await this.studentRepository.find({
      where: { id: In(studentIds), company_id: companyId, status: Not(-2) },
    });
    const foundIds = new Set(students.map((s) => s.id));
    const missing = studentIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      throw new NotFoundException(
        missing.length === 1
          ? 'Student not found'
          : `Students not found: ${missing.join(', ')}`,
      );
    }

    if (!isAdmin) {
      const teacher = await this.teacherRepository.findOne({
        where: { email: requestUser.email, company_id: companyId, status: Not(-2) },
      });
      if (!teacher) {
        throw new ForbiddenException('No teacher profile matches your account for this company.');
      }
      const allowed = await this.getTeacherReachableStudentIdSet(teacher.id, studentIds, companyId);
      const forbidden = studentIds.filter((id) => !allowed.has(id));
      if (forbidden.length > 0) {
        throw new ForbiddenException(
          forbidden.length === 1
            ? 'You can only share resources with students who are in a class you teach (planning).'
            : `Not allowed to contact some students (not in your classes/planning): ${forbidden.join(', ')}`,
        );
      }
    }

    const teacherName = `${requestUser.username}`;
    const desc = dto.description;
    const attachments =
      hasFile && file
        ? [
            {
              filename: this.sanitizeAttachmentFilename(file.originalname),
              content: file.buffer,
              contentType: file.mimetype || undefined,
            },
          ]
        : undefined;

    const byId = new Map(students.map((s) => [s.id, s]));
    for (const id of studentIds) {
      const student = byId.get(id)!;
      const html = this.buildShareResourceEmailHtml(
        student.first_name,
        teacherName,
        linkTrimmed,
        linkHref,
        desc,
        hasFile,
      );
      await this.mailService.sendMailWithAttachments(student.email, dto.title.trim(), html, attachments);
    }

    const n = studentIds.length;
    return {
      message: n === 1 ? `Resource sent to ${byId.get(studentIds[0])!.email}` : `Resource sent to ${n} students`,
      count: n,
    };
  }
}
