import { Test, TestingModule } from '@nestjs/testing';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

const createServiceMock = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('StudentsController', () => {
  let controller: StudentsController;
  let service: ReturnType<typeof createServiceMock>;

  beforeEach(() => {
    service = createServiceMock();
    controller = new StudentsController(service as unknown as StudentsService);
  });

  describe('create', () => {
    it('should attach file path when file is provided', async () => {
      const dto: any = { first_name: 'Sam' };
      const file = {
        path: 'C:/tmp/student.png',
        originalname: 'student.png',
      } as any;
      service.create.mockResolvedValue({ id: 1 });

      await controller.create(file, dto);

      expect(service.create).toHaveBeenCalledWith({
        first_name: 'Sam',
        picture: '/uploads/students/student.png',
      });
    });

    it('should remove invalid picture when no file provided', async () => {
      const dto: any = { picture: {}, first_name: 'Sara' };
      service.create.mockResolvedValue({ id: 2 });

      await controller.create(undefined, dto);

      expect(service.create).toHaveBeenCalledWith({ first_name: 'Sara' });
    });
  });

  it('should delegate findAll', () => {
    const query = { search: 'sam' } as any;
    controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('should convert id for findOne', () => {
    controller.findOne('4');

    expect(service.findOne).toHaveBeenCalledWith(4);
  });

  describe('update', () => {
    it('should set picture when file provided', async () => {
      const dto: any = { first_name: 'Sam' };
      const file = {
        path: 'C:/tmp/new.png',
        originalname: 'new.png',
      } as any;
      service.update.mockResolvedValue({ id: 1 });

      await controller.update('5', file, dto);

      expect(service.update).toHaveBeenCalledWith(5, {
        first_name: 'Sam',
        picture: '/uploads/students/new.png',
      });
    });

    it('should drop invalid picture when file missing', async () => {
      const dto: any = { picture: {}, first_name: 'Sam' };
      service.update.mockResolvedValue({ id: 1 });

      await controller.update('5', undefined, dto);

      expect(service.update).toHaveBeenCalledWith(5, { first_name: 'Sam' });
    });
  });

  it('should convert id for remove', async () => {
    await controller.remove('6');

    expect(service.remove).toHaveBeenCalledWith(6);
  });
});
