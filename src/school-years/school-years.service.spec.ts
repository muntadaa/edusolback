import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { SchoolYearsService } from './school-years.service';
import { SchoolYear } from './entities/school-year.entity';
import { Company } from '../company/entities/company.entity';
import { SchoolYearQueryDto } from './dto/school-year-query.dto';

const createSchoolYearRepoMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
}) as unknown as jest.Mocked<Repository<SchoolYear>>;

const createCompanyRepoMock = () => ({
  findOne: jest.fn(),
}) as unknown as jest.Mocked<Repository<Company>>;

const createQueryBuilderMock = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
});

describe('SchoolYearsService', () => {
  let service: SchoolYearsService;
  let schoolYearRepo: jest.Mocked<Repository<SchoolYear>>;
  let companyRepo: jest.Mocked<Repository<Company>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolYearsService,
        {
          provide: getRepositoryToken(SchoolYear),
          useValue: createSchoolYearRepoMock(),
        },
        {
          provide: getRepositoryToken(Company),
          useValue: createCompanyRepoMock(),
        },
      ],
    }).compile();

    service = module.get<SchoolYearsService>(SchoolYearsService);
    schoolYearRepo = module.get(getRepositoryToken(SchoolYear)) as unknown as jest.Mocked<Repository<SchoolYear>>;
    companyRepo = module.get(getRepositoryToken(Company)) as unknown as jest.Mocked<Repository<Company>>;
  });

  describe('create', () => {
    it('should validate company and dates then save', async () => {
      const dto = {
        title: '2024-2025',
        start_date: '2024-09-01',
        end_date: '2025-06-30',
        status: 1,
        companyId: 5,
      } as any;
      const company = { id: 5 } as Company;
      const schoolYear = { id: 1 } as SchoolYear;
      companyRepo.findOne!.mockResolvedValue(company);
      schoolYearRepo.create!.mockReturnValue(schoolYear);
      schoolYearRepo.save!.mockResolvedValue(schoolYear);

      const result = await service.create(dto);

      expect(companyRepo.findOne).toHaveBeenCalledWith({ where: { id: 5, status: Not(-2) } });
      expect(schoolYearRepo.create).toHaveBeenCalledWith({
        title: '2024-2025',
        start_date: '2024-09-01',
        end_date: '2025-06-30',
        status: 1,
        company,
      });
      expect(schoolYearRepo.save).toHaveBeenCalledWith(schoolYear);
      expect(result).toBe(schoolYear);
    });

    it('should throw NotFoundException when company missing', async () => {
      companyRepo.findOne!.mockResolvedValue(null);

      await expect(
        service.create({
          title: '2024',
          start_date: '2024-09-01',
          end_date: '2025-06-30',
          companyId: 1,
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject invalid date range', async () => {
      companyRepo.findOne!.mockResolvedValue({ id: 1 } as Company);

      await expect(
        service.create({
          title: '2024',
          start_date: '2024-09-01',
          end_date: 'invalid',
          companyId: 1,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return data with pagination meta', async () => {
      const qb = createQueryBuilderMock();
      schoolYearRepo.createQueryBuilder!.mockReturnValue(qb as any);
      qb.getManyAndCount.mockResolvedValue([[{ id: 1 } as SchoolYear], 1]);
      const query: SchoolYearQueryDto = { page: 2, limit: 3, title: '2024' };

      const result = await service.findAll(query);

      expect(schoolYearRepo.createQueryBuilder).toHaveBeenCalledWith('sy');
      expect(qb.andWhere).toHaveBeenCalledWith('sy.status <> :deletedStatus', { deletedStatus: -2 });
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('sy.company', 'company');
      expect(qb.skip).toHaveBeenCalledWith(3);
      expect(qb.take).toHaveBeenCalledWith(3);
      expect(result).toEqual({
        data: [{ id: 1 }],
        meta: {
          total: 1,
          page: 2,
          limit: 3,
          lastPage: 1,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return school year when found', async () => {
      const schoolYear = { id: 1, status: 1 } as SchoolYear;
      schoolYearRepo.findOne!.mockResolvedValue(schoolYear);

      const result = await service.findOne(1);

      expect(schoolYearRepo.findOne).toHaveBeenCalledTimes(1);
      const args = schoolYearRepo.findOne.mock.calls[0][0] as any;
      expect(args.where.id).toBe(1);
      expect(args.where.status).toEqual(expect.objectContaining({ value: -2 }));
      expect(args.relations).toEqual(['company']);
      expect(result).toBe(schoolYear);
    });

    it('should throw NotFoundException when absent', async () => {
      schoolYearRepo.findOne!.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });

  });

  describe('update', () => {
    it('should merge updates and save', async () => {
      const schoolYear = { id: 1, title: 'Old' } as SchoolYear;
      const dto = { title: 'New' } as any;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(schoolYear);
      schoolYearRepo.save!.mockResolvedValue(schoolYear);

      const result = await service.update(1, dto);

      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(schoolYear.title).toBe('New');
      expect(schoolYearRepo.save).toHaveBeenCalledWith(schoolYear);
      expect(result).toBe(schoolYear);
      findOneSpy.mockRestore();
    });
  });

  describe('remove', () => {
    it('should remove school year', async () => {
      const schoolYear = { id: 1 } as SchoolYear;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(schoolYear);
      schoolYearRepo.remove!.mockResolvedValue(schoolYear);

      const result = await service.remove(1);

      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(schoolYearRepo.remove).toHaveBeenCalledWith(schoolYear);
      expect(result).toBe(schoolYear);
      findOneSpy.mockRestore();
    });
  });
});
