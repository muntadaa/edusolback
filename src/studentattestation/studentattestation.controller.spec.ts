import { Test, TestingModule } from '@nestjs/testing';
import { StudentattestationController } from './studentattestation.controller';
import { StudentattestationService } from './studentattestation.service';

describe('StudentattestationController', () => {
  let controller: StudentattestationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentattestationController],
      providers: [StudentattestationService],
    }).compile();

    controller = module.get<StudentattestationController>(StudentattestationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
