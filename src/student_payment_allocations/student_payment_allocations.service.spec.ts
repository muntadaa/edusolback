import { Test, TestingModule } from '@nestjs/testing';
import { StudentPaymentAllocationsService } from './student_payment_allocations.service';

describe('StudentPaymentAllocationsService', () => {
  let service: StudentPaymentAllocationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudentPaymentAllocationsService],
    }).compile();

    service = module.get<StudentPaymentAllocationsService>(StudentPaymentAllocationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
