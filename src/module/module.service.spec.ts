import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ModuleService } from './module.service';
import { Module as ModuleEntity } from './entities/module.entity';
import { Course } from '../course/entities/course.entity';
import { ModuleQueryDto } from './dto/module-query.dto';
import { CourseAssignmentDto } from './dto/course-assignment.dto';

const createModuleRepoMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
  findByIds: jest.fn(),
  query: jest.fn(),
}) as unknown as jest.Mocked<Repository<ModuleEntity>>;

const createCourseRepoMock = () => ({
  findByIds: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
  find: jest.fn(),
  query: jest.fn(),
}) as unknown as jest.Mocked<Repository<Course>>;

const createQueryBuilderMock = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
  getOne: jest.fn(),
  getMany: jest.fn(),
});

const createQueryRunnerMock = () => ({
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  query: jest.fn(),
});

describe('ModuleService', () => {
  let service: ModuleService;
  let moduleRepo: jest.Mocked<Repository<ModuleEntity>>;
  let courseRepo: jest.Mocked<Repository<Course>>;
  let dataSource: { createQueryRunner: jest.Mock };
  let queryRunner: ReturnType<typeof createQueryRunnerMock>;

  beforeEach(async () => {
    queryRunner = createQueryRunnerMock();
    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModuleService,
        {
          provide: getRepositoryToken(ModuleEntity),
          useValue: createModuleRepoMock(),
        },
        {
          provide: getRepositoryToken(Course),
          useValue: createCourseRepoMock(),
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<ModuleService>(ModuleService);
    moduleRepo = module.get(getRepositoryToken(ModuleEntity)) as unknown as jest.Mocked<Repository<ModuleEntity>>;
    courseRepo = module.get(getRepositoryToken(Course)) as unknown as jest.Mocked<Repository<Course>>;
  });

  describe('create', () => {
    it('should map fields, validate courses, and append assignments', async () => {
      const dto = { title: 'Algorithms', status: 1, course_ids: [1, 2] } as any;
      const courses = [{ id: 1 }, { id: 2 }] as Course[];
      const moduleEntity = { id: 1 } as ModuleEntity;
      courseRepo.findByIds!.mockResolvedValue(courses);
      moduleRepo.create!.mockReturnValue(moduleEntity);
      moduleRepo.save!.mockResolvedValue(moduleEntity);
      moduleRepo.query!.mockResolvedValue(undefined);
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ id: 1 } as ModuleEntity);

      const result = await service.create(dto);

      expect(courseRepo.findByIds).toHaveBeenCalledWith([1, 2]);
      expect(moduleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ intitule: 'Algorithms', status: 1 }),
      );
      expect(moduleRepo.save).toHaveBeenCalledWith(moduleEntity);
      expect(moduleRepo.query).toHaveBeenNthCalledWith(1, 'DELETE FROM module_course WHERE module_id = ?', [moduleEntity.id]);
      expect(moduleRepo.query).toHaveBeenNthCalledWith(2, 'INSERT INTO module_course (module_id, course_id, tri) VALUES (?, ?, ?)', [moduleEntity.id, 1, 0]);
      expect(moduleRepo.query).toHaveBeenNthCalledWith(3, 'INSERT INTO module_course (module_id, course_id, tri) VALUES (?, ?, ?)', [moduleEntity.id, 2, 0]);
      expect(findOneSpy).toHaveBeenCalledWith(moduleEntity.id);
      expect(result).toEqual({ id: 1 });
      findOneSpy.mockRestore();
    });
  });

  describe('findAll', () => {
    it('should fetch modules with relations', async () => {
      const modules = [{ id: 1 }] as ModuleEntity[];
      moduleRepo.find!.mockResolvedValue(modules);

      const result = await service.findAll();

      expect(moduleRepo.find).toHaveBeenCalledTimes(1);
      const args = moduleRepo.find.mock.calls[0][0] as any;
      expect(args.relations).toEqual(['company', 'courses']);
      expect(args.where.status).toEqual(expect.objectContaining({ value: -2 }));
      expect(result).toBe(modules);
    });
  });

  describe('findAllWithPagination', () => {
    it('should build query and return pagination', async () => {
      const qb = createQueryBuilderMock();
      moduleRepo.createQueryBuilder!.mockReturnValue(qb as any);
      const modules = [{ id: 1 }] as ModuleEntity[];
      qb.getManyAndCount.mockResolvedValue([modules, 1]);
      const query: ModuleQueryDto = { page: 1, limit: 5, search: 'Algo', status: 1 };

      const result = await service.findAllWithPagination(query);

      expect(moduleRepo.createQueryBuilder).toHaveBeenCalledWith('module');
      expect(qb.andWhere).toHaveBeenCalledWith('module.statut <> :deletedStatus', { deletedStatus: -2 });
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(5);
      expect(qb.orderBy).toHaveBeenCalledWith('module.created_at', 'DESC');
      expect(result).toEqual({
        data: modules,
        meta: {
          page: 1,
          limit: 5,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return module when found', async () => {
      const moduleEntity = { id: 1, status: 1 } as ModuleEntity;
      moduleRepo.findOne!.mockResolvedValue(moduleEntity);

      const result = await service.findOne(1);

      expect(moduleRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['company', 'courses'],
      });
      expect(result).toBe(moduleEntity);
    });

    it('should throw NotFoundException when missing', async () => {
      moduleRepo.findOne!.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when module is marked deleted', async () => {
      moduleRepo.findOne!.mockResolvedValue({ id: 1, status: -2 } as any);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should refresh fields and append assignments', async () => {
      const moduleEntity = { id: 1 } as unknown as ModuleEntity;
      const dto = { title: 'Updated', status: 0, course_ids: [3] } as any;
      const courses = [{ id: 3 }] as Course[];
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(moduleEntity)
        .mockResolvedValueOnce({ id: 1, title: 'Updated' } as ModuleEntity);
      courseRepo.findByIds!.mockResolvedValue(courses);
      moduleRepo.save!.mockResolvedValue(moduleEntity);
      moduleRepo.query!.mockResolvedValue(undefined);

      const result = await service.update(1, dto);

      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(courseRepo.findByIds).toHaveBeenCalledWith([3]);
      expect(moduleEntity.intitule).toBe('Updated');
      expect(moduleEntity.status).toBe(0);
      expect(moduleRepo.save).toHaveBeenCalledWith(moduleEntity);
      expect(moduleRepo.query).toHaveBeenNthCalledWith(1, 'DELETE FROM module_course WHERE module_id = ?', [moduleEntity.id]);
      expect(moduleRepo.query).toHaveBeenNthCalledWith(2, 'INSERT INTO module_course (module_id, course_id, tri) VALUES (?, ?, ?)', [moduleEntity.id, 3, 0]);
      expect(result).toEqual({ id: 1, title: 'Updated' });
      findOneSpy.mockRestore();
    });
  });

  describe('getModuleCourses', () => {
    it('should return assigned and unassigned courses', async () => {
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ id: 1 } as ModuleEntity);
      const courseQb = createQueryBuilderMock();
      courseRepo.createQueryBuilder!.mockReturnValue(courseQb as any);
      moduleRepo.query!.mockResolvedValueOnce([{ course_id: 3, tri: 2, created_at: new Date('2025-01-01T00:00:00Z') }]);
      courseRepo.find!.mockResolvedValue([{ id: 3 } as Course]);
      courseQb.getMany.mockResolvedValue([{ id: 2 }] as any);

      const result = await service.getModuleCourses(1);

      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(moduleRepo.query).toHaveBeenCalledWith(
        'SELECT course_id, tri, created_at FROM module_course WHERE module_id = ? ORDER BY tri ASC, created_at DESC',
        [1],
      );
      expect(courseRepo.find).toHaveBeenCalledWith({ where: { id: In([3]) }, relations: ['company'] });
      expect(result).toEqual({ assigned: [expect.objectContaining({ id: 3, tri: 2 })], unassigned: [{ id: 2 }] });
      findOneSpy.mockRestore();
    });
  });

  describe('getLinkedCourses', () => {
    it('should return summarized linked courses including volume', async () => {
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ id: 1 } as ModuleEntity);
      const fetchSpy = jest
        .spyOn<any, any>(service as any, 'fetchAssignedCoursesWithTri')
        .mockResolvedValue([
          {
            id: 10,
            title: 'Geometry',
            description: 'Angles and shapes',
            volume: 32,
            coefficient: 1.5,
            status: 1,
            tri: 3,
          },
        ]);

      const result = await service.getLinkedCourses(1, 99);

      expect(findOneSpy).toHaveBeenCalledWith(1, 99);
      expect(fetchSpy).toHaveBeenCalledWith(1, 99);
      expect(result).toEqual([
        {
          id: 10,
          title: 'Geometry',
          description: 'Angles and shapes',
          volume: 32,
          coefficient: 1.5,
          status: 1,
          tri: 3,
        },
      ]);

      findOneSpy.mockRestore();
      fetchSpy.mockRestore();
    });
  });

  describe('batchManageModuleCourses', () => {
    it('should throw BadRequestException when no operations provided', async () => {
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ id: 1 } as ModuleEntity);

      await expect(
        service.batchManageModuleCourses(1, { add: [], remove: [] }),
      ).rejects.toThrow(BadRequestException);
      findOneSpy.mockRestore();
    });

    it('should add and remove courses using query runner', async () => {
      const dto: CourseAssignmentDto = { add: [4], remove: [5] };
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ id: 1 } as ModuleEntity);
      courseRepo.findByIds!.mockResolvedValue([{ id: 4 }] as Course[]);
      queryRunner.query
        .mockResolvedValueOnce([{ total: 7 }])
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      const result = await service.batchManageModuleCourses(1, dto);

      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(courseRepo.findByIds).toHaveBeenCalledWith([4]);
      expect(queryRunner.query).toHaveBeenNthCalledWith(
        1,
        'SELECT COUNT(*) as total FROM module_course WHERE course_id = ?',
        [4],
      );
      expect(queryRunner.query).toHaveBeenNthCalledWith(
        2,
        'INSERT IGNORE INTO module_course (module_id, course_id, tri) VALUES (?, ?, ?)',
        [1, 4, 7],
      );
      expect(queryRunner.query).toHaveBeenNthCalledWith(
        3,
        'DELETE FROM module_course WHERE module_id = ? AND course_id IN (?)',
        [1, dto.remove],
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Course assignments updated successfully', affected: 2 });
      findOneSpy.mockRestore();
    });
  });

  describe('addCourseToModule', () => {
    it('should link course when relation absent', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: 1 } as ModuleEntity);
      courseRepo.findOne!.mockResolvedValue({ id: 2 } as Course);
      queryRunner.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce(undefined);

      const result = await service.addCourseToModule(1, 2);

      expect(courseRepo.findOne).toHaveBeenCalledWith({ where: { id: 2 }, relations: ['company'] });
      expect(queryRunner.query).toHaveBeenNthCalledWith(
        2,
        'SELECT COUNT(*) as total FROM module_course WHERE course_id = ?',
        [2],
      );
      expect(queryRunner.query).toHaveBeenNthCalledWith(
        3,
        'INSERT INTO module_course (module_id, course_id, tri) VALUES (?, ?, ?)',
        [1, 2, 0],
      );
      expect(result).toEqual({ message: 'Course successfully assigned to module', course: { id: 2 } });
    });

    it('should throw NotFoundException when course missing', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: 1 } as ModuleEntity);
      courseRepo.findOne!.mockResolvedValue(null);

      await expect(service.addCourseToModule(1, 2)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeCourseFromModule', () => {
    it('should delete relation when present', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: 1 } as ModuleEntity);
      queryRunner.query
        .mockResolvedValueOnce([{ id: 1 }])
        .mockResolvedValueOnce(undefined);

      const result = await service.removeCourseFromModule(1, 2);

      expect(queryRunner.query).toHaveBeenNthCalledWith(
        1,
        'SELECT * FROM module_course WHERE module_id = ? AND course_id = ?',
        [1, 2],
      );
      expect(queryRunner.query).toHaveBeenNthCalledWith(
        2,
        'DELETE FROM module_course WHERE module_id = ? AND course_id = ?',
        [1, 2],
      );
      expect(result).toEqual({ message: 'Course successfully removed from module' });
    });
  });
});
