import { Test, TestingModule } from '@nestjs/testing';
import { StudentlinktypeController } from './studentlinktype.controller';
import { StudentlinktypeService } from './studentlinktype.service';

const createServiceMock = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('StudentlinktypeController', () => {
  let controller: StudentlinktypeController;
  let service: ReturnType<typeof createServiceMock>;

  beforeEach(() => {
    service = createServiceMock();
    controller = new StudentlinktypeController(service as unknown as StudentlinktypeService);
  });

  it('should call service.create with dto', async () => {
    const dto = { title: 'Parent' } as any;
    await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should delegate findAll to service', () => {
    const query = { search: 'parent' } as any;
    controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('should convert id for findOne', () => {
    controller.findOne('3');

    expect(service.findOne).toHaveBeenCalledWith(3);
  });

  it('should convert id for update', async () => {
    const dto = { title: 'Guardian' } as any;
    await controller.update('4', dto);

    expect(service.update).toHaveBeenCalledWith(4, dto);
  });

  it('should convert id for remove', async () => {
    await controller.remove('5');

    expect(service.remove).toHaveBeenCalledWith(5);
  });
});
