import { Test, TestingModule } from '@nestjs/testing';
import { LevelPricingService } from './level-pricing.service';

describe('LevelPricingService', () => {
  let service: LevelPricingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LevelPricingService],
    }).compile();

    service = module.get<LevelPricingService>(LevelPricingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
