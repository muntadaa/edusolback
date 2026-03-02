import { Test, TestingModule } from '@nestjs/testing';
import { StudentsPlanningsController } from './students-plannings.controller';
import { StudentsPlanningsService } from './students-plannings.service';

describe('StudentsPlanningsController', () => {
  let controller: StudentsPlanningsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentsPlanningsController],
      providers: [StudentsPlanningsService],
    }).compile();

    controller = module.get<StudentsPlanningsController>(StudentsPlanningsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
