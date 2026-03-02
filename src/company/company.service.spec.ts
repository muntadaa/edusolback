import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { CompanyService } from './company.service';
import { Company } from './entities/company.entity';
import { CompanyQueryDto } from './dto/company-query.dto';
import { PaginationService } from '../common/services/pagination.service';

const createRepositoryMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
  createQueryBuilder: jest.fn(),
}) as unknown as jest.Mocked<Repository<Company>>;

const createQueryBuilderMock = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
});

describe('CompanyService', () => {
  let service: CompanyService;
  let repository: jest.Mocked<Repository<Company>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: getRepositoryToken(Company),
          useValue: createRepositoryMock(),
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
    repository = module.get(getRepositoryToken(Company)) as unknown as jest.Mocked<Repository<Company>>;
  });

  describe('create', () => {
    it('should create and save company', async () => {
      const dto = { name: 'Acme' } as any;
      const company = { id: 1 } as Company;
      repository.create!.mockReturnValue(company);
      repository.save!.mockResolvedValue(company);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(company);
      expect(result).toBe(company);
    });
  });

  describe('findAll', () => {
    it('should return paginated companies', async () => {
      const qb = createQueryBuilderMock();
      repository.createQueryBuilder!.mockReturnValue(qb as any);
      const companies = [{ id: 1 }] as Company[];
      qb.getManyAndCount.mockResolvedValue([companies, 1]);
      const query: CompanyQueryDto = { page: 1, limit: 5, search: 'ac', status: 1 };

      const result = await service.findAll(query);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('c');
      expect(qb.andWhere).toHaveBeenCalledWith('c.status <> :deletedStatus', { deletedStatus: -2 });
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('c.users', 'users');
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(5);
      expect(result).toEqual(PaginationService.createResponse(companies, 1, 5, 1));
    });
  });

  describe('findOne', () => {
    it('should return company when found', async () => {
      const company = { id: 1 } as Company;
      repository.findOne!.mockResolvedValue(company);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      const args = repository.findOne.mock.calls[0][0] as any;
      expect(args.where.id).toBe(1);
      expect(args.where.status).toEqual(expect.objectContaining({ value: -2 }));
      expect(args.relations).toEqual(['users']);
      expect(result).toBe(company);
    });

    it('should throw NotFoundException when missing', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update fields and save company', async () => {
      const company = { id: 1, name: 'Old' } as Company;
      const dto = { name: 'New' } as any;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(company);
      repository.save!.mockResolvedValue(company);

      const result = await service.update(1, dto);

      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(company.name).toBe('New');
      expect(repository.save).toHaveBeenCalledWith(company);
      expect(result).toBe(company);
      findOneSpy.mockRestore();
    });
  });

  describe('remove', () => {
    it('should remove company after lookup', async () => {
      const company = { id: 1 } as Company;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(company);
      repository.remove!.mockResolvedValue(company);

      await service.remove(1);

      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(repository.remove).toHaveBeenCalledWith(company);
      findOneSpy.mockRestore();
    });
  });
});
