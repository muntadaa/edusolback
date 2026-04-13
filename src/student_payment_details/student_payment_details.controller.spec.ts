import { Test, TestingModule } from '@nestjs/testing';
import { StudentPaymentDetailsController } from './student_payment_details.controller';
import { StudentPaymentDetailsService } from './student_payment_details.service';

describe('StudentPaymentDetailsController', () => {
  let controller: StudentPaymentDetailsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentPaymentDetailsController],
      providers: [StudentPaymentDetailsService],
    }).compile();

    controller = module.get<StudentPaymentDetailsController>(StudentPaymentDetailsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
