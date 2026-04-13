import { Test, TestingModule } from '@nestjs/testing';
import { PlanningSessionTypesService } from './planning-session-types.service';

describe('PlanningSessionTypesService', () => {
  let service: PlanningSessionTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlanningSessionTypesService],
    }).compile();

    service = module.get<PlanningSessionTypesService>(PlanningSessionTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
