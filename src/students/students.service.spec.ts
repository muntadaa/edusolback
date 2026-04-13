import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { StudentsService } from './students.service';
import { Student } from './entities/student.entity';
import { StudentsQueryDto } from './dto/students-query.dto';
import { PaginationService } from '../common/services/pagination.service';

const createRepositoryMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
  createQueryBuilder: jest.fn(),
}) as unknown as jest.Mocked<Repository<Student>>;

const createQueryBuilderMock = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
});

describe('StudentsService', () => {
  let service: StudentsService;
  let repository: jest.Mocked<Repository<Student>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        {
          provide: getRepositoryToken(Student),
          useValue: createRepositoryMock(),
        },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    repository = module.get(getRepositoryToken(Student)) as unknown as jest.Mocked<Repository<Student>>;
  });

  describe('create', () => {
    it('should create, persist and return a student', async () => {
      const dto = { first_name: 'Sam' } as any;
      const created = { id: 1 } as Student;
      const saved = { id: 1 } as Student;
      const expected = { id: 1, first_name: 'Sam' } as Student;
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

    it('should throw BadRequestException on persistence failure', async () => {
      repository.create!.mockReturnValue({} as Student);
      repository.save!.mockRejectedValue(new Error('fail'));

      await expect(service.create({} as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated students', async () => {
      const qb = createQueryBuilderMock();
      repository.createQueryBuilder!.mockReturnValue(qb as any);
      const items = [{ id: 1 } as Student];
      qb.getManyAndCount.mockResolvedValue([items, 1]);
      const query: StudentsQueryDto = { page: 1, limit: 10 };

      const result = await service.findAll(query);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('s');
      expect(qb.andWhere).toHaveBeenCalledWith('s.status <> :deletedStatus', { deletedStatus: -2 });
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(result).toEqual(PaginationService.createResponse(items, 1, 10, 1));
    });
  });

  describe('findOne', () => {
    it('should return student when present', async () => {
      const student = { id: 1 } as Student;
      repository.findOne!.mockResolvedValue(student);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      const args = repository.findOne.mock.calls[0][0] as any;
      expect(args.where.id).toBe(1);
      expect(args.where.status).toEqual(expect.objectContaining({ value: -2 }));
      expect(args.relations).toEqual(['classRoom', 'company']);
      expect(result).toBe(student);
    });

    it('should throw NotFoundException when student missing', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should merge updates and return refreshed student', async () => {
      const dto = { first_name: 'Updated' } as any;
      const existing = { id: 1 } as Student;
      const merged = { id: 1, first_name: 'Updated' } as Student;
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
      const dto = { company_id: 4, class_room_id: 11 } as any;
      const existing = { id: 1 } as Student;
      const merged = { id: 1 } as Student;
      const refreshed = { id: 1, company_id: 4, class_room_id: 11 } as Student;
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
      expect(saved.class_room_id).toBe(11);
      expect(saved.classRoom).toEqual({ id: 11 });
      findOneSpy.mockRestore();
    });
  });

  describe('remove', () => {
    it('should remove the student', async () => {
      const student = { id: 1 } as Student;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(student);

      await service.remove(1);

      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(repository.remove).toHaveBeenCalledWith(student);
      findOneSpy.mockRestore();
    });
  });
});
