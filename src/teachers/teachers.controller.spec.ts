import { Test, TestingModule } from '@nestjs/testing';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';

const createServiceMock = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('TeachersController', () => {
  let controller: TeachersController;
  let service: ReturnType<typeof createServiceMock>;

  beforeEach(() => {
    service = createServiceMock();
    controller = new TeachersController(service as unknown as TeachersService);
  });

  describe('create', () => {
    it('should normalize file path before delegating', async () => {
      const dto: any = { first_name: 'Alice' };
      const file = {
        path: 'C:/tmp/teacher.png',
        originalname: 'teacher.png',
      } as any;
      service.create.mockResolvedValue({ id: 1 });

      await controller.create(file, dto);

      expect(service.create).toHaveBeenCalledWith({
        first_name: 'Alice',
        picture: '/uploads/teachers/teacher.png',
      });
    });

    it('should remove invalid picture when no file provided', async () => {
      const dto: any = { picture: {}, first_name: 'Bob' };
      service.create.mockResolvedValue({ id: 2 });

      await controller.create(undefined, dto);

      expect(service.create).toHaveBeenCalledWith({ first_name: 'Bob' });
    });
  });

  it('should forward queries to findAll', () => {
    const query = { search: 'teacher' } as any;
    controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('should convert id for findOne', () => {
    controller.findOne('3');

    expect(service.findOne).toHaveBeenCalledWith(3);
  });

  describe('update', () => {
    it('should add picture path when file supplied', async () => {
      const dto: any = { first_name: 'Alice' };
      const file = {
        path: 'C:/tmp/new.png',
        originalname: 'new.png',
      } as any;
      service.update.mockResolvedValue({ id: 1 });

      await controller.update('4', file, dto);

      expect(service.update).toHaveBeenCalledWith(4, {
        first_name: 'Alice',
        picture: '/uploads/teachers/new.png',
      });
    });

    it('should drop invalid picture when file missing', async () => {
      const dto: any = { picture: {}, first_name: 'Charlie' };
      service.update.mockResolvedValue({ id: 1 });

      await controller.update('5', undefined, dto);

      expect(service.update).toHaveBeenCalledWith(5, { first_name: 'Charlie' });
    });
  });

  it('should convert id for remove', async () => {
    await controller.remove('6');

    expect(service.remove).toHaveBeenCalledWith(6);
  });
});
