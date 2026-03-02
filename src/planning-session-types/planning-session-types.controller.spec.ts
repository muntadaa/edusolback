import { Test, TestingModule } from '@nestjs/testing';
import { PlanningSessionTypesController } from './planning-session-types.controller';
import { PlanningSessionTypesService } from './planning-session-types.service';

describe('PlanningSessionTypesController', () => {
  let controller: PlanningSessionTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanningSessionTypesController],
      providers: [PlanningSessionTypesService],
    }).compile();

    controller = module.get<PlanningSessionTypesController>(PlanningSessionTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
