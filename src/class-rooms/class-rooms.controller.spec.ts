import { Test, TestingModule } from '@nestjs/testing';
import { ClassRoomsController } from './class-rooms.controller';
import { ClassRoomsService } from './class-rooms.service';

const createServiceMock = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('ClassRoomsController', () => {
  let controller: ClassRoomsController;
  let service: ReturnType<typeof createServiceMock>;

  beforeEach(() => {
    service = createServiceMock();
    controller = new ClassRoomsController(service as unknown as ClassRoomsService);
  });

  it('should delegate create to service', async () => {
    const dto = { title: 'Room 1' } as any;
    await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should forward queries to findAll', () => {
    const query = { search: 'room' } as any;
    controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
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
});
