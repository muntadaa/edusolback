import { Test, TestingModule } from '@nestjs/testing';
import { ClassController } from './class.controller';
import { ClassService } from './class.service';

const createServiceMock = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('ClassController', () => {
  let controller: ClassController;
  let service: ReturnType<typeof createServiceMock>;

  beforeEach(() => {
    service = createServiceMock();
    controller = new ClassController(service as unknown as ClassService);
  });

  it('should call service.create with the dto', async () => {
    const dto = { title: 'Class A' } as any;
    const created = { id: 1 };
    service.create.mockResolvedValue(created);

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toBe(created);
  });

  it('should forward queries to service.findAll', () => {
    const query = { search: 'class' } as any;
    service.findAll.mockReturnValue('result' as any);

    const result = controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe('result');
  });

  it('should convert id to number for findOne', () => {
    controller.findOne('5');

    expect(service.findOne).toHaveBeenCalledWith(5);
  });

  it('should convert id to number for update', async () => {
    const dto = { title: 'Updated' } as any;
    service.update.mockResolvedValue({ id: 1 });

    await controller.update('7', dto);

    expect(service.update).toHaveBeenCalledWith(7, dto);
  });

  it('should convert id to number for remove', async () => {
    await controller.remove('9');

    expect(service.remove).toHaveBeenCalledWith(9);
  });
});
