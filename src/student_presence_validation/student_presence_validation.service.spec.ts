import { Test, TestingModule } from '@nestjs/testing';
import { StudentPresenceValidationService } from './student_presence_validation.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StudentPresenceValidation } from './entities/student_presence_validation.entity';
import { StudentPresence } from '../studentpresence/entities/studentpresence.entity';
import { StudentsPlanning } from '../students-plannings/entities/students-planning.entity';
import { ClassCourse } from '../class-course/entities/class-course.entity';
import { ClassEntity } from '../class/entities/class.entity';

describe('StudentPresenceValidationService', () => {
  let service: StudentPresenceValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentPresenceValidationService,
        { provide: getRepositoryToken(StudentPresenceValidation), useValue: {} },
        { provide: getRepositoryToken(StudentPresence), useValue: {} },
        { provide: getRepositoryToken(StudentsPlanning), useValue: {} },
        { provide: getRepositoryToken(ClassCourse), useValue: {} },
        { provide: getRepositoryToken(ClassEntity), useValue: {} },
      ],
    }).compile();

    service = module.get<StudentPresenceValidationService>(StudentPresenceValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
