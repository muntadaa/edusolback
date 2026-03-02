import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { SchoolYearPeriodsService } from './school-year-periods.service';
import { SchoolYearPeriod } from './entities/school-year-period.entity';
import { SchoolYear } from '../school-years/entities/school-year.entity';
import { SchoolYearPeriodQueryDto } from './dto/school-year-period-query.dto';

const createPeriodRepoMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
}) as unknown as jest.Mocked<Repository<SchoolYearPeriod>>;

const createSchoolYearRepoMock = () => ({
  findOne: jest.fn(),
}) as unknown as jest.Mocked<Repository<SchoolYear>>;

const createQueryBuilderMock = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
});

describe('SchoolYearPeriodsService', () => {
  let service: SchoolYearPeriodsService;
  let periodRepo: jest.Mocked<Repository<SchoolYearPeriod>>;
  let schoolYearRepo: jest.Mocked<Repository<SchoolYear>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolYearPeriodsService,
        {
          provide: getRepositoryToken(SchoolYearPeriod),
          useValue: createPeriodRepoMock(),
        },
        {
          provide: getRepositoryToken(SchoolYear),
          useValue: createSchoolYearRepoMock(),
        },
      ],
    }).compile();

    service = module.get<SchoolYearPeriodsService>(SchoolYearPeriodsService);
    periodRepo = module.get(getRepositoryToken(SchoolYearPeriod)) as unknown as jest.Mocked<Repository<SchoolYearPeriod>>;
    schoolYearRepo = module.get(getRepositoryToken(SchoolYear)) as unknown as jest.Mocked<Repository<SchoolYear>>;
  });

  describe('create', () => {
    it('should validate inputs, map status and save the period', async () => {
      const dto = {
        title: 'Q1',
        start_date: '2024-09-01',
        end_date: '2024-12-31',
        status: 'active',
        schoolYearId: 2,
      } as any;
      const parent = { id: 2 } as SchoolYear;
      const period = { id: 1 } as SchoolYearPeriod;
      schoolYearRepo.findOne!.mockResolvedValue(parent);
      periodRepo.create!.mockReturnValue(period);
      periodRepo.save!.mockResolvedValue(period);

      const result = await service.create(dto);

      expect(schoolYearRepo.findOne).toHaveBeenCalledWith({ where: { id: 2, status: Not(-2) } });
      expect(periodRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Q1',
          status: 1,
          schoolYear: parent,
        }),
      );
      expect(periodRepo.save).toHaveBeenCalledWith(period);
      expect(result).toBe(period);
    });

    it('should throw NotFoundException when parent school year is missing', async () => {
      schoolYearRepo.findOne!.mockResolvedValue(null);

      await expect(
        service.create({
          title: 'Q1',
          start_date: '2024-09-01',
          end_date: '2024-12-31',
          schoolYearId: 2,
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject invalid date ranges', async () => {
      const parent = { id: 2 } as SchoolYear;
      schoolYearRepo.findOne!.mockResolvedValue(parent);

      await expect(
        service.create({
          title: 'Invalid',
          start_date: '2024-10-01',
          end_date: '2024-09-01',
          schoolYearId: 2,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should build query and return pagination meta', async () => {
      const qb = createQueryBuilderMock();
      periodRepo.createQueryBuilder!.mockReturnValue(qb as any);
      qb.getManyAndCount.mockResolvedValue([[{ id: 1 } as SchoolYearPeriod], 1]);
      const query: SchoolYearPeriodQueryDto = { page: 2, limit: 5, title: 'Q' };

      const result = await service.findAll(query);

      expect(periodRepo.createQueryBuilder).toHaveBeenCalledWith('p');
      expect(qb.andWhere).toHaveBeenCalledWith('p.status <> :deletedStatus', { deletedStatus: -2 });
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('p.schoolYear', 'schoolYear');
      expect(qb.orderBy).toHaveBeenCalledWith('p.id', 'DESC');
      expect(qb.skip).toHaveBeenCalledWith(5);
      expect(qb.take).toHaveBeenCalledWith(5);
      expect(result).toEqual({
        data: [{ id: 1 }],
        meta: {
          total: 1,
          page: 2,
          limit: 5,
          lastPage: 1,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return the period when found', async () => {
      const period = { id: 1, status: 1 } as SchoolYearPeriod;
      periodRepo.findOne!.mockResolvedValue(period);

      const result = await service.findOne(1);

      expect(periodRepo.findOne).toHaveBeenCalledTimes(1);
      const args = periodRepo.findOne.mock.calls[0][0] as any;
      expect(args.where.id).toBe(1);
      expect(args.where.status).toEqual(expect.objectContaining({ value: -2 }));
      expect(args.relations).toEqual(['schoolYear']);
      expect(result).toBe(period);
    });

    it('should throw NotFoundException when missing', async () => {
      periodRepo.findOne!.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });

  });

  describe('update', () => {
    it('should merge updates, validate and save', async () => {
      const period = {
        id: 1,
        title: 'Q1',
        start_date: new Date('2024-09-01'),
        end_date: new Date('2024-12-31'),
        status: 1,
      } as unknown as SchoolYearPeriod;
      const parent = { id: 3 } as SchoolYear;
      const dto = {
        title: 'Q2',
        start_date: '2025-01-01',
        end_date: '2025-03-31',
        status: 'archived',
        schoolYearId: 3,
      } as any;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(period);
      schoolYearRepo.findOne!.mockResolvedValue(parent);
      periodRepo.save!.mockResolvedValue(period);

      const result = await service.update(1, dto);

      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(schoolYearRepo.findOne).toHaveBeenCalledWith({ where: { id: 3, status: Not(-2) } });
      expect(period.status).toBe(-1);
      expect(period.title).toBe('Q2');
      expect(period.schoolYear).toBe(parent);
      expect(periodRepo.save).toHaveBeenCalledWith(period);
      expect(result).toBe(period);
      findOneSpy.mockRestore();
    });
  });

  describe('remove', () => {
    it('should remove the period', async () => {
      const period = { id: 1 } as SchoolYearPeriod;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(period);
      periodRepo.remove!.mockResolvedValue(period);

      const result = await service.remove(1);

      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(periodRepo.remove).toHaveBeenCalledWith(period);
      expect(result).toBe(period);
      findOneSpy.mockRestore();
    });
  });
});
