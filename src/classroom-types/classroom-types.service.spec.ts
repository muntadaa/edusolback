import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ClassroomTypesService } from './classroom-types.service';
import { ClassroomType } from './entities/classroom-type.entity';
import { ClassroomTypeQueryDto } from './dto/classroom-type-query.dto';
import { PaginationService } from '../common/services/pagination.service';

const createRepositoryMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
  createQueryBuilder: jest.fn(),
}) as unknown as jest.Mocked<Repository<ClassroomType>>;

const createQueryBuilderMock = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
});

describe('ClassroomTypesService', () => {
  let service: ClassroomTypesService;
  let repository: jest.Mocked<Repository<ClassroomType>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassroomTypesService,
        {
          provide: getRepositoryToken(ClassroomType),
          useValue: createRepositoryMock(),
        },
      ],
    }).compile();

    service = module.get<ClassroomTypesService>(ClassroomTypesService);
    repository = module.get(getRepositoryToken(ClassroomType)) as unknown as jest.Mocked<Repository<ClassroomType>>;
  });

  describe('create', () => {
    it('should create and return a classroom type', async () => {
      const dto = { title: 'Lecture Hall' } as any;
      const companyId = 1;
      const created = { id: 1 } as ClassroomType;
      const saved = { id: 1 } as ClassroomType;
      const expected = { id: 1, title: 'Lecture Hall' } as ClassroomType;
      repository.create!.mockReturnValue(created);
      repository.save!.mockResolvedValue(saved);
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(expected);

      const result = await service.create(dto, companyId);

      expect(repository.create).toHaveBeenCalledWith({ ...dto, company_id: companyId });
      expect(repository.save).toHaveBeenCalledWith(created);
      expect(findOneSpy).toHaveBeenCalledWith(saved.id, companyId);
      expect(result).toBe(expected);
      findOneSpy.mockRestore();
    });

    it('should throw BadRequestException when save fails', async () => {
      repository.create!.mockReturnValue({} as ClassroomType);
      repository.save!.mockRejectedValue(new Error('db error'));

      await expect(service.create({} as any, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated classroom types', async () => {
      const qb = createQueryBuilderMock();
      repository.createQueryBuilder!.mockReturnValue(qb as any);
      const items = [{ id: 1 } as ClassroomType];
      qb.getManyAndCount.mockResolvedValue([items, 1]);
      const query: ClassroomTypeQueryDto = {
        page: 1,
        limit: 5,
        search: 'lecture',
        status: 1,
      };
      const companyId = 1;

      const result = await service.findAll(query, companyId);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('t');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('t.company', 'company');
      expect(qb.andWhere).toHaveBeenCalledWith('t.status <> :deletedStatus', { deletedStatus: -2 });
      expect(qb.andWhere).toHaveBeenCalledWith('t.company_id = :company_id', { company_id: companyId });
      expect(qb.andWhere).toHaveBeenCalledWith('t.title LIKE :search', { search: '%lecture%' });
      expect(qb.andWhere).toHaveBeenCalledWith('t.status = :status', { status: 1 });
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(5);
      expect(qb.orderBy).toHaveBeenCalledWith('t.id', 'DESC');
      expect(result).toEqual(PaginationService.createResponse(items, 1, 5, 1));
    });
  });

  describe('findOne', () => {
    it('should return classroom type if found', async () => {
      const entity = { id: 1 } as ClassroomType;
      repository.findOne!.mockResolvedValue(entity);
      const companyId = 1;

      const result = await service.findOne(1, companyId);

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      const args = repository.findOne.mock.calls[0][0] as any;
      expect(args.where.id).toBe(1);
      expect(args.where.company_id).toBe(companyId);
      expect(args.where.status).toEqual(expect.objectContaining({ value: -2 }));
      expect(result).toBe(entity);
    });

    it('should throw NotFoundException if missing', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne(1, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should merge updates and return refreshed classroom type', async () => {
      const dto = { title: 'Computer Lab' } as any;
      const companyId = 1;
      const existing = { id: 1 } as ClassroomType;
      const merged = { id: 1, title: 'Computer Lab' } as ClassroomType;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(merged);
      repository.merge!.mockReturnValue(merged);
      repository.save!.mockResolvedValue(merged);

      const result = await service.update(1, dto, companyId);

      expect(findOneSpy).toHaveBeenNthCalledWith(1, 1, companyId);
      expect(repository.merge).toHaveBeenCalledWith(existing, expect.objectContaining({ title: 'Computer Lab' }));
      expect(repository.save).toHaveBeenCalledWith(merged);
      expect(findOneSpy).toHaveBeenNthCalledWith(2, 1, companyId);
      expect(result).toBe(merged);
      findOneSpy.mockRestore();
    });
  });

  describe('remove', () => {
    it('should remove classroom type', async () => {
      const entity = { id: 1 } as ClassroomType;
      const companyId = 1;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(entity);

      await service.remove(1, companyId);

      expect(findOneSpy).toHaveBeenCalledWith(1, companyId);
      expect(repository.remove).toHaveBeenCalledWith(entity);
      findOneSpy.mockRestore();
    });
  });
});

