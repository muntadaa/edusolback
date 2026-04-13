import { Test, TestingModule } from '@nestjs/testing';
import { RequiredDocsController } from './required-docs.controller';
import { RequiredDocsService } from './required-docs.service';

describe('RequiredDocsController', () => {
  let controller: RequiredDocsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequiredDocsController],
      providers: [{ provide: RequiredDocsService, useValue: {} }],
    }).compile();

    controller = module.get<RequiredDocsController>(RequiredDocsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
