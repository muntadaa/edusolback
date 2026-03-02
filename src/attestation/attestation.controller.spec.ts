import { Test, TestingModule } from '@nestjs/testing';
import { AttestationController } from './attestation.controller';
import { AttestationService } from './attestation.service';

describe('AttestationController', () => {
  let controller: AttestationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttestationController],
      providers: [AttestationService],
    }).compile();

    controller = module.get<AttestationController>(AttestationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
