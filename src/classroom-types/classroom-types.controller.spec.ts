import { Test, TestingModule } from '@nestjs/testing';
import { ClassroomTypesController } from './classroom-types.controller';
import { ClassroomTypesService } from './classroom-types.service';

const createServiceMock = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('ClassroomTypesController', () => {
  let controller: ClassroomTypesController;
  let service: ReturnType<typeof createServiceMock>;

  beforeEach(() => {
    service = createServiceMock();
    controller = new ClassroomTypesController(service as unknown as ClassroomTypesService);
  });

  it('should call service.create with dto and companyId', async () => {
    const dto = { title: 'Lecture Hall' } as any;
    const req = { user: { company_id: 1 } };
    await controller.create(req as any, dto);

    expect(service.create).toHaveBeenCalledWith(dto, 1);
  });

  it('should throw BadRequestException if user has no company_id', async () => {
    const dto = { title: 'Lecture Hall' } as any;
    const req = { user: {} };

    await expect(controller.create(req as any, dto)).rejects.toThrow('User must belong to a company');
  });

  it('should delegate findAll to service', () => {
    const query = { search: 'lecture' } as any;
    const req = { user: { company_id: 1 } };
    controller.findAll(req as any, query);

    expect(service.findAll).toHaveBeenCalledWith(query, 1);
  });

  it('should convert id for findOne', () => {
    const req = { user: { company_id: 1 } };
    controller.findOne(req as any, '3');

    expect(service.findOne).toHaveBeenCalledWith(3, 1);
  });

  it('should convert id for update', async () => {
    const dto = { title: 'Computer Lab' } as any;
    const req = { user: { company_id: 1 } };
    await controller.update(req as any, '4', dto);

    expect(service.update).toHaveBeenCalledWith(4, dto, 1);
  });

  it('should convert id for remove', async () => {
    const req = { user: { company_id: 1 } };
    await controller.remove(req as any, '5');

    expect(service.remove).toHaveBeenCalledWith(5, 1);
  });
});

