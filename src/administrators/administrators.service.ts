import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateAdministratorDto } from './dto/create-administrator.dto';
import { UpdateAdministratorDto } from './dto/update-administrator.dto';
import { AdministratorsQueryDto } from './dto/administrators-query.dto';
import { Administrator } from './entities/administrator.entity';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';

@Injectable()
export class AdministratorsService {
  constructor(
    @InjectRepository(Administrator)
    private administratorRepository: Repository<Administrator>,
  ) {}

  async create(createAdministratorDto: CreateAdministratorDto, companyId: number): Promise<Administrator> {
    try {
      // Always set company_id from authenticated user
      const dtoWithCompany = {
        ...createAdministratorDto,
        company_id: companyId,
      };
      const created = this.administratorRepository.create(dtoWithCompany);
      const saved = await this.administratorRepository.save(created);
      return this.findOne(saved.id, companyId);
    } catch (error) {
      throw new BadRequestException('Failed to create administrator');
    }
  }

  async findAll(query: AdministratorsQueryDto, companyId: number): Promise<PaginatedResponseDto<Administrator>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.administratorRepository.createQueryBuilder('a')
      .leftJoinAndSelect('a.classRoom', 'classRoom')
      .leftJoinAndSelect('a.company', 'company');

    qb.andWhere('a.status <> :deletedStatus', { deletedStatus: -2 });
    // Always filter by company_id from authenticated user
    qb.andWhere('a.company_id = :company_id', { company_id: companyId });

    if (query.search) {
      qb.andWhere(
        '(a.first_name LIKE :search OR a.last_name LIKE :search OR a.email LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.class_room_id) qb.andWhere('a.class_room_id = :class_room_id', { class_room_id: query.class_room_id });
    if (query.status !== undefined) qb.andWhere('a.status = :status', { status: query.status });

    qb.skip((page - 1) * limit).take(limit).orderBy('a.id', 'DESC');

    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<Administrator> {
    const found = await this.administratorRepository.findOne({
      where: { id, company_id: companyId, status: Not(-2) },
      relations: ['classRoom', 'company'],
    });
    if (!found) throw new NotFoundException('Administrator not found');
    return found;
  }

  async update(id: number, updateAdministratorDto: UpdateAdministratorDto, companyId: number): Promise<Administrator> {
    const existing = await this.findOne(id, companyId);
    
    // Prevent changing company_id - always use authenticated user's company
    const dtoWithoutCompany = { ...updateAdministratorDto };
    delete (dtoWithoutCompany as any).company_id;
    
    const merged = this.administratorRepository.merge(existing, dtoWithoutCompany);
    // Ensure company_id remains from authenticated user
    merged.company_id = companyId;
    merged.company = { id: companyId } as any;
    
    const relationMappings = {
      class_room_id: 'classRoom',
    } as const;

    (Object.entries(relationMappings) as Array<[keyof UpdateAdministratorDto, keyof Administrator]>).forEach(([idProp, relationProp]) => {
      const value = (updateAdministratorDto as any)[idProp];
      if (value !== undefined) {
        (merged as any)[idProp] = value;
        (merged as any)[relationProp] = value ? ({ id: value } as any) : undefined;
      }
    });

    await this.administratorRepository.save(merged);
    return this.findOne(id, companyId);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const existing = await this.findOne(id, companyId);
    await this.administratorRepository.remove(existing);
  }
}

