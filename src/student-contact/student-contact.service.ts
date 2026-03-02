import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateStudentContactDto } from './dto/create-student-contact.dto';
import { UpdateStudentContactDto } from './dto/update-student-contact.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { StudentContact } from './entities/student-contact.entity';
import { StudentContactQueryDto } from './dto/student-contact-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { Student } from '../students/entities/student.entity';

@Injectable()
export class StudentContactService {
  constructor(
    @InjectRepository(StudentContact)
    private repo: Repository<StudentContact>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async create(dto: CreateStudentContactDto, companyId: number): Promise<StudentContact> {
    // Validate student exists, is not deleted, and belongs to the same company
    if (dto.student_id) {
      const student = await this.studentRepository.findOne({
        where: { id: dto.student_id, company_id: companyId, status: Not(-2) },
      });
      if (!student) {
        throw new NotFoundException(`Student with ID ${dto.student_id} not found or does not belong to your company`);
      }
    }

    try {
      // Always set company_id from authenticated user
      const dtoWithCompany = {
        ...dto,
        company_id: companyId,
      };
      const created = this.repo.create(dtoWithCompany);
      const saved = await this.repo.save(created);
      return this.findOne(saved.id, companyId);
    } catch (e) {
      throw new BadRequestException('Failed to create student contact');
    }
  }

  async findAll(query: StudentContactQueryDto, companyId: number): Promise<PaginatedResponseDto<StudentContact>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.repo.createQueryBuilder('c')
      .leftJoinAndSelect('c.student', 'student')
      .leftJoinAndSelect('c.studentLinkType', 'studentLinkType');

    qb.andWhere('c.status <> :deletedStatus', { deletedStatus: -2 });
    // Always filter by company_id from authenticated user
    qb.andWhere('c.company_id = :company_id', { company_id: companyId });

    if (query.search) {
      qb.andWhere(
        '(c.firstname LIKE :search OR c.lastname LIKE :search OR c.email LIKE :search OR c.phone LIKE :search OR c.city LIKE :search OR c.country LIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    if (query.student_id) qb.andWhere('c.student_id = :student_id', { student_id: query.student_id });
    if (query.studentlinktypeId) qb.andWhere('c.studentlinktypeId = :sid', { sid: query.studentlinktypeId });
    if (query.status !== undefined) qb.andWhere('c.status = :status', { status: query.status });

    qb.skip((page - 1) * limit).take(limit).orderBy('c.id', 'DESC');
    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<StudentContact> {
    const found = await this.repo.findOne({ 
      where: { id, company_id: companyId, status: Not(-2) }, 
      relations: ['student', 'studentLinkType'] 
    });
    if (!found) throw new NotFoundException('Student contact not found');
    return found;
  }

  async update(id: number, dto: UpdateStudentContactDto, companyId: number): Promise<StudentContact> {
    const existing = await this.findOne(id, companyId);

    // Validate student if provided and belongs to the same company
    if (dto.student_id) {
      const student = await this.studentRepository.findOne({
        where: { id: dto.student_id, company_id: companyId, status: Not(-2) },
      });
      if (!student) {
        throw new NotFoundException(`Student with ID ${dto.student_id} not found or does not belong to your company`);
      }
    }

    // Prevent changing company_id - always use authenticated user's company
    const dtoWithoutCompany = { ...dto };
    delete (dtoWithoutCompany as any).company_id;

    const merged = this.repo.merge(existing, dtoWithoutCompany);
    const relationMappings = {
      student_id: 'student',
      studentlinktypeId: 'studentLinkType',
    } as const;

    (Object.entries(relationMappings) as Array<[keyof UpdateStudentContactDto, keyof StudentContact]>).forEach(([idProp, relationProp]) => {
      const value = (dtoWithoutCompany as any)[idProp];
      if (value !== undefined) {
        (merged as any)[idProp] = value;
        (merged as any)[relationProp] = value ? ({ id: value } as any) : undefined;
      }
    });

    // Ensure company_id remains from authenticated user
    merged.company_id = companyId;
    merged.company = { id: companyId } as any;

    await this.repo.save(merged);
    return this.findOne(id, companyId);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const existing = await this.findOne(id, companyId);
    // Soft delete: set status to -2
    existing.status = -2;
    await this.repo.save(existing);
  }
}
