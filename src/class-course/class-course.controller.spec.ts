import { Test, TestingModule } from '@nestjs/testing';
import { ClassCourseController } from './class-course.controller';
import { ClassCourseService } from './class-course.service';

describe('ClassCourseController', () => {
  let controller: ClassCourseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassCourseController],
      providers: [
        {
          provide: ClassCourseService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ClassCourseController>(ClassCourseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
