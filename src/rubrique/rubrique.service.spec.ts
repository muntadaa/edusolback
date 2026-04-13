import { Test, TestingModule } from '@nestjs/testing';
import { RubriqueService } from './rubrique.service';

describe('RubriqueService', () => {
  let service: RubriqueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RubriqueService],
    }).compile();

    service = module.get<RubriqueService>(RubriqueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
