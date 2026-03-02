import { ModuleController } from './module.controller';
import { ModuleService } from './module.service';

const createServiceMock = () => ({
  create: jest.fn(),
  findAllWithPagination: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getModuleCourses: jest.fn(),
  batchManageModuleCourses: jest.fn(),
  addCourseToModule: jest.fn(),
  removeCourseFromModule: jest.fn(),
});

describe('ModuleController', () => {
  let controller: ModuleController;
  let service: ReturnType<typeof createServiceMock>;

  beforeEach(() => {
    service = createServiceMock();
    controller = new ModuleController(service as unknown as ModuleService);
  });

  it('should call service.create', async () => {
    const dto = { title: 'Module' } as any;
    await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should forward query to findAllWithPagination', () => {
    const query = { page: 1 } as any;
    controller.findAll(query);

    expect(service.findAllWithPagination).toHaveBeenCalledWith(query);
  });

  it('should convert id for findOne', () => {
    controller.findOne('3');

    expect(service.findOne).toHaveBeenCalledWith(3);
  });

  it('should convert id for update', async () => {
    const dto = { title: 'Updated' } as any;
    await controller.update('4', dto);

    expect(service.update).toHaveBeenCalledWith(4, dto);
  });

  it('should convert id for remove', async () => {
    await controller.remove('5');

    expect(service.remove).toHaveBeenCalledWith(5);
  });

  it('should convert id for getModuleCourses', () => {
    controller.getModuleCourses('6');

    expect(service.getModuleCourses).toHaveBeenCalledWith(6);
  });

  it('should forward batch course assignment', async () => {
    const dto = { add: [1] } as any;
    await controller.batchManageModuleCourses('7', dto);

    expect(service.batchManageModuleCourses).toHaveBeenCalledWith(7, dto);
  });

  it('should convert ids for addCourseToModule', async () => {
    await controller.addCourseToModule('8', '9');

    expect(service.addCourseToModule).toHaveBeenCalledWith(8, 9);
  });

  it('should convert ids for removeCourseFromModule', async () => {
    await controller.removeCourseFromModule('10', '11');

    expect(service.removeCourseFromModule).toHaveBeenCalledWith(10, 11);
  });
});
