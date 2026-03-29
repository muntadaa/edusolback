import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentsPlanningsService } from './students-plannings.service';
import { StudentsPlanning } from './entities/students-planning.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { ClassEntity } from '../class/entities/class.entity';
import { ClassRoom } from '../class-rooms/entities/class-room.entity';
import { PlanningSessionType } from '../planning-session-types/entities/planning-session-type.entity';
import { SchoolYear } from '../school-years/entities/school-year.entity';
import { Course } from '../course/entities/course.entity';
import { ClassCourse } from '../class-course/entities/class-course.entity';
import { StudentPresence } from '../studentpresence/entities/studentpresence.entity';
import { Event } from '../events/entities/event.entity';
import { StudentPresenceValidationService } from '../student_presence_validation/student_presence_validation.service';

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

  const genericRepo = () =>
    ({
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
      merge: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilderMock()),
    }) as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsPlanningsService,
        { provide: getRepositoryToken(StudentsPlanning), useValue: createRepositoryMock() },
        { provide: getRepositoryToken(Teacher), useValue: genericRepo() },
        { provide: getRepositoryToken(Course), useValue: genericRepo() },
        { provide: getRepositoryToken(ClassEntity), useValue: genericRepo() },
        { provide: getRepositoryToken(ClassRoom), useValue: genericRepo() },
        { provide: getRepositoryToken(PlanningSessionType), useValue: genericRepo() },
        { provide: getRepositoryToken(SchoolYear), useValue: genericRepo() },
        { provide: getRepositoryToken(ClassCourse), useValue: genericRepo() },
        { provide: getRepositoryToken(StudentPresence), useValue: genericRepo() },
        { provide: getRepositoryToken(Event), useValue: genericRepo() },
        {
          provide: StudentPresenceValidationService,
          useValue: { createValidationForPresence: jest.fn().mockResolvedValue({}) },
        },
      ],
    }).compile();

    service = module.get<StudentsPlanningsService>(StudentsPlanningsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
