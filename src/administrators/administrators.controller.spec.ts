import { Test, TestingModule } from '@nestjs/testing';
import { AdministratorsController } from './administrators.controller';
import { AdministratorsService } from './administrators.service';

const createServiceMock = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('AdministratorsController', () => {
  let controller: AdministratorsController;
  let service: ReturnType<typeof createServiceMock>;

  beforeEach(() => {
    service = createServiceMock();
    controller = new AdministratorsController(service as unknown as AdministratorsService);
  });

  describe('create', () => {
    it('should set picture path when file is provided and forward to service', async () => {
      const dto: any = { first_name: 'John' };
      const file = {
        path: 'C:/uploads/tmp/admin.png',
        originalname: 'admin.png',
      } as any;
      const created = { id: 1 };
      service.create.mockResolvedValue(created);

      const result = await controller.create(file, dto);

      expect(service.create).toHaveBeenCalledWith(
        expect.objectContaining({
          picture: '/uploads/administrators/admin.png',
          first_name: 'John',
        }),
      );
      expect(result).toBe(created);
    });

    it('should strip invalid picture field when file missing', async () => {
      const dto: any = { picture: {}, first_name: 'Jane' };
      service.create.mockResolvedValue({ id: 2 });

      await controller.create(undefined, dto);

      expect(service.create).toHaveBeenCalledWith({ first_name: 'Jane' });
    });
  });

  describe('findAll', () => {
    it('should delegate to service', () => {
      const query = { search: 'john' } as any;
      controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should convert id to number and call service', () => {
      service.findOne.mockResolvedValue({ id: 1 });

      controller.findOne('5');

      expect(service.findOne).toHaveBeenCalledWith(5);
    });
  });

  describe('update', () => {
    it('should update picture when file present', async () => {
      const dto: any = { first_name: 'John' };
      const file = {
        path: 'C:/uploads/tmp/new.png',
        originalname: 'image.png',
      } as any;
      service.update.mockResolvedValue({ id: 1 });

      await controller.update('7', file, dto);

      expect(service.update).toHaveBeenCalledWith(7, {
        first_name: 'John',
        picture: '/uploads/administrators/new.png',
      });
    });

    it('should delete invalid picture when file not provided', async () => {
      const dto: any = { picture: {}, first_name: 'Jane' };
      service.update.mockResolvedValue({ id: 1 });

      await controller.update('3', undefined, dto);

      expect(service.update).toHaveBeenCalledWith(3, { first_name: 'Jane' });
    });
  });

  describe('remove', () => {
    it('should convert id and call service.remove', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('9');

      expect(service.remove).toHaveBeenCalledWith(9);
    });
  });
});
