import { Test, TestingModule } from '@nestjs/testing';
import { SchoolYearPeriodsController } from './school-year-periods.controller';
import { SchoolYearPeriodsService } from './school-year-periods.service';

const createServiceMock = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('SchoolYearPeriodsController', () => {
  let controller: SchoolYearPeriodsController;
  let service: ReturnType<typeof createServiceMock>;

  beforeEach(() => {
    service = createServiceMock();
    controller = new SchoolYearPeriodsController(service as unknown as SchoolYearPeriodsService);
  });

  it('should delegate create', async () => {
    const dto = { title: 'Q1' } as any;
    await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should forward query to findAll', () => {
    const query = { title: 'Q' } as any;
    controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('should convert id for findOne', () => {
    controller.findOne('4');

    expect(service.findOne).toHaveBeenCalledWith(4);
  });

  it('should convert id for update', async () => {
    const dto = { title: 'Q2' } as any;
    await controller.update('5', dto);

    expect(service.update).toHaveBeenCalledWith(5, dto);
  });

  it('should convert id for remove', async () => {
    await controller.remove('6');

    expect(service.remove).toHaveBeenCalledWith(6);
  });
});
