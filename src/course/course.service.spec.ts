import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CourseService } from './course.service';
import { Course } from './entities/course.entity';
import { Module } from '../module/entities/module.entity';
import { CourseQueryDto } from './dto/course-query.dto';
import { ModuleAssignmentDto } from './dto/module-assignment.dto';

const createCourseRepoMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
  query: jest.fn(),
}) as unknown as jest.Mocked<Repository<Course>>;

const createModuleRepoMock = () => ({
  findByIds: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
  find: jest.fn(),
}) as unknown as jest.Mocked<Repository<Module>>;

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

describe('CourseService', () => {
  let service: CourseService;
  let courseRepo: jest.Mocked<Repository<Course>>;
  let moduleRepo: jest.Mocked<Repository<Module>>;
  let dataSource: { createQueryRunner: jest.Mock };
  let queryRunner: ReturnType<typeof createQueryRunnerMock>;

  beforeEach(async () => {
    queryRunner = createQueryRunnerMock();
    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseService,
        {
          provide: getRepositoryToken(Course),
          useValue: createCourseRepoMock(),
        },
        {
          provide: getRepositoryToken(Module),
          useValue: createModuleRepoMock(),
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<CourseService>(CourseService);
    courseRepo = module.get(getRepositoryToken(Course)) as unknown as jest.Mocked<Repository<Course>>;
    moduleRepo = module.get(getRepositoryToken(Module)) as unknown as jest.Mocked<Repository<Module>>;
  });

  describe('create', () => {
    it('should validate modules, save course, and sequence assignments', async () => {
      const dto = { title: 'Math', status: 1, module_ids: [1, 2] } as any;
      const modules = [{ id: 1 }, { id: 2 }] as Module[];
      const course = { id: 1 } as Course;
      moduleRepo.findByIds!.mockResolvedValue(modules);
      courseRepo.create!.mockReturnValue(course);
      courseRepo.save!.mockResolvedValue(course);
      courseRepo.query!.mockResolvedValue(undefined);
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ id: 1 } as Course);

      const result = await service.create(dto);

      expect(moduleRepo.findByIds).toHaveBeenCalledWith([1, 2]);
      expect(courseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ intitule: 'Math', statut: 1 }),
      );
      expect(courseRepo.save).toHaveBeenCalledWith(course);
      expect(courseRepo.query).toHaveBeenNthCalledWith(1, 'DELETE FROM module_course WHERE course_id = ?', [course.id]);
      expect(courseRepo.query).toHaveBeenNthCalledWith(2, 'INSERT INTO module_course (module_id, course_id, tri) VALUES (?, ?, ?)', [1, course.id, 0]);
      expect(courseRepo.query).toHaveBeenNthCalledWith(3, 'INSERT INTO module_course (module_id, course_id, tri) VALUES (?, ?, ?)', [2, course.id, 1]);
      expect(findOneSpy).toHaveBeenCalledWith(course.id);
      expect(result).toEqual({ id: 1 });
      findOneSpy.mockRestore();
    });

    it('should save course without modules when list empty', async () => {
      const dto = { title: 'Science', status: 1, module_ids: [] } as any;
      const course = { id: 1 } as Course;
      courseRepo.create!.mockReturnValue(course);
      courseRepo.save!.mockResolvedValue(course);
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ id: 1 } as Course);

      const result = await service.create(dto);

      expect(moduleRepo.findByIds).not.toHaveBeenCalled();
      expect(courseRepo.query).not.toHaveBeenCalled();
      expect(findOneSpy).toHaveBeenCalledWith(course.id);
      expect(result).toEqual({ id: 1 });
      findOneSpy.mockRestore();
    });
  });

  describe('findAll', () => {
    it('should fetch courses with relations', async () => {
      const courses = [{ id: 1 }] as Course[];
      courseRepo.find!.mockResolvedValue(courses);

      const result = await service.findAll();

      expect(courseRepo.find).toHaveBeenCalledTimes(1);
      const args = courseRepo.find.mock.calls[0][0] as any;
      expect(args.relations).toEqual(['company', 'modules']);
      expect(args.where.statut).toEqual(expect.objectContaining({ value: -2 }));
      expect(result).toBe(courses);
    });
  });

  describe('findAllWithPagination', () => {
    it('should build query and return paginated response', async () => {
      const qb = createQueryBuilderMock();
      courseRepo.createQueryBuilder!.mockReturnValue(qb as any);
      const courses = [{ id: 1 }] as Course[];
      qb.getManyAndCount.mockResolvedValue([courses, 1]);
      const query: CourseQueryDto = { page: 2, limit: 3, search: 'Math', status: 1 };

      const result = await service.findAllWithPagination(query);

      expect(courseRepo.createQueryBuilder).toHaveBeenCalledWith('course');
      expect(qb.andWhere).toHaveBeenCalledWith('course.statut <> :deletedStatus', { deletedStatus: -2 });
      expect(qb.skip).toHaveBeenCalledWith(3);
      expect(qb.take).toHaveBeenCalledWith(3);
      expect(qb.orderBy).toHaveBeenCalledWith('course.created_at', 'DESC');
      expect(result).toEqual({
        data: courses,
        meta: {
          page: 2,
          limit: 3,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: true,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return course when found', async () => {
      const course = { id: 1, statut: 1 } as Course;
      courseRepo.findOne!.mockResolvedValue(course);

      const result = await service.findOne(1);

      expect(courseRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['company', 'modules'],
      });
      expect(result).toBe(course);
    });

    it('should throw NotFoundException when missing', async () => {
      courseRepo.findOne!.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when course is marked deleted', async () => {
      courseRepo.findOne!.mockResolvedValue({ id: 1, statut: -2 } as any);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should refresh course data and resequence assignments', async () => {
      const existing = { id: 1 } as unknown as Course;
      const modules = [{ id: 3 }] as Module[];
      const dto = { title: 'Advanced Math', status: 2, module_ids: [3] } as any;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({ id: 1, title: 'Advanced Math' } as Course);
      moduleRepo.findByIds!.mockResolvedValue(modules);
      courseRepo.save!.mockResolvedValue(existing);
      courseRepo.query!.mockResolvedValue(undefined);

      const result = await service.update(1, dto);

      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(moduleRepo.findByIds).toHaveBeenCalledWith([3]);
      expect(existing.intitule).toBe('Advanced Math');
      expect(existing.statut).toBe(2);
      expect(courseRepo.save).toHaveBeenCalledWith(existing);
      expect(courseRepo.query).toHaveBeenNthCalledWith(1, 'DELETE FROM module_course WHERE course_id = ?', [existing.id]);
      expect(courseRepo.query).toHaveBeenNthCalledWith(2, 'INSERT INTO module_course (module_id, course_id, tri) VALUES (?, ?, ?)', [3, existing.id, 1]);
      expect(result).toEqual({ id: 1, title: 'Advanced Math' });
      findOneSpy.mockRestore();
    });
  });

  describe('getCourseModules', () => {
    it('should fetch assigned and unassigned modules', async () => {
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ id: 1 } as Course);
      const unassignedQb = createQueryBuilderMock();
      moduleRepo.createQueryBuilder!.mockReturnValue(unassignedQb as any);
      courseRepo.query!.mockResolvedValueOnce([{ module_id: 1, tri: 5, created_at: new Date('2025-01-01T00:00:00Z') }]);
      moduleRepo.find!.mockResolvedValue([{ id: 1 } as Module]);
      unassignedQb.getMany.mockResolvedValue([{ id: 2 }] as any);

      const result = await service.getCourseModules(1);

      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(courseRepo.query).toHaveBeenCalledWith(
        'SELECT module_id, tri, created_at FROM module_course WHERE course_id = ? ORDER BY tri ASC, created_at DESC',
        [1],
      );
      expect(moduleRepo.find).toHaveBeenCalledWith({ where: { id: In([1]) }, relations: ['company'] });
      expect(moduleRepo.createQueryBuilder).toHaveBeenCalled();
      expect(result).toEqual({
        assigned: [expect.objectContaining({ id: 1, tri: 5 })],
        unassigned: [{ id: 2 }],
      });
      findOneSpy.mockRestore();
    });
  });

  describe('batchManageCourseModules', () => {
    it('should throw BadRequestException when no operations provided', async () => {
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ id: 1 } as Course);

      await expect(
        service.batchManageCourseModules(1, { add: [], remove: [] }),
      ).rejects.toThrow(BadRequestException);
      findOneSpy.mockRestore();
    });

    it('should add and remove modules within a transaction', async () => {
      const dto: ModuleAssignmentDto = { add: [1], remove: [2] };
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ id: 1 } as Course);
      moduleRepo.findByIds!.mockResolvedValue([{ id: 1 }] as Module[]);
      queryRunner.query
        .mockResolvedValueOnce([{ total: 3 }])
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      const result = await service.batchManageCourseModules(1, dto);

      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(moduleRepo.findByIds).toHaveBeenCalledWith([1]);
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.query).toHaveBeenNthCalledWith(
        1,
        'SELECT COUNT(*) as total FROM module_course WHERE course_id = ?',
        [1],
      );
      expect(queryRunner.query).toHaveBeenNthCalledWith(
        2,
        'INSERT IGNORE INTO module_course (module_id, course_id, tri) VALUES (?, ?, ?)',
        [1, 1, 3],
      );
      expect(queryRunner.query).toHaveBeenNthCalledWith(
        3,
        'DELETE FROM module_course WHERE course_id = ? AND module_id IN (?)',
        [1, dto.remove],
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Module assignments updated successfully', affected: 2 });
      findOneSpy.mockRestore();
    });
  });

  describe('addModuleToCourse', () => {
    it('should verify course and module, then insert relation', async () => {
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ id: 1 } as Course);
      moduleRepo.findOne!.mockResolvedValue({ id: 2 } as Module);
      queryRunner.query
        .mockResolvedValueOnce([]) // no existing relation
        .mockResolvedValueOnce([{ total: 2 }])
        .mockResolvedValueOnce(undefined);

      const result = await service.addModuleToCourse(1, 2);

      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(moduleRepo.findOne).toHaveBeenCalledWith({ where: { id: 2 }, relations: ['company'] });
      expect(queryRunner.query).toHaveBeenNthCalledWith(
        2,
        'SELECT COUNT(*) as total FROM module_course WHERE course_id = ?',
        [1],
      );
      expect(queryRunner.query).toHaveBeenNthCalledWith(
        3,
        'INSERT INTO module_course (module_id, course_id, tri) VALUES (?, ?, ?)',
        [2, 1, 2],
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Module successfully assigned to course', module: { id: 2 } });
      findOneSpy.mockRestore();
    });

    it('should throw NotFoundException when module missing', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: 1 } as Course);
      moduleRepo.findOne!.mockResolvedValue(null);

      await expect(service.addModuleToCourse(1, 2)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeModuleFromCourse', () => {
    it('should delete relation when present', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: 1 } as Course);
      queryRunner.query
        .mockResolvedValueOnce([{ id: 1 }]) // existing relation check
        .mockResolvedValueOnce(undefined); // delete

      const result = await service.removeModuleFromCourse(1, 2);

      expect(queryRunner.query).toHaveBeenNthCalledWith(
        1,
        'SELECT * FROM module_course WHERE course_id = ? AND module_id = ?',
        [1, 2],
      );
      expect(queryRunner.query).toHaveBeenNthCalledWith(
        2,
        'DELETE FROM module_course WHERE course_id = ? AND module_id = ?',
        [1, 2],
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Module successfully removed from course' });
    });
  });
});
