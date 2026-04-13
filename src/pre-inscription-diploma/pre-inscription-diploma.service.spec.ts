import { Test, TestingModule } from '@nestjs/testing';
import { PreInscriptionDiplomaService } from './pre-inscription-diploma.service';

describe('PreInscriptionDiplomaService', () => {
  let service: PreInscriptionDiplomaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PreInscriptionDiplomaService],
    }).compile();

    service = module.get<PreInscriptionDiplomaService>(PreInscriptionDiplomaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
