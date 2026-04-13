import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassStudentService } from './class-student.service';
import { ClassStudent } from './entities/class-student.entity';

const createRepositoryMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
  createQueryBuilder: jest.fn(),
}) as unknown as jest.Mocked<Repository<ClassStudent>>;

describe('ClassStudentService', () => {
  let service: ClassStudentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassStudentService,
        {
          provide: getRepositoryToken(ClassStudent),
          useValue: createRepositoryMock(),
        },
      ],
    }).compile();

    service = module.get<ClassStudentService>(ClassStudentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
