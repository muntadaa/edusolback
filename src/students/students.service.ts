import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository, QueryFailedError } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentsQueryDto, StudentsWithoutReportQueryDto } from './dto/students-query.dto';
import { Student } from './entities/student.entity';
import { User } from '../users/entities/user.entity';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { ClassStudent } from '../class-student/entities/class-student.entity';
import { StudentDiplome } from '../student-diplome/entities/student-diplome.entity';
import { StudentPayment } from '../student-payment/entities/student-payment.entity';
import { StudentReport } from '../student-report/entities/student-report.entity';
import { StudentAttestation } from '../studentattestation/entities/studentattestation.entity';
import { StudentPresence } from '../studentpresence/entities/studentpresence.entity';
import { StudentContact } from '../student-contact/entities/student-contact.entity';
import { StudentLinkType } from '../studentlinktype/entities/studentlinktype.entity';
import { ClassEntity } from '../class/entities/class.entity';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { UserRolesService } from '../user-roles/user-roles.service';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(StudentDiplome)
    private studentDiplomeRepository: Repository<StudentDiplome>,
    @InjectRepository(StudentContact)
    private studentContactRepository: Repository<StudentContact>,
    @InjectRepository(StudentLinkType)
    private studentLinkTypeRepository: Repository<StudentLinkType>,
    @InjectRepository(StudentReport)
    private studentReportRepository: Repository<StudentReport>,
    @InjectRepository(ClassStudent)
    private classStudentRepository: Repository<ClassStudent>,
    @InjectRepository(ClassEntity)
    private classRepository: Repository<ClassEntity>,
    private dataSource: DataSource,
    private usersService: UsersService,
    private rolesService: RolesService,
    private userRolesService: UserRolesService,
  ) {}

  async create(createStudentDto: CreateStudentDto, companyId: number): Promise<Student> {
    try {
      // Check if email already exists in students table (excluding deleted students)
      const existingActiveStudent = await this.studentRepository.findOne({
        where: { 
          email: createStudentDto.email, 
          company_id: companyId,
          status: Not(-2), // Exclude deleted students
        },
      });
      if (existingActiveStudent) {
        throw new BadRequestException(`A student with email ${createStudentDto.email} already exists`);
      }

      // Check if there's a deleted student with this email - if so, we'll restore it
      const deletedStudent = await this.studentRepository.findOne({
        where: { 
          email: createStudentDto.email, 
          company_id: companyId,
          status: -2, // Only deleted students
        },
      });

      // Check if email already exists in users table (excluding deleted users)
      const existingActiveUser = await this.userRepository.findOne({
        where: { 
          email: createStudentDto.email, 
          company_id: companyId,
          status: Not(-2), // Exclude deleted users
        },
      });
      if (existingActiveUser) {
        throw new BadRequestException(`A user with email ${createStudentDto.email} already exists`);
      }

      // Generate unique username by trying different name combinations
      const uniqueUsername = await this.generateUniqueUsername(
        createStudentDto.first_name,
        createStudentDto.last_name,
        createStudentDto.email,
        companyId
      );

      let saved: Student;

      if (deletedStudent) {
        // Restore and update the deleted student
        this.logger.log(`Restoring deleted student ${deletedStudent.id} with email ${createStudentDto.email}`);
        Object.assign(deletedStudent, {
          ...createStudentDto,
          company_id: companyId,
          status: createStudentDto.status ?? 2, // Default to pending (2) if not specified
        });
        saved = await this.studentRepository.save(deletedStudent);
      } else {
        // Create new student
        const dtoWithCompany = {
          ...createStudentDto,
          company_id: companyId,
          status: createStudentDto.status ?? 2, // Default to pending (2) if not specified
        };
        const created = this.studentRepository.create(dtoWithCompany);
        saved = await this.studentRepository.save(created);
      }

      // Check if there's a deleted user with this email - if so, restore it
      const deletedUser = await this.userRepository.findOne({
        where: { 
          email: createStudentDto.email, 
          company_id: companyId,
          status: -2, // Only deleted users
        },
      });

      // Create or restore user account for the student with 'student' role
      // Password will be null, status will be pending (2), and NO email will be sent automatically
      try {
        // Find student role
        const studentRole = await this.rolesService.findByCode('student', companyId);
        if (!studentRole) {
          throw new BadRequestException('Student role not found. Please ensure system roles are seeded.');
        }

        if (deletedUser) {
          // Restore and update the deleted user
          this.logger.log(`Restoring deleted user ${deletedUser.id} with email ${createStudentDto.email}`);
          // Generate new token for password invitation
          const plainToken = randomBytes(32).toString('hex');
          const salt = await bcrypt.genSalt(10);
          const hashedToken = await bcrypt.hash(plainToken, salt);
          const tokenExpiresAt = new Date();
          tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24);
          
          Object.assign(deletedUser, {
            username: uniqueUsername,
            email: createStudentDto.email,
            company_id: companyId,
            password: null,
            status: 2, // Set to pending (2)
            password_set_token: hashedToken,
            password_set_token_expires_at: tokenExpiresAt,
          });
          const restoredUser = await this.userRepository.save(deletedUser);
          
          // Assign student role
          await this.userRolesService.replaceUserRoles(restoredUser.id, [studentRole.id], companyId);
          this.logger.log(`User account restored for student ${saved.id} with email ${createStudentDto.email} (status: pending)`);
        } else {
          // Create new user with student role
          await this.usersService.create(
            {
              username: uniqueUsername,
              email: createStudentDto.email,
              role_ids: [studentRole.id],
              company_id: companyId,
              password: undefined, // No password - email will be sent when frontend triggers it
              status: 2, // Set to pending (2) by default
            },
            companyId,
            false, // Don't send email automatically
          );
          this.logger.log(`User account created for student ${saved.id} with email ${createStudentDto.email} (status: pending)`);
        }
      } catch (userError: any) {
        // If user creation/restoration fails, rollback student creation/restoration
        this.logger.error(`Failed to create/restore user account for student ${saved.id}: ${userError.message}`);
        
        // If we restored a deleted student, mark it as deleted again
        if (deletedStudent) {
          saved.status = -2;
          await this.studentRepository.save(saved);
        } else {
          // If we created a new student, delete it
          await this.studentRepository.remove(saved);
        }
        
        // Re-throw with a clear error message
        if (userError instanceof BadRequestException) {
          throw userError;
        }
        throw new BadRequestException(`Failed to create user account: ${userError.message}`);
      }

      return this.findOne(saved.id, companyId); // Return with relations loaded
    } catch (error) {
      // Re-throw BadRequestException and NotFoundException as-is (they already have clear messages)
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      // Log the actual error for debugging
      this.logger.error('Failed to create student', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        createStudentDto: { ...createStudentDto, email: createStudentDto.email },
        companyId,
      });
      
      // If it's a database error, preserve the message for better debugging
      if (error instanceof QueryFailedError) {
        // Extract meaningful error message
        const errorMessage = error.message;
        if (errorMessage.includes('Duplicate entry')) {
          const match = errorMessage.match(/Duplicate entry '(.+?)' for key/);
          if (match) {
            throw new BadRequestException(`Duplicate entry: ${match[1]} already exists`);
          }
          throw new BadRequestException('This record already exists');
        }
        if (errorMessage.includes('foreign key constraint')) {
          throw new BadRequestException('Cannot create student: Invalid reference (company, class, etc.)');
        }
        if (errorMessage.includes('cannot be null')) {
          throw new BadRequestException('Required field cannot be null');
        }
        // For other database errors, include the message in development
        if (process.env.NODE_ENV !== 'production') {
          throw new BadRequestException(`Database error: ${errorMessage}`);
        }
      }
      
      throw new BadRequestException('Failed to create student');
    }
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
   * Generates possible username variations from student's first name, last name, and email
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

  async findAll(query: StudentsQueryDto, companyId: number): Promise<PaginatedResponseDto<Student>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.studentRepository.createQueryBuilder('s')
      .leftJoinAndSelect('s.company', 'company');

    qb.andWhere('s.status <> :deletedStatus', { deletedStatus: -2 });
    // Always filter by company_id from authenticated user
    qb.andWhere('s.company_id = :company_id', { company_id: companyId });

    if (query.search) {
      qb.andWhere(
        '(s.first_name LIKE :search OR s.last_name LIKE :search OR s.email LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.status !== undefined) qb.andWhere('s.status = :status', { status: query.status });

    qb.skip((page - 1) * limit).take(limit).orderBy('s.id', 'DESC');

    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findAllWithoutReport(query: StudentsWithoutReportQueryDto, companyId: number): Promise<Student[]> {
    const qb = this.studentRepository.createQueryBuilder('s')
      .leftJoinAndSelect('s.company', 'company');

    // Join with class_students if class_id, school_year_id, or school_year_period_id is provided
    if (query.class_id || query.school_year_id || query.school_year_period_id) {
      qb.innerJoin('class_students', 'cs', 'cs.student_id = s.id AND cs.statut <> :deletedStatus', { deletedStatus: -2 });
      
      if (query.class_id) {
        qb.andWhere('cs.class_id = :class_id', { class_id: query.class_id });
      }

      // Join with classes table if school_year_id or school_year_period_id is provided
      if (query.school_year_id || query.school_year_period_id) {
        qb.innerJoin('classes', 'c', 'c.id = cs.class_id AND c.statut <> :deletedStatus', { deletedStatus: -2 });
        
        if (query.school_year_id) {
          qb.andWhere('c.school_year_id = :school_year_id', { school_year_id: query.school_year_id });
        }
        
        if (query.school_year_period_id) {
          qb.andWhere('c.school_year_period_id = :school_year_period_id', { school_year_period_id: query.school_year_period_id });
        }
      }
    }

    // Check for student reports - if filters are provided, check for reports matching those filters
    const reportJoinParams: any = { deletedStatus: -2 };
    let reportJoinCondition = 'sr.student_id = s.id AND sr.statut <> :deletedStatus';
    
    if (query.school_year_id) {
      reportJoinCondition += ' AND sr.school_year_id = :school_year_id';
      reportJoinParams.school_year_id = query.school_year_id;
    }
    if (query.school_year_period_id) {
      reportJoinCondition += ' AND sr.school_year_period_id = :school_year_period_id';
      reportJoinParams.school_year_period_id = query.school_year_period_id;
    }

    qb.leftJoin('student_reports', 'sr', reportJoinCondition, reportJoinParams);

    qb.andWhere('s.status <> :deletedStatus', { deletedStatus: -2 });
    // Always filter by company_id from authenticated user
    qb.andWhere('s.company_id = :company_id', { company_id: companyId });
    // Only include students that DON'T have any active student report (matching the filters if provided)
    qb.andWhere('sr.id IS NULL');

    qb.orderBy('s.id', 'DESC');

    return qb.getMany();
  }

  async findOne(id: number, companyId: number): Promise<Student> {
    const found = await this.studentRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.company', 'company')
      .where('s.id = :id', { id })
      .andWhere('s.company_id = :companyId', { companyId })
      .andWhere('s.status <> :deletedStatus', { deletedStatus: -2 })
      .getOne();
    
    if (!found) throw new NotFoundException('Student not found');
    return found;
  }

  async findOneWithDetails(id: number, companyId: number) {
    // Get student
    const student = await this.studentRepository.findOne({
      where: { id, company_id: companyId, status: Not(-2) },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Get student's most recent diploma (one only)
    const diploma = await this.studentDiplomeRepository.findOne({
      where: { student_id: id, company_id: companyId, status: Not(-2) },
      order: { created_at: 'DESC' },
    });

    // Get student's most recent contact with link type (one only)
    const contact = await this.studentContactRepository.findOne({
      where: { student_id: id, company_id: companyId, status: Not(-2) },
      
      order: { created_at: 'DESC' },
    });

    // Get student's most recent link type (one only)
    const linkType = await this.studentLinkTypeRepository.findOne({
      where: { student_id: id, company_id: companyId, status: Not(-2) },
    
      order: { created_at: 'DESC' },
    });

    return {
      student,
      diploma,
      contact,
      linkType,
    };
  }

  async findOneWithClass(id: number, companyId: number) {
    // Get student and verify it belongs to the company
    const student = await this.studentRepository.findOne({
      where: { id, company_id: companyId, status: Not(-2) },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Find active class_student relationships (status !== -2)
    // Order by highest tri (DESC) first, then most recent (created_at DESC)
    const classStudent = await this.classStudentRepository.findOne({
      where: { 
        student_id: id, 
        company_id: companyId, 
        status: Not(-2) 
      },
      relations: ['class'],
      order: { 
        tri: 'DESC',
        created_at: 'DESC' 
      },
    });

    // If no active class found, return student with class: null
    if (!classStudent || !classStudent.class) {
      return {
        student: {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
          birthday: student.birthday || undefined,
        },
        class: null,
      };
    }

    // Get the class with nested relations: specialization, level, schoolYear
    const classEntity = await this.classRepository.findOne({
      where: { 
        id: classStudent.class_id, 
        company_id: companyId, 
        status: Not(-2) 
      },
      relations: ['specialization', 'level', 'schoolYear'],
    });

    // If class doesn't exist or is deleted, return null
    if (!classEntity) {
      return {
        student: {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
          birthday: student.birthday || undefined,
        },
        class: null,
      };
    }

    return {
      student: {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        birthday: student.birthday || undefined,
      },
      class: {
        id: classEntity.id,
        title: classEntity.title,
        specialization: classEntity.specialization ? {
          id: classEntity.specialization.id,
          title: classEntity.specialization.title,
        } : null,
        level: classEntity.level ? {
          id: classEntity.level.id,
          title: classEntity.level.title,
        } : null,
        schoolYear: classEntity.schoolYear ? {
          id: classEntity.schoolYear.id,
          title: classEntity.schoolYear.title,
        } : null,
      },
    };
  }

  async update(id: number, updateStudentDto: UpdateStudentDto, companyId: number): Promise<Student> {
    const existing = await this.findOne(id, companyId);

    // Prevent changing company_id - always use authenticated user's company
    const dtoWithoutCompany = { ...updateStudentDto };
    delete (dtoWithoutCompany as any).company_id;
    // Remove class_room_id if present (no longer supported)
    delete (dtoWithoutCompany as any).class_room_id;

    const emailChanged =
      dtoWithoutCompany.email !== undefined &&
      dtoWithoutCompany.email !== null &&
      dtoWithoutCompany.email !== existing.email;

    const merged = this.studentRepository.merge(existing, dtoWithoutCompany);

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

    await this.studentRepository.save(merged);
    return this.findOne(id, companyId); // Return with relations loaded
  }

  async remove(id: number, companyId: number): Promise<void> {
    await this.softDeleteStudent(id, companyId);
  }

  async softDeleteStudent(id: number, companyId: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // 1️⃣ Find the student first and verify it belongs to the company
      const student = await manager.findOne(Student, { where: { id, company_id: companyId, status: Not(-2) } });
      if (!student) {
        throw new NotFoundException(`Student with ID ${id} not found`);
      }

      // 2️⃣ Update student status to -2 (soft delete)
      await manager.update(Student, { id }, { status: -2 });

      // 2️⃣.5 Soft delete the corresponding user account with same email in this company
      await manager
        .createQueryBuilder()
        .update(User)
        .set({ status: -2 })
        .where('email = :email AND company_id = :companyId AND status <> :deletedStatus', {
          email: student.email,
          companyId: companyId,
          deletedStatus: -2,
        })
        .execute();
      
      this.logger.log(`Soft deleted user account for student ${id} with email ${student.email}`);

      // 3️⃣ Update related tables (soft delete all related resources that are not already deleted)
      // Using query builder for reliable updates in transaction
      
      // ClassStudent
      await manager
        .createQueryBuilder()
        .update(ClassStudent)
        .set({ status: -2 })
        .where('student_id = :id AND statut <> :deletedStatus', { id, deletedStatus: -2 })
        .execute();

      // StudentDiplome
      await manager
        .createQueryBuilder()
        .update(StudentDiplome)
        .set({ status: -2 })
        .where('student_id = :id AND statut <> :deletedStatus', { id, deletedStatus: -2 })
        .execute();

      // StudentPayment
      await manager
        .createQueryBuilder()
        .update(StudentPayment)
        .set({ status: -2 })
        .where('student_id = :id AND statut <> :deletedStatus', { id, deletedStatus: -2 })
        .execute();

      // StudentReport
      await manager
        .createQueryBuilder()
        .update(StudentReport)
        .set({ status: -2 })
        .where('student_id = :id AND statut <> :deletedStatus', { id, deletedStatus: -2 })
        .execute();

      // StudentAttestation (note: uses Idstudent and Status with capital S)
      await manager
        .createQueryBuilder()
        .update(StudentAttestation)
        .set({ Status: -2 })
        .where('Idstudent = :id AND Status <> :deletedStatus', { id, deletedStatus: -2 })
        .execute();

      // StudentPresence
      await manager
        .createQueryBuilder()
        .update(StudentPresence)
        .set({ status: -2 })
        .where('student_id = :id AND statut <> :deletedStatus', { id, deletedStatus: -2 })
        .execute();

      // StudentContact
      await manager
        .createQueryBuilder()
        .update(StudentContact)
        .set({ status: -2 })
        .where('student_id = :id AND statut <> :deletedStatus', { id, deletedStatus: -2 })
        .execute();
    });
  }

  /**
   * Sends password invitation email for a student
   * @param studentId Student ID
   * @param companyId Company ID
   * @returns Success message
   */
  async sendPasswordInvitation(studentId: number, companyId: number): Promise<{ message: string }> {
    const student = await this.findOne(studentId, companyId);
    return await this.usersService.sendPasswordInvitationByEmail(student.email, companyId);
  }
}
