import { Test, TestingModule } from '@nestjs/testing';
import { RubriqueController } from './rubrique.controller';
import { RubriqueService } from './rubrique.service';

describe('RubriqueController', () => {
  let controller: RubriqueController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RubriqueController],
      providers: [RubriqueService],
    }).compile();

    controller = module.get<RubriqueController>(RubriqueController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
