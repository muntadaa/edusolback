import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SpecializationsService } from './specializations.service';
import { Specialization } from './entities/specialization.entity';
import { SpecializationQueryDto } from './dto/specialization-query.dto';
import { PaginationService } from '../common/services/pagination.service';

const createRepositoryMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
  createQueryBuilder: jest.fn(),
}) as unknown as jest.Mocked<Repository<Specialization>>;

const createQueryBuilderMock = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
});

describe('SpecializationsService', () => {
  let service: SpecializationsService;
  let repository: jest.Mocked<Repository<Specialization>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpecializationsService,
        {
          provide: getRepositoryToken(Specialization),
          useValue: createRepositoryMock(),
        },
      ],
    }).compile();

    service = module.get<SpecializationsService>(SpecializationsService);
    repository = module.get(getRepositoryToken(Specialization)) as unknown as jest.Mocked<Repository<Specialization>>;
  });

  describe('create', () => {
    it('should persist and return a specialization', async () => {
      const dto = { title: 'Spec' } as any;
      const created = { id: 1 } as Specialization;
      const saved = { id: 1 } as Specialization;
      const expected = { id: 1, title: 'Spec' } as Specialization;
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

    it('should wrap save errors in BadRequestException', async () => {
      repository.create!.mockReturnValue({} as Specialization);
      repository.save!.mockRejectedValue(new Error('boom'));

      await expect(service.create({} as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated specializations with filters applied', async () => {
      const qb = createQueryBuilderMock();
      repository.createQueryBuilder!.mockReturnValue(qb as any);
      const specializations = [{ id: 1 } as Specialization];
      qb.getManyAndCount.mockResolvedValue([specializations, 1]);
      const query: SpecializationQueryDto = {
        page: 2,
        limit: 15,
        search: 'spec',
        status: 1,
        program_id: 3,
        company_id: 4,
      };

      const result = await service.findAll(query);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('s');
      expect(qb.andWhere).toHaveBeenCalledWith('s.status <> :deletedStatus', { deletedStatus: -2 });
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('s.program', 'p');
      expect(qb.andWhere).toHaveBeenCalledWith('s.title LIKE :search', { search: '%spec%' });
      expect(qb.andWhere).toHaveBeenCalledWith('s.status = :status', { status: 1 });
      expect(qb.andWhere).toHaveBeenCalledWith('s.program_id = :program_id', { program_id: 3 });
      expect(qb.andWhere).toHaveBeenCalledWith('s.company_id = :company_id', { company_id: 4 });
      expect(qb.skip).toHaveBeenCalledWith((2 - 1) * 15);
      expect(qb.take).toHaveBeenCalledWith(15);
      expect(qb.orderBy).toHaveBeenCalledWith('s.id', 'DESC');
      expect(result).toEqual(PaginationService.createResponse(specializations, 2, 15, 1));
    });
  });

  describe('findOne', () => {
    it('should resolve when specialization exists', async () => {
      const specialization = { id: 1 } as Specialization;
      repository.findOne!.mockResolvedValue(specialization);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      const args = repository.findOne.mock.calls[0][0] as any;
      expect(args.where.id).toBe(1);
      expect(args.where.status).toEqual(expect.objectContaining({ value: -2 }));
      expect(args.relations).toEqual(['program']);
      expect(result).toBe(specialization);
    });

    it('should throw NotFoundException when missing', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should merge updates and return refreshed specialization', async () => {
      const dto = { title: 'updated' } as any;
      const existing = { id: 1 } as Specialization;
      const merged = { id: 1, title: 'updated' } as Specialization;
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
    it('should remove the specialization', async () => {
      const specialization = { id: 1 } as Specialization;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(specialization);

      await service.remove(1);

      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(repository.remove).toHaveBeenCalledWith(specialization);
      findOneSpy.mockRestore();
    });
  });
});
