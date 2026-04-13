import { Test, TestingModule } from '@nestjs/testing';
import { StudentattestationService } from './studentattestation.service';

describe('StudentattestationService', () => {
  let service: StudentattestationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudentattestationService],
    }).compile();

    service = module.get<StudentattestationService>(StudentattestationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
