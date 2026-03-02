import { Test, TestingModule } from '@nestjs/testing';
import { ProgramController } from './programs.controller';
import { ProgramService } from './programs.service';

const createServiceMock = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('ProgramController', () => {
  let controller: ProgramController;
  let service: ReturnType<typeof createServiceMock>;

  beforeEach(() => {
    service = createServiceMock();
    controller = new ProgramController(service as unknown as ProgramService);
  });

  it('should call service.create with dto', async () => {
    const dto = { title: 'Program' } as any;
    await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should ask service for all programs', () => {
    const query = { search: 'prog' } as any;
    controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('should convert id to number for findOne', () => {
    controller.findOne('6');

    expect(service.findOne).toHaveBeenCalledWith(6);
  });

  it('should convert id to number for update', async () => {
    const dto = { title: 'Updated' } as any;
    await controller.update('7', dto);

    expect(service.update).toHaveBeenCalledWith(7, dto);
  });

  it('should convert id to number for remove', async () => {
    await controller.remove('8');

    expect(service.remove).toHaveBeenCalledWith(8);
  });
});
