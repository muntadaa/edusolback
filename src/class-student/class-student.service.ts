import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateClassStudentDto } from './dto/create-class-student.dto';
import { UpdateClassStudentDto } from './dto/update-class-student.dto';
import { ClassStudent } from './entities/class-student.entity';
import { ClassStudentQueryDto } from './dto/class-student-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';

@Injectable()
export class ClassStudentService {
  constructor(
    @InjectRepository(ClassStudent)
    private readonly repo: Repository<ClassStudent>,
  ) {}

  private async ensureStudentAssignable(studentId: number, companyId: number, excludeId?: number): Promise<void> {
    if (!studentId) return;

    const qb = this.repo
      .createQueryBuilder('cs')
      .where('cs.student_id = :studentId', { studentId })
      .andWhere('cs.company_id = :companyId', { companyId })
      .andWhere('cs.status <> :deletedStatus', { deletedStatus: -2 });

    if (excludeId) {
      qb.andWhere('cs.id <> :excludeId', { excludeId });
    }

    const existing = await qb.getOne();
    if (existing) {
      throw new BadRequestException('Student is already assigned to a class');
    }
  }

  async create(dto: CreateClassStudentDto, companyId: number): Promise<ClassStudent> {
    await this.ensureStudentAssignable(dto.student_id, companyId);

    // Always set company_id from authenticated user
    const dtoWithCompany = {
      ...dto,
      company_id: companyId,
    };

    const entity = this.repo.create(dtoWithCompany);

    try {
      const saved = await this.repo.save(entity);
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

    if (dto.student_id && dto.student_id !== existing.student_id) {
      await this.ensureStudentAssignable(dto.student_id, companyId, id);
    }

    // Prevent changing company_id - always use authenticated user's company
    const dtoWithoutCompany = { ...dto };
    delete (dtoWithoutCompany as any).company_id;

    const merged = this.repo.merge(existing, dtoWithoutCompany);
    // Ensure company_id remains from authenticated user
    merged.company_id = companyId;
    merged.company = { id: companyId } as any;

    await this.repo.save(merged);

    return this.findOne(id, companyId);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const existing = await this.findOne(id, companyId);
    await this.repo.remove(existing);
  }
}
