import { Test, TestingModule } from '@nestjs/testing';
import { StudentDiplomeController } from './student-diplome.controller';
import { StudentDiplomeService } from './student-diplome.service';

const createServiceMock = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('StudentDiplomeController', () => {
  let controller: StudentDiplomeController;
  let service: ReturnType<typeof createServiceMock>;

  beforeEach(() => {
    service = createServiceMock();
    controller = new StudentDiplomeController(service as unknown as StudentDiplomeService);
  });

  it('should call service.create with dto', async () => {
    const dto = { title: 'BSc' } as any;
    await controller.create(undefined, dto);

    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should delegate query to findAll', () => {
    const query = { search: 'BSc' } as any;
    controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('should convert id to number for findOne', () => {
    controller.findOne('4');

    expect(service.findOne).toHaveBeenCalledWith(4);
  });

  it('should convert id for update', async () => {
    const dto = { title: 'MSc' } as any;
    await controller.update('5', undefined, dto);

    expect(service.update).toHaveBeenCalledWith(5, dto);
  });

  it('should convert id for remove', async () => {
    await controller.remove('6');

    expect(service.remove).toHaveBeenCalledWith(6);
  });
});
