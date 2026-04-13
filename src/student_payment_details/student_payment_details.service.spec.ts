import { Test, TestingModule } from '@nestjs/testing';
import { StudentPaymentDetailsService } from './student_payment_details.service';

describe('StudentPaymentDetailsService', () => {
  let service: StudentPaymentDetailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudentPaymentDetailsService],
    }).compile();

    service = module.get<StudentPaymentDetailsService>(StudentPaymentDetailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
