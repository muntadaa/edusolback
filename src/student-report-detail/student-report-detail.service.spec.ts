import { Test, TestingModule } from '@nestjs/testing';
import { StudentReportDetailService } from './student-report-detail.service';

describe('StudentReportDetailService', () => {
  let service: StudentReportDetailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudentReportDetailService],
    }).compile();

    service = module.get<StudentReportDetailService>(StudentReportDetailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
