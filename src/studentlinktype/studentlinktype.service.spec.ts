import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { StudentlinktypeService } from './studentlinktype.service';
import { StudentLinkType } from './entities/studentlinktype.entity';
import { StudentLinkTypeQueryDto } from './dto/studentlinktype-query.dto';
import { PaginationService } from '../common/services/pagination.service';

const createRepositoryMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
  createQueryBuilder: jest.fn(),
}) as unknown as jest.Mocked<Repository<StudentLinkType>>;

const createQueryBuilderMock = () => ({
  andWhere: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
});

describe('StudentlinktypeService', () => {
  let service: StudentlinktypeService;
  let repository: jest.Mocked<Repository<StudentLinkType>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentlinktypeService,
        {
          provide: getRepositoryToken(StudentLinkType),
          useValue: createRepositoryMock(),
        },
      ],
    }).compile();

    service = module.get<StudentlinktypeService>(StudentlinktypeService);
    repository = module.get(getRepositoryToken(StudentLinkType)) as unknown as jest.Mocked<Repository<StudentLinkType>>;
  });

  describe('create', () => {
    it('should create and return a link type', async () => {
      const dto = { title: 'Parent' } as any;
      const created = { id: 1 } as StudentLinkType;
      const saved = { id: 1 } as StudentLinkType;
      const expected = { id: 1, title: 'Parent' } as StudentLinkType;
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
      repository.create!.mockReturnValue({} as StudentLinkType);
      repository.save!.mockRejectedValue(new Error('db error'));

      await expect(service.create({} as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated link types', async () => {
      const qb = createQueryBuilderMock();
      repository.createQueryBuilder!.mockReturnValue(qb as any);
      const items = [{ id: 1 } as StudentLinkType];
      qb.getManyAndCount.mockResolvedValue([items, 1]);
      const query: StudentLinkTypeQueryDto = {
        page: 1,
        limit: 5,
        search: 'parent',
        status: 1,
        company_id: 2,
      };

      const result = await service.findAll(query);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('t');
      expect(qb.andWhere).toHaveBeenCalledWith('t.status <> :deletedStatus', { deletedStatus: -2 });
      expect(qb.andWhere).toHaveBeenCalledWith('t.title LIKE :search', { search: '%parent%' });
      expect(qb.andWhere).toHaveBeenCalledWith('t.status = :status', { status: 1 });
      expect(qb.andWhere).toHaveBeenCalledWith('t.company_id = :company_id', { company_id: 2 });
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(5);
      expect(qb.orderBy).toHaveBeenCalledWith('t.id', 'DESC');
      expect(result).toEqual(PaginationService.createResponse(items, 1, 5, 1));
    });
  });

  describe('findOne', () => {
    it('should return link type if found', async () => {
      const entity = { id: 1 } as StudentLinkType;
      repository.findOne!.mockResolvedValue(entity);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      const args = repository.findOne.mock.calls[0][0] as any;
      expect(args.where.id).toBe(1);
      expect(args.where.status).toEqual(expect.objectContaining({ value: -2 }));
      expect(result).toBe(entity);
    });

    it('should throw NotFoundException if missing', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should merge updates and return refreshed link type', async () => {
      const dto = { title: 'Guardian' } as any;
      const existing = { id: 1 } as StudentLinkType;
      const merged = { id: 1, title: 'Guardian' } as StudentLinkType;
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
    it('should remove link type', async () => {
      const entity = { id: 1 } as StudentLinkType;
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
