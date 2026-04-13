import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentReportService } from './student-report.service';
import { StudentReport } from './entities/student-report.entity';
import { Student } from '../students/entities/student.entity';
import { SchoolYearPeriod } from '../school-year-periods/entities/school-year-period.entity';
import { SchoolYear } from '../school-years/entities/school-year.entity';
import { ClassStudent } from '../class-student/entities/class-student.entity';
import { StudentsPlanning } from '../students-plannings/entities/students-planning.entity';
import { StudentPresence } from '../studentpresence/entities/studentpresence.entity';

describe('StudentReportService', () => {
  let service: StudentReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentReportService,
        { provide: getRepositoryToken(StudentReport), useClass: Repository },
        { provide: getRepositoryToken(Student), useClass: Repository },
        { provide: getRepositoryToken(SchoolYearPeriod), useClass: Repository },
        { provide: getRepositoryToken(SchoolYear), useClass: Repository },
        { provide: getRepositoryToken(ClassStudent), useClass: Repository },
        { provide: getRepositoryToken(StudentsPlanning), useClass: Repository },
        { provide: getRepositoryToken(StudentPresence), useClass: Repository },
      ],
    }).compile();

    service = module.get<StudentReportService>(StudentReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
