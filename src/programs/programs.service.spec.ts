import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProgramService } from './programs.service';
import { Program } from './entities/program.entity';
import { ProgramQueryDto } from './dto/program-query.dto';
import { PaginationService } from '../common/services/pagination.service';

const createRepositoryMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
  createQueryBuilder: jest.fn(),
}) as unknown as jest.Mocked<Repository<Program>>;

const createQueryBuilderMock = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
});

describe('ProgramService', () => {
  let service: ProgramService;
  let repository: jest.Mocked<Repository<Program>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramService,
        {
          provide: getRepositoryToken(Program),
          useValue: createRepositoryMock(),
        },
      ],
    }).compile();

    service = module.get<ProgramService>(ProgramService);
    repository = module.get(getRepositoryToken(Program)) as unknown as jest.Mocked<Repository<Program>>;
  });

  describe('create', () => {
    it('should create and return a program', async () => {
      const dto = { title: 'Program' } as any;
      const created = { id: 1 } as Program;
      const saved = { id: 1 } as Program;
      const expected = { id: 1, title: 'Program' } as Program;
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

    it('should throw BadRequestException if save fails', async () => {
      repository.create!.mockReturnValue({} as Program);
      repository.save!.mockRejectedValue(new Error('fail'));

      await expect(service.create({} as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated programs', async () => {
      const qb = createQueryBuilderMock();
      repository.createQueryBuilder!.mockReturnValue(qb as any);
      const programs = [{ id: 1 } as Program];
      qb.getManyAndCount.mockResolvedValue([programs, 1]);
      const query: ProgramQueryDto = {
        page: 1,
        limit: 20,
        search: 'prog',
        status: 1,
      };

      const result = await service.findAll(query);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('p');
      expect(qb.andWhere).toHaveBeenCalledWith('p.status <> :deletedStatus', { deletedStatus: -2 });
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('p.specializations', 's');
      expect(qb.andWhere).toHaveBeenCalledWith('p.title LIKE :search', { search: '%prog%' });
      expect(qb.andWhere).toHaveBeenCalledWith('p.status = :status', { status: 1 });
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(20);
      expect(qb.orderBy).toHaveBeenCalledWith('p.id', 'DESC');
      expect(result).toEqual(PaginationService.createResponse(programs, 1, 20, 1));
    });
  });

  describe('findOne', () => {
    it('should return a program when found', async () => {
      const program = { id: 1 } as Program;
      repository.findOne!.mockResolvedValue(program);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      const args = repository.findOne.mock.calls[0][0] as any;
      expect(args.where.id).toBe(1);
      expect(args.where.status).toEqual(expect.objectContaining({ value: -2 }));
      expect(args.relations).toEqual(['specializations']);
      expect(result).toBe(program);
    });

    it('should throw NotFoundException when missing', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should merge updates and refresh entity', async () => {
      const dto = { title: 'Updated' } as any;
      const existing = { id: 1 } as Program;
      const merged = { id: 1, title: 'Updated' } as Program;
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
  });

  describe('remove', () => {
    it('should remove program after lookup', async () => {
      const program = { id: 1 } as Program;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(program);

      await service.remove(1);

      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(repository.remove).toHaveBeenCalledWith(program);
      findOneSpy.mockRestore();
    });
  });
});
