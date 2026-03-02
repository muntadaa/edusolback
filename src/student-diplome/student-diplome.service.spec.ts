import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { StudentDiplomeService } from './student-diplome.service';
import { StudentDiplome } from './entities/student-diplome.entity';
import { StudentDiplomesQueryDto } from './dto/student-diplomes-query.dto';
import { PaginationService } from '../common/services/pagination.service';

const createRepositoryMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
  createQueryBuilder: jest.fn(),
}) as unknown as jest.Mocked<Repository<StudentDiplome>>;

const createQueryBuilderMock = () => ({
  andWhere: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
});

describe('StudentDiplomeService', () => {
  let service: StudentDiplomeService;
  let repository: jest.Mocked<Repository<StudentDiplome>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentDiplomeService,
        {
          provide: getRepositoryToken(StudentDiplome),
          useValue: createRepositoryMock(),
        },
      ],
    }).compile();

    service = module.get<StudentDiplomeService>(StudentDiplomeService);
    repository = module.get(getRepositoryToken(StudentDiplome)) as unknown as jest.Mocked<Repository<StudentDiplome>>;
  });

  describe('create', () => {
    it('should persist and return a diplome', async () => {
      const dto = { title: 'BSc' } as any;
      const created = { id: 1 } as StudentDiplome;
      const saved = { id: 1 } as StudentDiplome;
      const expected = { id: 1, title: 'BSc' } as StudentDiplome;
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

    it('should throw BadRequestException when save fails', async () => {
      repository.create!.mockReturnValue({} as StudentDiplome);
      repository.save!.mockRejectedValue(new Error('db'));

      await expect(service.create({} as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated diplomes', async () => {
      const qb = createQueryBuilderMock();
      repository.createQueryBuilder!.mockReturnValue(qb as any);
      const items = [{ id: 1 } as StudentDiplome];
      qb.getManyAndCount.mockResolvedValue([items, 1]);
      const query: StudentDiplomesQueryDto = { page: 1, limit: 8 };

      const result = await service.findAll(query);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('d');
      expect(qb.andWhere).toHaveBeenCalledWith('d.status <> :deletedStatus', { deletedStatus: -2 });
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(8);
      expect(result).toEqual(PaginationService.createResponse(items, 1, 8, 1));
    });
  });

  describe('findOne', () => {
    it('should return diplome if found', async () => {
      const entity = { id: 1 } as StudentDiplome;
      repository.findOne!.mockResolvedValue(entity);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      const args = repository.findOne.mock.calls[0][0] as any;
      expect(args.where.id).toBe(1);
      expect(args.where.status).toEqual(expect.objectContaining({ value: -2 }));
      expect(result).toBe(entity);
    });

    it('should throw NotFoundException when missing', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should merge updates and return refreshed diplome', async () => {
      const dto = { title: 'MSc' } as any;
      const existing = { id: 1 } as StudentDiplome;
      const merged = { id: 1, title: 'MSc' } as StudentDiplome;
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
  });

  describe('remove', () => {
    it('should remove the diplome', async () => {
      const entity = { id: 1 } as StudentDiplome;
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
