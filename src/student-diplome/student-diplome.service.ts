import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateStudentDiplomeDto } from './dto/create-student-diplome.dto';
import { UpdateStudentDiplomeDto } from './dto/update-student-diplome.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { StudentDiplome } from './entities/student-diplome.entity';
import { StudentDiplomesQueryDto } from './dto/student-diplomes-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { Student } from '../students/entities/student.entity';

@Injectable()
export class StudentDiplomeService {
  constructor(
    @InjectRepository(StudentDiplome)
    private repo: Repository<StudentDiplome>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async create(dto: CreateStudentDiplomeDto, companyId: number): Promise<StudentDiplome> {
    // Verify student exists, is not deleted, and belongs to the same company
    const student = await this.studentRepository.findOne({
      where: { id: dto.student_id, company_id: companyId, status: Not(-2) },
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${dto.student_id} not found or does not belong to your company`);
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
      throw new BadRequestException('Failed to create student diplome');
    }
  }

  async findAll(query: StudentDiplomesQueryDto, companyId: number): Promise<PaginatedResponseDto<StudentDiplome>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.repo.createQueryBuilder('d');

    qb.andWhere('d.status <> :deletedStatus', { deletedStatus: -2 });
    // Always filter by company_id from authenticated user
    qb.andWhere('d.company_id = :company_id', { company_id: companyId });

    if (query.search) {
      qb.andWhere(
        '(d.title LIKE :search OR d.school LIKE :search OR d.diplome LIKE :search OR d.city LIKE :search OR d.country LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.student_id) qb.andWhere('d.student_id = :student_id', { student_id: query.student_id });
    if (query.annee) qb.andWhere('d.annee = :annee', { annee: query.annee });
    if (query.status !== undefined) qb.andWhere('d.status = :status', { status: query.status });

    qb.skip((page - 1) * limit).take(limit).orderBy('d.id', 'DESC');

    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<StudentDiplome> {
    const found = await this.repo.findOne({ 
      where: { id, company_id: companyId, status: Not(-2) } 
    });
    if (!found) throw new NotFoundException('Student diplome not found');
    return found;
  }

  async update(id: number, dto: UpdateStudentDiplomeDto, companyId: number): Promise<StudentDiplome> {
    const existing = await this.findOne(id, companyId);

    // If student_id is being updated, verify it belongs to the same company
    if (dto.student_id !== undefined) {
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
