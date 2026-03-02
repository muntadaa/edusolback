import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, QueryFailedError } from 'typeorm';
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
import { RolesService } from '../roles/roles.service';
import { UserRolesService } from '../user-roles/user-roles.service';

@Injectable()
export class TeachersService {
  private readonly logger = new Logger(TeachersService.name);

  constructor(
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private usersService: UsersService,
    private rolesService: RolesService,
    private userRolesService: UserRolesService,
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

      const merged = this.teacherRepository.merge(existing, dtoWithoutCompany);
      // Ensure company_id remains from authenticated user
      merged.company_id = companyId;
      merged.company = { id: companyId } as any;

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

    // Also soft delete the corresponding user account (profile = 'teacher' with same email)
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ status: -2 })
      .where('email = :email AND company_id = :companyId AND profile = :profile AND status <> :deletedStatus', {
        email: existing.email,
        companyId: companyId,
        profile: 'teacher',
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
}
