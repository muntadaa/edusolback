import { Test, TestingModule } from '@nestjs/testing';
import { SchoolYearsController } from './school-years.controller';
import { SchoolYearsService } from './school-years.service';

const createServiceMock = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('SchoolYearsController', () => {
  let controller: SchoolYearsController;
  let service: ReturnType<typeof createServiceMock>;

  beforeEach(() => {
    service = createServiceMock();
    controller = new SchoolYearsController(service as unknown as SchoolYearsService);
  });

  it('should delegate create to service', async () => {
    const dto = { title: '2024' } as any;
    await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should forward query to findAll', () => {
    const query = { title: '2024' } as any;
    controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('should convert id for findOne', () => {
    controller.findOne('4');

    expect(service.findOne).toHaveBeenCalledWith(4);
  });

  it('should convert id for update', async () => {
    const dto = { title: '2025' } as any;
    await controller.update('5', dto);

    expect(service.update).toHaveBeenCalledWith(5, dto);
  });

  it('should convert id for remove', async () => {
    await controller.remove('6');

    expect(service.remove).toHaveBeenCalledWith(6);
  });
});
