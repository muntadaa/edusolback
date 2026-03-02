import { Test, TestingModule } from '@nestjs/testing';
import { StudentReportDetailController } from './student-report-detail.controller';
import { StudentReportDetailService } from './student-report-detail.service';

describe('StudentReportDetailController', () => {
  let controller: StudentReportDetailController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentReportDetailController],
      providers: [StudentReportDetailService],
    }).compile();

    controller = module.get<StudentReportDetailController>(StudentReportDetailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
