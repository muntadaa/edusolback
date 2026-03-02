import { Test, TestingModule } from '@nestjs/testing';
import { StudentPresenceController } from './studentpresence.controller';
import { StudentPresenceService } from './studentpresence.service';

describe('StudentPresenceController', () => {
  let controller: StudentPresenceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentPresenceController],
      providers: [StudentPresenceService],
    }).compile();

    controller = module.get<StudentPresenceController>(StudentPresenceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
