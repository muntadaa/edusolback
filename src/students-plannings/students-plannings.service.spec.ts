import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentsPlanningsService } from './students-plannings.service';
import { StudentsPlanning } from './entities/students-planning.entity';

const createQueryBuilderMock = () => ({
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
  getManyAndCount: jest.fn(),
});   

const createRepositoryMock = () => {
  const qb = createQueryBuilderMock();
  return {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    merge: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(qb),
  } as unknown as jest.Mocked<Repository<StudentsPlanning>>;
};

describe('StudentsPlanningsService', () => {
  let service: StudentsPlanningsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsPlanningsService,
        {
          provide: getRepositoryToken(StudentsPlanning),
          useValue: createRepositoryMock(),
        },
      ],
    }).compile();

    service = module.get<StudentsPlanningsService>(StudentsPlanningsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
