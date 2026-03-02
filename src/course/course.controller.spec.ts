import { Test, TestingModule } from '@nestjs/testing';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';

const createServiceMock = () => ({
  create: jest.fn(),
  findAllWithPagination: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getCourseModules: jest.fn(),
  batchManageCourseModules: jest.fn(),
  addModuleToCourse: jest.fn(),
  removeModuleFromCourse: jest.fn(),
});

describe('CourseController', () => {
  let controller: CourseController;
  let service: ReturnType<typeof createServiceMock>;

  beforeEach(() => {
    service = createServiceMock();
    controller = new CourseController(service as unknown as CourseService);
  });

  it('should delegate create to service', async () => {
    const dto = { title: 'Course' } as any;
    await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should call findAllWithPagination with query DTO', () => {
    const query = { page: 1 } as any;
    controller.findAll(query);

    expect(service.findAllWithPagination).toHaveBeenCalledWith(query);
  });

  it('should convert id to number for findOne', () => {
    controller.findOne('4');

    expect(service.findOne).toHaveBeenCalledWith(4);
  });

  it('should convert id for update', async () => {
    const dto = { title: 'Updated' } as any;
    await controller.update('5', dto);

    expect(service.update).toHaveBeenCalledWith(5, dto);
  });

  it('should convert id for remove', async () => {
    await controller.remove('6');

    expect(service.remove).toHaveBeenCalledWith(6);
  });

  it('should convert id for getCourseModules', () => {
    controller.getCourseModules('7');

    expect(service.getCourseModules).toHaveBeenCalledWith(7);
  });

  it('should forward batch assignment requests', async () => {
    const dto = { add: [1] } as any;
    await controller.batchManageCourseModules('8', dto);

    expect(service.batchManageCourseModules).toHaveBeenCalledWith(8, dto);
  });

  it('should convert ids for addModuleToCourse', async () => {
    await controller.addModuleToCourse('9', '10');

    expect(service.addModuleToCourse).toHaveBeenCalledWith(9, 10);
  });

  it('should convert ids for removeModuleFromCourse', async () => {
    await controller.removeModuleFromCourse('11', '12');

    expect(service.removeModuleFromCourse).toHaveBeenCalledWith(11, 12);
  });
});
