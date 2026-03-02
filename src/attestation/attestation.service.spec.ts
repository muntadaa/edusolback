import { Test, TestingModule } from '@nestjs/testing';
import { AttestationService } from './attestation.service';

describe('AttestationService', () => {
  let service: AttestationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttestationService],
    }).compile();

    service = module.get<AttestationService>(AttestationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
