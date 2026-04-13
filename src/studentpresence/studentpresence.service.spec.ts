import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentPresenceService } from './studentpresence.service';
import { StudentPresence } from './entities/studentpresence.entity';
import { Student } from '../students/entities/student.entity';
import { StudentsPlanning } from '../students-plannings/entities/students-planning.entity';
import { StudentReport } from '../student-report/entities/student-report.entity';

describe('StudentPresenceService', () => {
  let service: StudentPresenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentPresenceService,
        { provide: getRepositoryToken(StudentPresence), useClass: Repository },
        { provide: getRepositoryToken(Student), useClass: Repository },
        { provide: getRepositoryToken(StudentsPlanning), useClass: Repository },
        { provide: getRepositoryToken(StudentReport), useClass: Repository },
      ],
    }).compile();

    service = module.get<StudentPresenceService>(StudentPresenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
