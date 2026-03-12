import { Test, TestingModule } from '@nestjs/testing';
import { PreinscriptionsController } from './preinscriptions.controller';
import { PreinscriptionsService } from './preinscriptions.service';

describe('PreinscriptionsController', () => {
  let controller: PreinscriptionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PreinscriptionsController],
      providers: [PreinscriptionsService],
    }).compile();

    controller = module.get<PreinscriptionsController>(PreinscriptionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
