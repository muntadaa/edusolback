import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TeachersService } from './teachers.service';
import { Teacher } from './entities/teacher.entity';
import { TeachersQueryDto } from './dto/teachers-query.dto';
import { PaginationService } from '../common/services/pagination.service';

const createRepositoryMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
  createQueryBuilder: jest.fn(),
}) as unknown as jest.Mocked<Repository<Teacher>>;

const createQueryBuilderMock = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
});

describe('TeachersService', () => {
  let service: TeachersService;
  let repository: jest.Mocked<Repository<Teacher>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeachersService,
        {
          provide: getRepositoryToken(Teacher),
          useValue: createRepositoryMock(),
        },
      ],
    }).compile();

    service = module.get<TeachersService>(TeachersService);
    repository = module.get(getRepositoryToken(Teacher)) as unknown as jest.Mocked<Repository<Teacher>>;
  });

  describe('create', () => {
    it('should create, persist and return a teacher', async () => {
      const dto = { first_name: 'Alice' } as any;
      const created = { id: 1 } as Teacher;
      const saved = { id: 1 } as Teacher;
      const expected = { id: 1, first_name: 'Alice' } as Teacher;
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

    it('should throw BadRequestException on save failure', async () => {
      repository.create!.mockReturnValue({} as Teacher);
      repository.save!.mockRejectedValue(new Error('fail'));

      await expect(service.create({} as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated teachers', async () => {
      const qb = createQueryBuilderMock();
      repository.createQueryBuilder!.mockReturnValue(qb as any);
      const items = [{ id: 1 } as Teacher];
      qb.getManyAndCount.mockResolvedValue([items, 1]);
      const query: TeachersQueryDto = { page: 2, limit: 5 };

      const result = await service.findAll(query);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('t');
      expect(qb.andWhere).toHaveBeenCalledWith('t.status <> :deletedStatus', { deletedStatus: -2 });
      expect(qb.skip).toHaveBeenCalledWith(5);
      expect(qb.take).toHaveBeenCalledWith(5);
      expect(result).toEqual(PaginationService.createResponse(items, 2, 5, 1));
    });
  });

  describe('findOne', () => {
    it('should return teacher when found', async () => {
      const teacher = { id: 1 } as Teacher;
      repository.findOne!.mockResolvedValue(teacher);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      const args = repository.findOne.mock.calls[0][0] as any;
      expect(args.where.id).toBe(1);
      expect(args.where.status).toEqual(expect.objectContaining({ value: -2 }));
      expect(args.relations).toEqual(['classRoom', 'company']);
      expect(result).toBe(teacher);
    });

    it('should throw NotFoundException when teacher is missing', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should merge updates and return refreshed teacher', async () => {
      const dto = { first_name: 'Bob' } as any;
      const existing = { id: 1 } as Teacher;
      const merged = { id: 1, first_name: 'Bob' } as Teacher;
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
      expect(result).toBe(merged);
      findOneSpy.mockRestore();
    });

    it('should synchronise relation identifiers when provided', async () => {
      const dto = { company_id: 4, class_room_id: 9 } as any;
      const existing = { id: 1 } as Teacher;
      const merged = { id: 1 } as Teacher;
      const refreshed = { id: 1, company_id: 4, class_room_id: 9 } as Teacher;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(refreshed);
      repository.merge!.mockReturnValue(merged);
      repository.save!.mockResolvedValue(merged);

      await service.update(1, dto);

      const saved = repository.save.mock.calls[0][0] as any;
      expect(saved.company_id).toBe(4);
      expect(saved.company).toEqual({ id: 4 });
      expect(saved.class_room_id).toBe(9);
      expect(saved.classRoom).toEqual({ id: 9 });
      findOneSpy.mockRestore();
    });
  });

  describe('remove', () => {
    it('should remove teacher', async () => {
      const teacher = { id: 1 } as Teacher;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(teacher);

      await service.remove(1);

      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(repository.remove).toHaveBeenCalledWith(teacher);
      findOneSpy.mockRestore();
    });
  });
});
