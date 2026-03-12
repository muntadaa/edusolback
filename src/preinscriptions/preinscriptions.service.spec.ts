import { Test, TestingModule } from '@nestjs/testing';
import { PreinscriptionsService } from './preinscriptions.service';

describe('PreinscriptionsService', () => {
  let service: PreinscriptionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PreinscriptionsService],
    }).compile();

    service = module.get<PreinscriptionsService>(PreinscriptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
