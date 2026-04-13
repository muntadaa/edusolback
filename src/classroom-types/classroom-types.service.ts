import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateClassroomTypeDto } from './dto/create-classroom-type.dto';
import { UpdateClassroomTypeDto } from './dto/update-classroom-type.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ClassroomType } from './entities/classroom-type.entity';
import { ClassroomTypeQueryDto } from './dto/classroom-type-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';

@Injectable()
export class ClassroomTypesService {
  constructor(
    @InjectRepository(ClassroomType)
    private repo: Repository<ClassroomType>,
  ) {}

  async create(dto: CreateClassroomTypeDto, companyId: number): Promise<ClassroomType> {
    try {
      // Always set company_id from authenticated user
      const dtoWithCompany = {
        ...dto,
        company_id: companyId,
      };
      const created = this.repo.create(dtoWithCompany);
      const saved = await this.repo.save(created);
      return this.findOne(saved.id, companyId);
    } catch (error) {
      throw new BadRequestException('Failed to create classroom type');
    }
  }

  async findAll(query: ClassroomTypeQueryDto, companyId: number): Promise<PaginatedResponseDto<ClassroomType>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.repo.createQueryBuilder('t');
    qb.leftJoinAndSelect('t.company', 'company');
    qb.andWhere('t.status <> :deletedStatus', { deletedStatus: -2 });
    // Always filter by company_id from authenticated user
    qb.andWhere('t.company_id = :company_id', { company_id: companyId });
    if (query.search) qb.andWhere('t.title LIKE :search', { search: `%${query.search}%` });
    if (query.status !== undefined) qb.andWhere('t.status = :status', { status: query.status });
    qb.skip((page - 1) * limit).take(limit).orderBy('t.id', 'DESC');
    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<ClassroomType> {
    const found = await this.repo.findOne({ 
      where: { id, company_id: companyId, status: Not(-2) },
      relations: ['company'],
    });
    if (!found) throw new NotFoundException('Classroom type not found');
    return found;
  }

  async update(id: number, dto: UpdateClassroomTypeDto, companyId: number): Promise<ClassroomType> {
    const existing = await this.findOne(id, companyId);

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

