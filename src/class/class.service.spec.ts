import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ClassService } from './class.service';
import { ClassEntity } from './entities/class.entity';
import { ClassQueryDto } from './dto/class-query.dto';
import { PaginationService } from '../common/services/pagination.service';

const createRepositoryMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
  createQueryBuilder: jest.fn(),
}) as unknown as jest.Mocked<Repository<ClassEntity>>;

const createQueryBuilderMock = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
});

describe('ClassService', () => {
  let service: ClassService;
  let repository: jest.Mocked<Repository<ClassEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassService,
        {
          provide: getRepositoryToken(ClassEntity),
          useValue: createRepositoryMock(),
        },
      ],
    }).compile();

    service = module.get<ClassService>(ClassService);
    repository = module.get(getRepositoryToken(ClassEntity)) as unknown as jest.Mocked<Repository<ClassEntity>>;
  });

  describe('create', () => {
    it('should create a class and return the persisted entity', async () => {
      const dto = { title: 'Class A' } as any;
      const created = { id: 1 } as ClassEntity;
      const saved = { id: 1 } as ClassEntity;
      const expected = { id: 1, title: 'Class A' } as ClassEntity;
      repository.create!.mockReturnValue(created);
      repository.save!.mockResolvedValue(saved);
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(created);
      expect(findOneSpy).toHaveBeenCalledWith(saved.id);
      expect(result).toBe(expected);
      findOneSpy.mockRestore();
    });

    it('should throw BadRequestException when persistence fails', async () => {
      repository.create!.mockReturnValue({} as ClassEntity);
      repository.save!.mockRejectedValue(new Error('failed'));

      await expect(service.create({} as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should build the query with filters and return paginated response', async () => {
      const qb = createQueryBuilderMock();
      repository.createQueryBuilder!.mockReturnValue(qb as any);
      const classes = [{ id: 1 } as ClassEntity];
      qb.getManyAndCount.mockResolvedValue([classes, 1]);
      const query: ClassQueryDto = {
        page: 3,
        limit: 10,
        search: 'A',
        program_id: 2,
        specialization_id: 3,
        level_id: 4,
        school_year_id: 5,
        school_year_period_id: 6,
        company_id: 7,
        status: 1,
      };

      const result = await service.findAll(query);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('c');
      expect(qb.andWhere).toHaveBeenCalledWith('c.status <> :deletedStatus', { deletedStatus: -2 });
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('c.program', 'program');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('c.specialization', 'specialization');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('c.level', 'level');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('c.schoolYear', 'schoolYear');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('c.schoolYearPeriod', 'schoolYearPeriod');
      expect(qb.andWhere).toHaveBeenCalledWith('(c.title LIKE :search OR c.description LIKE :search)', {
        search: '%A%',
      });
      expect(qb.andWhere).toHaveBeenCalledWith('c.program_id = :program_id', { program_id: 2 });
      expect(qb.andWhere).toHaveBeenCalledWith('c.specialization_id = :specialization_id', { specialization_id: 3 });
      expect(qb.andWhere).toHaveBeenCalledWith('c.level_id = :level_id', { level_id: 4 });
      expect(qb.andWhere).toHaveBeenCalledWith('c.school_year_id = :school_year_id', { school_year_id: 5 });
      expect(qb.andWhere).toHaveBeenCalledWith('c.school_year_period_id = :school_year_period_id', {
        school_year_period_id: 6,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('c.company_id = :company_id', { company_id: 7 });
      expect(qb.andWhere).toHaveBeenCalledWith('c.status = :status', { status: 1 });
      expect(qb.skip).toHaveBeenCalledWith((3 - 1) * 10);
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(qb.orderBy).toHaveBeenCalledWith('c.id', 'DESC');
      expect(result).toEqual(PaginationService.createResponse(classes, 3, 10, 1));
    });
  });

  describe('findOne', () => {
    it('should return the class when found', async () => {
      const entity = { id: 1 } as ClassEntity;
      repository.findOne!.mockResolvedValue(entity);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      const args = repository.findOne.mock.calls[0][0] as any;
      expect(args.where.id).toBe(1);
      expect(args.where.status).toEqual(expect.objectContaining({ value: -2 }));
      expect(args.relations).toEqual(['program', 'specialization', 'level', 'schoolYear', 'schoolYearPeriod']);
      expect(result).toBe(entity);
    });

    it('should throw NotFoundException when the class is missing', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should merge updates and return the refreshed class', async () => {
      const dto = { title: 'Updated' } as any;
      const existing = { id: 1 } as ClassEntity;
      const merged = { id: 1, title: 'Updated' } as ClassEntity;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(merged);
      repository.merge!.mockReturnValue(merged);
      repository.save!.mockResolvedValue(merged);

      const result = await service.update(1, dto);

      expect(findOneSpy).toHaveBeenNthCalledWith(1, 1);
      expect(repository.merge).toHaveBeenCalledWith(existing, dto);
      expect(repository.save).toHaveBeenCalledWith(merged);
      expect(findOneSpy).toHaveBeenNthCalledWith(2, 1);
      expect(result).toBe(merged);
      findOneSpy.mockRestore();
    });

    it('should synchronise relation identifiers when provided', async () => {
      const dto = {
        program_id: 2,
        specialization_id: 3,
        level_id: 4,
        school_year_id: 5,
        school_year_period_id: 6,
        company_id: 7,
      } as any;
      const existing = { id: 1 } as ClassEntity;
      const merged = { id: 1 } as ClassEntity;
      const refreshed = { id: 1, ...dto } as ClassEntity;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(refreshed);
      repository.merge!.mockReturnValue(merged);
      repository.save!.mockResolvedValue(merged);

      await service.update(1, dto);

      const saved = repository.save.mock.calls[0][0] as any;
      expect(saved.program_id).toBe(2);
      expect(saved.program).toEqual({ id: 2 });
      expect(saved.specialization_id).toBe(3);
      expect(saved.specialization).toEqual({ id: 3 });
      expect(saved.level_id).toBe(4);
      expect(saved.level).toEqual({ id: 4 });
      expect(saved.school_year_id).toBe(5);
      expect(saved.schoolYear).toEqual({ id: 5 });
      expect(saved.school_year_period_id).toBe(6);
      expect(saved.schoolYearPeriod).toEqual({ id: 6 });
      expect(saved.company_id).toBe(7);
      expect(saved.company).toEqual({ id: 7 });
      findOneSpy.mockRestore();
    });
  });

  describe('remove', () => {
    it('should remove the class after retrieval', async () => {
      const entity = { id: 1 } as ClassEntity;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(entity);

      await service.remove(1);

      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(repository.remove).toHaveBeenCalledWith(entity);
      findOneSpy.mockRestore();
    });
  });
});
