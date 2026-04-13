import { Test, TestingModule } from '@nestjs/testing';
import { StudentPresenceValidationController } from './student_presence_validation.controller';
import { StudentPresenceValidationService } from './student_presence_validation.service';

describe('StudentPresenceValidationController', () => {
  let controller: StudentPresenceValidationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentPresenceValidationController],
      providers: [
        {
          provide: StudentPresenceValidationService,
          useValue: {
            findAll: jest.fn(),
            approve: jest.fn(),
            reject: jest.fn(),
            createValidationForPresence: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<StudentPresenceValidationController>(StudentPresenceValidationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
