import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ClassCourseService } from './class-course.service';
import { ClassCourse } from './entities/class-course.entity';
import { ClassEntity } from '../class/entities/class.entity';
import { Module as ModuleEntity } from '../module/entities/module.entity';
import { Course } from '../course/entities/course.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { CreateClassCourseDto } from './dto/create-class-course.dto';

const createQueryBuilderMock = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
  getOne: jest.fn(),
});

const createRepositoryMock = (qb?: any) =>
  ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(qb ?? createQueryBuilderMock()),
  }) as unknown as jest.Mocked<Repository<any>>;

describe('ClassCourseService', () => {
  let service: ClassCourseService;
  let classCourseRepo: jest.Mocked<Repository<ClassCourse>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassCourseService,
        { provide: getRepositoryToken(ClassCourse), useValue: createRepositoryMock() },
        { provide: getRepositoryToken(ClassEntity), useValue: createRepositoryMock() },
        { provide: getRepositoryToken(ModuleEntity), useValue: createRepositoryMock() },
        { provide: getRepositoryToken(Course), useValue: createRepositoryMock() },
        { provide: getRepositoryToken(Teacher), useValue: createRepositoryMock() },
      ],
    }).compile();

    service = module.get<ClassCourseService>(ClassCourseService);
    classCourseRepo = module.get(getRepositoryToken(ClassCourse)) as jest.Mocked<Repository<ClassCourse>>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a class course with company scope', async () => {
    const dto: CreateClassCourseDto = {
      title: 'Math',
      class_id: 1,
      module_id: 2,
      course_id: 3,
      teacher_id: 4,
      weeklyFrequency: 1,
      duration: 2,
    };
    const created = { id: 1 } as ClassCourse;
    const saved = { id: 42 } as ClassCourse;
    classCourseRepo.create.mockReturnValue(created);
    classCourseRepo.save.mockResolvedValue(saved);
    const ensureSpy = jest.spyOn<any, any>(service as any, 'ensureForeignKeys').mockResolvedValue(undefined);
    const findOneSpy = jest.spyOn(service, 'findOne').mockResolvedValue(saved);

    const result = await service.create(dto, 99);

    expect(ensureSpy).toHaveBeenCalledWith(dto, 99);
    expect(classCourseRepo.create).toHaveBeenCalledWith({ ...dto, company_id: 99 });
    expect(classCourseRepo.save).toHaveBeenCalledWith(created);
    expect(findOneSpy).toHaveBeenCalledWith(saved.id, 99);
    expect(result).toBe(saved);

    ensureSpy.mockRestore();
    findOneSpy.mockRestore();
  });

  it('throws BadRequestException when create fails', async () => {
    classCourseRepo.create.mockReturnValue({} as ClassCourse);
    classCourseRepo.save.mockRejectedValue(new Error('fail'));
    jest.spyOn<any, any>(service as any, 'ensureForeignKeys').mockResolvedValue(undefined);

    await expect(
      service.create(
        {
          title: 'Math',
          class_id: 1,
          module_id: 2,
          course_id: 3,
          teacher_id: 4,
          weeklyFrequency: 1,
          duration: 2,
        },
        1,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns existing class course on findOne', async () => {
    const entity = { id: 1 } as ClassCourse;
    classCourseRepo.findOne.mockResolvedValue(entity);

    const result = await service.findOne(1, 5);

    expect(classCourseRepo.findOne).toHaveBeenCalledTimes(1);
    expect(result).toBe(entity);
  });

  it('throws NotFoundException when class course missing', async () => {
    classCourseRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne(1, 5)).rejects.toThrow(NotFoundException);
  });

  it('soft deletes by switching status to -2', async () => {
    const entity = { id: 1, status: 1 } as ClassCourse;
    const findOneSpy = jest.spyOn(service, 'findOne').mockResolvedValue(entity);

    await service.remove(1, 5);

    expect(findOneSpy).toHaveBeenCalledWith(1, 5);
    expect(classCourseRepo.save).toHaveBeenCalledWith({ ...entity, status: -2 });

    findOneSpy.mockRestore();
  });
});
