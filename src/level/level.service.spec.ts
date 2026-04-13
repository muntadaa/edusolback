import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { LevelService } from './level.service';
import { Level } from './entities/level.entity';
import { LevelQueryDto } from './dto/level-query.dto';
import { PaginationService } from '../common/services/pagination.service';

const createRepositoryMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
  createQueryBuilder: jest.fn(),
}) as unknown as jest.Mocked<Repository<Level>>;

const createQueryBuilderMock = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
});

describe('LevelService', () => {
  let service: LevelService;
  let repository: jest.Mocked<Repository<Level>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LevelService,
        {
          provide: getRepositoryToken(Level),
          useValue: createRepositoryMock(),
        },
      ],
    }).compile();

    service = module.get<LevelService>(LevelService);
    repository = module.get(getRepositoryToken(Level)) as unknown as jest.Mocked<Repository<Level>>;
  });

  describe('create', () => {
    it('should persist and return a level', async () => {
      const dto = { title: 'Level 1' } as any;
      const created = { id: 1 } as Level;
      const saved = { id: 1 } as Level;
      const expected = { id: 1, title: 'Level 1' } as Level;
      repository.create!.mockReturnValue(created);
      repository.save!.mockResolvedValue(saved);
      const findOneSpy = jest.spyOn(service, 'findOne').mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(created);
      expect(findOneSpy).toHaveBeenCalledWith(saved.id);
      expect(result).toBe(expected);
      findOneSpy.mockRestore();
    });

    it('should throw BadRequestException when save fails', async () => {
      repository.create!.mockReturnValue({} as Level);
      repository.save!.mockRejectedValue(new Error('fail'));

      await expect(service.create({} as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated levels', async () => {
      const qb = createQueryBuilderMock();
      repository.createQueryBuilder!.mockReturnValue(qb as any);
      const levels = [{ id: 1 }] as Level[];
      qb.getManyAndCount.mockResolvedValue([levels, 1]);
      const query: LevelQueryDto = { page: 1, limit: 5, search: 'Lev', specialization_id: 2, status: 1 };

      const result = await service.findAll(query);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('l');
      expect(qb.andWhere).toHaveBeenCalledWith('l.status <> :deletedStatus', { deletedStatus: -2 });
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('l.specialization', 's');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('s.program', 'p');
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(5);
      expect(result).toEqual(PaginationService.createResponse(levels, 1, 5, 1));
    });
  });

  describe('findOne', () => {
    it('should return level when found', async () => {
      const level = { id: 1 } as Level;
      repository.findOne!.mockResolvedValue(level);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      const args = repository.findOne.mock.calls[0][0] as any;
      expect(args.where.id).toBe(1);
      expect(args.where.status).toEqual(expect.objectContaining({ value: -2 }));
      expect(args.relations).toEqual(['specialization', 'specialization.program']);
      expect(result).toBe(level);
    });

    it('should throw NotFoundException when missing', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should merge updates and return refreshed level', async () => {
      const level = { id: 1, title: 'Old' } as Level;
      const dto = { title: 'New' } as any;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(level)
        .mockResolvedValueOnce({ ...level, title: 'New' });
      const merged = { id: 1, title: 'New' } as Level;
      repository.merge!.mockReturnValue(merged);
      repository.save!.mockResolvedValue(merged);

      const result = await service.update(1, dto);

      expect(repository.merge).toHaveBeenCalledWith(level, dto);
      expect(repository.save).toHaveBeenCalledWith(merged);
      expect(findOneSpy).toHaveBeenNthCalledWith(2, 1);
      expect(result).toEqual({ id: 1, title: 'New' });
      findOneSpy.mockRestore();
    });
  });

  describe('remove', () => {
    it('should remove level after lookup', async () => {
      const level = { id: 1 } as Level;
      const findOneSpy = jest.spyOn(service, 'findOne').mockResolvedValue(level);

      await service.remove(1);

      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(repository.remove).toHaveBeenCalledWith(level);
      findOneSpy.mockRestore();
    });
  });
});
