import { Test, TestingModule } from '@nestjs/testing';
import { LevelPricingController } from './level-pricing.controller';
import { LevelPricingService } from './level-pricing.service';

describe('LevelPricingController', () => {
  let controller: LevelPricingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LevelPricingController],
      providers: [LevelPricingService],
    }).compile();

    controller = module.get<LevelPricingController>(LevelPricingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
