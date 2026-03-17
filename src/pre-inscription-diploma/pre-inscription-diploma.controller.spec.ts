import { Test, TestingModule } from '@nestjs/testing';
import { PreInscriptionDiplomaController } from './pre-inscription-diploma.controller';
import { PreInscriptionDiplomaService } from './pre-inscription-diploma.service';

describe('PreInscriptionDiplomaController', () => {
  let controller: PreInscriptionDiplomaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PreInscriptionDiplomaController],
      providers: [PreInscriptionDiplomaService],
    }).compile();

    controller = module.get<PreInscriptionDiplomaController>(PreInscriptionDiplomaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
