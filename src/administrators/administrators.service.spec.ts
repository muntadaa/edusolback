import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdministratorsService } from './administrators.service';
import { Administrator } from './entities/administrator.entity';
import { Repository } from 'typeorm';
import { AdministratorsQueryDto } from './dto/administrators-query.dto';
import { PaginationService } from '../common/services/pagination.service';

const createRepositoryMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
  createQueryBuilder: jest.fn(),
}) as unknown as jest.Mocked<Repository<Administrator>>;

const createQueryBuilderMock = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
});

describe('AdministratorsService', () => {
  let service: AdministratorsService;
  let repository: jest.Mocked<Repository<Administrator>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdministratorsService,
        {
          provide: getRepositoryToken(Administrator),
          useValue: createRepositoryMock(),
        },
      ],
    }).compile();

    service = module.get<AdministratorsService>(AdministratorsService);
    repository = module.get(getRepositoryToken(Administrator)) as unknown as jest.Mocked<Repository<Administrator>>;
  });

  describe('create', () => {
    it('should create, save and return the administrator', async () => {
      const dto = { first_name: 'John' } as any;
      const created = { id: 1 } as Administrator;
      const saved = { id: 1 } as Administrator;
      const expected = { id: 1, first_name: 'John' } as Administrator;
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
      const dto = { first_name: 'John' } as any;
      repository.create!.mockReturnValue({} as Administrator);
      repository.save!.mockRejectedValue(new Error('failure'));

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should apply filters and return paginated administrators', async () => {
      const qb = createQueryBuilderMock();
      repository.createQueryBuilder!.mockReturnValue(qb as any);
      const administrators = [{ id: 1 } as Administrator];
      qb.getManyAndCount.mockResolvedValue([administrators, 1]);
      const query: AdministratorsQueryDto = {
        page: 2,
        limit: 5,
        search: 'john',
        company_id: 3,
        class_room_id: 4,
        status: 1,
      };

      const result = await service.findAll(query);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('a');
      expect(qb.andWhere).toHaveBeenCalledWith('a.status <> :deletedStatus', { deletedStatus: -2 });
      expect(qb.andWhere).toHaveBeenCalledWith(
        '(a.first_name LIKE :search OR a.last_name LIKE :search OR a.email LIKE :search)',
        { search: '%john%' },
      );
      expect(qb.andWhere).toHaveBeenCalledWith('a.company_id = :company_id', { company_id: 3 });
      expect(qb.andWhere).toHaveBeenCalledWith('a.class_room_id = :class_room_id', { class_room_id: 4 });
      expect(qb.andWhere).toHaveBeenCalledWith('a.status = :status', { status: 1 });
      expect(qb.skip).toHaveBeenCalledWith(5);
      expect(qb.take).toHaveBeenCalledWith(5);
      expect(qb.orderBy).toHaveBeenCalledWith('a.id', 'DESC');
      expect(result).toEqual(PaginationService.createResponse(administrators, 2, 5, 1));
    });
  });

  describe('findOne', () => {
    it('should return the administrator when found', async () => {
      const administrator = { id: 1 } as Administrator;
      repository.findOne!.mockResolvedValue(administrator);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      const args = repository.findOne.mock.calls[0][0] as any;
      expect(args.where.id).toBe(1);
      expect(args.where.status).toEqual(expect.objectContaining({ value: -2 }));
      expect(args.relations).toEqual(['classRoom', 'company']);
      expect(result).toBe(administrator);
    });

    it('should throw NotFoundException when administrator does not exist', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should merge, save and return updated administrator', async () => {
      const dto = { first_name: 'Jane' } as any;
      const existing = { id: 1 } as Administrator;
      const merged = { id: 1, first_name: 'Jane' } as Administrator;
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
      const dto = { company_id: 2, class_room_id: 5 } as any;
      const existing = { id: 1 } as Administrator;
      const merged = { id: 1 } as Administrator;
      const refreshed = { id: 1, company_id: 2, class_room_id: 5 } as Administrator;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(refreshed);
      repository.merge!.mockReturnValue(merged);
      repository.save!.mockResolvedValue(merged);

      await service.update(1, dto);

      const saved = repository.save.mock.calls[0][0] as any;
      expect(saved.company_id).toBe(2);
      expect(saved.company).toEqual({ id: 2 });
      expect(saved.class_room_id).toBe(5);
      expect(saved.classRoom).toEqual({ id: 5 });
      findOneSpy.mockRestore();
    });
  });

  describe('remove', () => {
    it('should remove the administrator', async () => {
      const administrator = { id: 1 } as Administrator;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(administrator);

      await service.remove(1);

      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(repository.remove).toHaveBeenCalledWith(administrator);
      findOneSpy.mockRestore();
    });
  });
});
