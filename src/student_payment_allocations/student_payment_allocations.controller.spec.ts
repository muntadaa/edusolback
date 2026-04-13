import { Test, TestingModule } from '@nestjs/testing';
import { StudentPaymentAllocationsController } from './student_payment_allocations.controller';
import { StudentPaymentAllocationsService } from './student_payment_allocations.service';

describe('StudentPaymentAllocationsController', () => {
  let controller: StudentPaymentAllocationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentPaymentAllocationsController],
      providers: [StudentPaymentAllocationsService],
    }).compile();

    controller = module.get<StudentPaymentAllocationsController>(StudentPaymentAllocationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
