import { Test, TestingModule } from '@nestjs/testing';
import { StudentReportController } from './student-report.controller';
import { StudentReportService } from './student-report.service';

describe('StudentReportController', () => {
  let controller: StudentReportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentReportController],
      providers: [StudentReportService],
    }).compile();

    controller = module.get<StudentReportController>(StudentReportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
