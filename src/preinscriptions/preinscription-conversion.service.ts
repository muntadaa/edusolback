import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull, Not, Repository } from 'typeorm';
import { PreInscription } from './entities/preinscription.entity';
import { PreInscriptionStatus } from './enums/preinscription-status.enum';
import { Student } from '../students/entities/student.entity';
import { StudentDiplome } from '../student-diplome/entities/student-diplome.entity';
import { StudentPaymentDetail } from '../student_payment_details/entities/student_payment_detail.entity';
import { LevelPricing } from '../level-pricing/entities/level-pricing.entity';
import { Level } from '../level/entities/level.entity';
import { SchoolYear } from '../school-years/entities/school-year.entity';
import { ClassStudent } from '../class-student/entities/class-student.entity';
import { canTransition } from './workflow/preinscription.workflow';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { UserRole } from '../user-roles/entities/user-role.entity';

@Injectable()
export class PreInscriptionConversionService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PreInscription)
    private readonly preinscriptionRepo: Repository<PreInscription>,
  ) {}

  async convertToStudent(preInscriptionId: number): Promise<Student> {
    return this.dataSource.transaction(async (manager) => {
      const preinscription = await manager.findOne(PreInscription, {
        where: { id: preInscriptionId },
        relations: ['diplomas'],
      });

      if (!preinscription) {
        throw new NotFoundException(`Pre-inscription with id ${preInscriptionId} not found`);
      }

      if (preinscription.status !== PreInscriptionStatus.APPROVED) {
        throw new BadRequestException(
          `Pre-inscription must be APPROVED before conversion (current: ${preinscription.status ?? 'NEW'})`,
        );
      }
      if (!canTransition(preinscription.status, PreInscriptionStatus.CONVERTED)) {
        throw new BadRequestException(
          `Invalid status transition: ${preinscription.status} -> ${PreInscriptionStatus.CONVERTED}`,
        );
      }

      const existingStudent = await manager.findOne(Student, {
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

      // Keep compatibility with existing sync: create the student from pre-inscription personal data.
      const student = manager.create(Student, {
        first_name: preinscription.first_name,
        last_name: preinscription.last_name,
        email: preinscription.email,
        phone: preinscription.whatsapp_phone,
        nationality: preinscription.nationality,
        city: preinscription.city,
        picture: (preinscription as any).picture ?? null,
        company_id: preinscription.company_id,
        status: 2,
      });
      const savedStudent = await manager.save(Student, student);

      await this.ensureStudentUserAccount(manager, preinscription);

      // Copy pre-inscription diplomas into student_diplomes.
      const preDiplomas = preinscription.diplomas ?? [];
      for (const diploma of preDiplomas) {
        const studentDiplome = manager.create(StudentDiplome, {
          title: diploma.title ?? diploma.diplome ?? 'Diploma',
          school: diploma.school ?? 'Unknown',
          diplome: diploma.diplome ?? diploma.title,
          annee: diploma.annee ?? undefined,
          country: diploma.country ?? undefined,
          city: diploma.city ?? undefined,
          diplome_picture_1: diploma.diplome_picture_1 ?? undefined,
          diplome_picture_2: diploma.diplome_picture_2 ?? undefined,
          student_id: savedStudent.id,
          company_id: preinscription.company_id,
          status: 1,
        } as any);
        await manager.save(StudentDiplome, studentDiplome);
      }

      // Create a class_students row for the new student (no class yet: class_id stays null).
      if (
        preinscription.final_program_id &&
        preinscription.final_specialization_id &&
        preinscription.final_level_id &&
        preinscription.final_school_year_id
      ) {
        const existingAssignment = await manager.findOne(ClassStudent, {
          where: {
            student_id: savedStudent.id,
            company_id: preinscription.company_id,
            school_year_id: preinscription.final_school_year_id,
            status: Not(-2),
          } as any,
        });

        if (!existingAssignment) {
          const assignment = manager.create(ClassStudent, {
            student_id: savedStudent.id,
            class_id: null,
            company_id: preinscription.company_id,
            program_id: preinscription.final_program_id,
            specialization_id: preinscription.final_specialization_id,
            level_id: preinscription.final_level_id,
            school_year_id: preinscription.final_school_year_id,
            status: 1,
            tri: 1,
          });
          await manager.save(ClassStudent, assignment);
        }
      }

      // Generate student payment details from level pricing based on final_level_id.
      if (preinscription.final_level_id) {
        const schoolYear = preinscription.final_school_year_id
          ? await manager.findOne(SchoolYear, {
              where: {
                id: preinscription.final_school_year_id,
                company_id: preinscription.company_id,
                status: Not(-2),
              },
            })
          : await this.resolveTargetSchoolYear(manager, preinscription.company_id);
        if (schoolYear) {
          await this.generateDetailsFromFinalLevel(
            manager,
            savedStudent.id,
            preinscription.company_id,
            preinscription.final_level_id,
            schoolYear,
          );
        }
      }

      preinscription.status = PreInscriptionStatus.CONVERTED;
      await manager.save(PreInscription, preinscription);

      return savedStudent;
    });
  }

  private async resolveTargetSchoolYear(
    manager: EntityManager,
    companyId: number,
  ): Promise<SchoolYear | null> {
    const ongoing = await manager.findOne(SchoolYear, {
      where: {
        company_id: companyId,
        lifecycle_status: 'ongoing',
        status: Not(-2),
      },
      order: { start_date: 'DESC' },
    });
    if (ongoing) {
      return ongoing;
    }

    return manager.findOne(SchoolYear, {
      where: { company_id: companyId, status: Not(-2) },
      order: { start_date: 'DESC' },
    });
  }

  private async generateDetailsFromFinalLevel(
    manager: EntityManager,
    studentId: number,
    companyId: number,
    levelId: number,
    schoolYear: SchoolYear,
  ): Promise<void> {
    const level = await manager.findOne(Level, {
      where: { id: levelId, company_id: companyId, status: Not(-2) },
    });
    const levelDurationMonths = level?.durationMonths ?? null;

    const pricings = await manager.find(LevelPricing, {
      where: {
        company_id: companyId,
        level_id: levelId,
        school_year_id: schoolYear.id,
        status: Not(-2),
      },
      relations: ['rubrique'],
      order: { id: 'ASC' },
    });

    for (const pricing of pricings) {
      const title = pricing.title ?? pricing.rubrique?.title ?? null;
      const amountHt = Number(pricing.amount ?? pricing.rubrique?.amount ?? 0);
      const vatRate = pricing.vat_rate ?? pricing.rubrique?.vat_rate ?? 0;
      const everyMonth = pricing.every_month ?? pricing.rubrique?.every_month ?? 0;
      const occurrences = this.resolveInstallmentCount(
        everyMonth,
        levelDurationMonths,
        pricing.occurrences,
        pricing.rubrique?.occurrences,
      );

      if (!title || amountHt <= 0) {
        continue;
      }

      for (let occurrenceIndex = 1; occurrenceIndex <= occurrences; occurrenceIndex += 1) {
        const lineKey = `student:${studentId}:pricing:${pricing.id}:occurrence:${occurrenceIndex}`;
        const exists = await manager.findOne(StudentPaymentDetail, {
          where: { line_key: lineKey, company_id: companyId },
        });
        if (exists) {
          continue;
        }

        const dueDate = this.computeDueDate(
          schoolYear.start_date,
          everyMonth === 1 ? occurrenceIndex - 1 : 0,
        );

        const detail = manager.create(StudentPaymentDetail, {
          line_key: lineKey,
          student_id: studentId,
          school_year_id: schoolYear.id,
          level_id: levelId,
          class_id: null,
          level_pricing_id: pricing.id,
          rubrique_id: pricing.rubrique_id ?? null,
          source_type: 'level_pricing',
          source_reference_id: pricing.id,
          title,
          amount_ht: amountHt,
          vat_rate: vatRate,
          amount_ttc: Number((amountHt * (1 + vatRate / 100)).toFixed(2)),
          occurrence_index: occurrenceIndex,
          occurrences,
          every_month: everyMonth,
          due_date: dueDate,
          period_label: this.buildPeriodLabel(dueDate, occurrenceIndex, occurrences, everyMonth),
          company_id: companyId,
          status: 1,
        });

        await manager.save(StudentPaymentDetail, detail);
      }
    }
  }

  private resolveInstallmentCount(
    everyMonth: number,
    levelDurationMonths: number | null | undefined,
    pricingOccurrences: number | null | undefined,
    rubriqueOccurrences: number | null | undefined,
  ): number {
    const fromPricing = Math.max(pricingOccurrences ?? rubriqueOccurrences ?? 1, 1);
    if (everyMonth === 1) {
      if (levelDurationMonths != null && levelDurationMonths > 0) {
        return levelDurationMonths;
      }
      return fromPricing;
    }
    return fromPricing;
  }

  private computeDueDate(startDate: Date, monthOffset: number): string {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + monthOffset);
    return dueDate.toISOString().slice(0, 10);
  }

  private buildPeriodLabel(
    dueDate: string,
    occurrenceIndex: number,
    occurrences: number,
    everyMonth: number,
  ): string | null {
    if (everyMonth !== 1 || occurrences <= 1) {
      return null;
    }
    return `M${occurrenceIndex}-${dueDate}`;
  }

  private async ensureStudentUserAccount(
    manager: EntityManager,
    preinscription: PreInscription,
  ): Promise<void> {
    const studentRoles = await manager.find(Role, {
      where: [
        { code: 'student', company_id: preinscription.company_id },
        { code: 'student', company_id: IsNull() },
      ],
      order: { company_id: 'DESC' as any },
    });

    const studentRole =
      studentRoles.find((r) => r.company_id === preinscription.company_id) ??
      studentRoles.find((r) => r.company_id == null);

    if (!studentRole) {
      throw new BadRequestException('Student role not found. Please ensure system roles are seeded.');
    }

    let user = await manager.findOne(User, {
      where: {
        email: preinscription.email,
        company_id: preinscription.company_id,
        status: Not(-2),
      },
    });

    if (!user) {
      const deletedUser = await manager.findOne(User, {
        where: {
          email: preinscription.email,
          company_id: preinscription.company_id,
          status: -2,
        },
      });

      const username = await this.generateUniqueUsername(
        manager,
        preinscription.first_name,
        preinscription.last_name,
        preinscription.email,
      );

      if (deletedUser) {
        deletedUser.username = username;
        deletedUser.email = preinscription.email;
        deletedUser.company_id = preinscription.company_id;
        deletedUser.password = null;
        deletedUser.status = 2;
        deletedUser.password_set_token = null;
        deletedUser.password_set_token_expires_at = null;
        user = await manager.save(User, deletedUser);
      } else {
        const createdUser = manager.create(User, {
          username,
          email: preinscription.email,
          phone: preinscription.whatsapp_phone ?? null,
          company_id: preinscription.company_id,
          password: null,
          status: 2,
        });
        user = await manager.save(User, createdUser);
      }
    }

    await manager.delete(UserRole, {
      user_id: user.id,
      company_id: preinscription.company_id,
    });

    const userRole = manager.create(UserRole, {
      user_id: user.id,
      role_id: studentRole.id,
      company_id: preinscription.company_id,
    });
    await manager.save(UserRole, userRole);
  }

  private async generateUniqueUsername(
    manager: EntityManager,
    firstName: string,
    lastName: string,
    email: string,
  ): Promise<string> {
    const sanitize = (value: string) =>
      value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

    const first = sanitize(firstName || '');
    const last = sanitize(lastName || '');
    const emailPrefix = sanitize((email || '').split('@')[0] || 'user');

    const base = [first, last].filter(Boolean).join('.') || emailPrefix || 'user';

    for (let i = 0; i < 1000; i += 1) {
      const candidate = i === 0 ? base : `${base}${i}`;
      const exists = await manager.findOne(User, { where: { username: candidate } });
      if (!exists) {
        return candidate;
      }
    }

    return `${base}${Date.now()}`;
  }
}

