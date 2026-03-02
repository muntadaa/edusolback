import { Test, TestingModule } from '@nestjs/testing';
import { StudentContactController } from './student-contact.controller';
import { StudentContactService } from './student-contact.service';

const createServiceMock = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('StudentContactController', () => {
  let controller: StudentContactController;
  let service: ReturnType<typeof createServiceMock>;

  beforeEach(() => {
    service = createServiceMock();
    controller = new StudentContactController(service as unknown as StudentContactService);
  });

  it('should delegate create to service', async () => {
    const dto = { firstname: 'John' } as any;
    await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should forward query to service.findAll', () => {
    const query = { search: 'john' } as any;
    controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('should convert id to number for findOne', () => {
    controller.findOne('4');

    expect(service.findOne).toHaveBeenCalledWith(4);
  });

  it('should convert id for update', async () => {
    const dto = { firstname: 'Jane' } as any;
    await controller.update('5', dto);

    expect(service.update).toHaveBeenCalledWith(5, dto);
  });

  it('should convert id for remove', async () => {
    await controller.remove('6');

    expect(service.remove).toHaveBeenCalledWith(6);
  });
});
