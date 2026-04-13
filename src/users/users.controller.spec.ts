import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const createServiceMock = () => ({
  create: jest.fn(),
  findAllWithPagination: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('UsersController', () => {
  let controller: UsersController;
  let service: ReturnType<typeof createServiceMock>;

  beforeEach(() => {
    service = createServiceMock();
    controller = new UsersController(service as unknown as UsersService);
  });

  it('should delegate create to service', async () => {
    const dto = { email: 'test@example.com' } as any;
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
    const dto = { email: 'new@example.com' } as any;
    await controller.update('4', dto);

    expect(service.update).toHaveBeenCalledWith(4, dto);
  });

  it('should convert id for remove', async () => {
    await controller.remove('5');

    expect(service.remove).toHaveBeenCalledWith(5);
  });
});
