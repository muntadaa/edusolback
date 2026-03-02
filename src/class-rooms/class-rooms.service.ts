import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateClassRoomDto } from './dto/create-class-room.dto';
import { UpdateClassRoomDto } from './dto/update-class-room.dto';
import { ClassRoom } from './entities/class-room.entity';
import { ClassRoomQueryDto } from './dto/class-room-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { ClassroomType } from '../classroom-types/entities/classroom-type.entity';

@Injectable()
export class ClassRoomsService {
  constructor(
    @InjectRepository(ClassRoom)
    private classRoomRepository: Repository<ClassRoom>,
    @InjectRepository(ClassroomType)
    private classroomTypeRepository: Repository<ClassroomType>,
  ) {}

  async create(createClassRoomDto: CreateClassRoomDto, companyId: number): Promise<ClassRoom> {
    // Check if code already exists (scoped to company for better error message)
    const existingRoom = await this.classRoomRepository.findOne({
      where: { 
        code: createClassRoomDto.code,
        company_id: companyId,
        status: Not(-2) // Exclude deleted rooms
      }
    });

    if (existingRoom) {
      throw new BadRequestException(`A classroom with code "${createClassRoomDto.code}" already exists.`);
    }

    // Verify classroom type exists and belongs to the same company if provided
    if (createClassRoomDto.classroom_type_id) {
      const classroomType = await this.classroomTypeRepository.findOne({
        where: { 
          id: createClassRoomDto.classroom_type_id, 
          company_id: companyId, 
          status: Not(-2) 
        }
      });
      if (!classroomType) {
        throw new NotFoundException(`Classroom type with ID ${createClassRoomDto.classroom_type_id} not found or does not belong to your company`);
      }
    }

    try {
      // Always set company_id from authenticated user
      const dtoWithCompany = {
        ...createClassRoomDto,
        company_id: companyId,
      };
      const created = this.classRoomRepository.create(dtoWithCompany);
      return await this.classRoomRepository.save(created);
    } catch (error: any) {
      // Handle database unique constraint violation as fallback
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new BadRequestException(`A classroom with code "${createClassRoomDto.code}" already exists.`);
      }
      throw new BadRequestException('Failed to create classroom');
    }
  }

  async findAll(query: ClassRoomQueryDto, companyId: number): Promise<PaginatedResponseDto<ClassRoom>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.classRoomRepository.createQueryBuilder('cr')
      .leftJoinAndSelect('cr.classroomType', 'classroomType');

    qb.andWhere('cr.status <> :deletedStatus', { deletedStatus: -2 });
    // Always filter by company_id from authenticated user
    qb.andWhere('cr.company_id = :company_id', { company_id: companyId });

    if (query.search) {
      qb.andWhere('(cr.code LIKE :search OR cr.title LIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    if (query.classroom_type_id) {
      qb.andWhere('cr.classroom_type_id = :classroom_type_id', { classroom_type_id: query.classroom_type_id });
    }

    if (query.status !== undefined) {
      qb.andWhere('cr.status = :status', { status: query.status });
    }

    qb.skip((page - 1) * limit).take(limit).orderBy('cr.id', 'DESC');

    const [data, total] = await qb.getManyAndCount();
    return PaginationService.createResponse(data, page, limit, total);
  }

  async findOne(id: number, companyId: number): Promise<ClassRoom> {
    const found = await this.classRoomRepository.findOne({ 
      where: { id, company_id: companyId, status: Not(-2) },
      relations: ['classroomType'],
    });
    if (!found) throw new NotFoundException('Classroom not found');
    return found;
  }

  async update(id: number, updateClassRoomDto: UpdateClassRoomDto, companyId: number): Promise<ClassRoom> {
    const existing = await this.findOne(id, companyId);
    
    // If code is being updated, check for duplicates
    if (updateClassRoomDto.code && updateClassRoomDto.code !== existing.code) {
      const existingRoom = await this.classRoomRepository.findOne({
        where: { 
          code: updateClassRoomDto.code,
          company_id: companyId,
          status: Not(-2), // Exclude deleted rooms
          id: Not(id) // Exclude current room
        }
      });

      if (existingRoom) {
        throw new BadRequestException(`A classroom with code "${updateClassRoomDto.code}" already exists.`);
      }
    }

    // If classroom_type_id is being updated, verify it belongs to the same company
    if (updateClassRoomDto.classroom_type_id !== undefined) {
      if (updateClassRoomDto.classroom_type_id) {
        const classroomType = await this.classroomTypeRepository.findOne({
          where: { 
            id: updateClassRoomDto.classroom_type_id, 
            company_id: companyId, 
            status: Not(-2) 
          }
        });
        if (!classroomType) {
          throw new NotFoundException(`Classroom type with ID ${updateClassRoomDto.classroom_type_id} not found or does not belong to your company`);
        }
        existing.classroom_type_id = updateClassRoomDto.classroom_type_id;
        existing.classroomType = classroomType;
      } else {
        existing.classroom_type_id = null;
        existing.classroomType = null;
      }
    }
    
    // Prevent changing company_id - always use authenticated user's company
    const dtoWithoutCompany = { ...updateClassRoomDto };
    delete (dtoWithoutCompany as any).company_id;
    delete (dtoWithoutCompany as any).classroom_type_id; // Handle separately above
    
    const merged = this.classRoomRepository.merge(existing, dtoWithoutCompany);
    // Ensure company_id remains from authenticated user
    merged.company_id = companyId;
    merged.company = { id: companyId } as any;
    
    try {
      return await this.classRoomRepository.save(merged);
    } catch (error: any) {
      // Handle database unique constraint violation as fallback
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new BadRequestException(`A classroom with code "${updateClassRoomDto.code}" already exists.`);
      }
      throw new BadRequestException('Failed to update classroom');
    }
  }

  async remove(id: number, companyId: number): Promise<void> {
    const existing = await this.findOne(id, companyId);
    await this.classRoomRepository.remove(existing);
  }
}
