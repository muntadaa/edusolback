import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ClassRoomsService } from './class-rooms.service';
import { ClassRoom } from './entities/class-room.entity';
import { ClassRoomQueryDto } from './dto/class-room-query.dto';
import { PaginationService } from '../common/services/pagination.service';

const createRepositoryMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
  createQueryBuilder: jest.fn(),
}) as unknown as jest.Mocked<Repository<ClassRoom>>;

const createQueryBuilderMock = () => ({
  andWhere: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
});

describe('ClassRoomsService', () => {
  let service: ClassRoomsService;
  let repository: jest.Mocked<Repository<ClassRoom>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassRoomsService,
        {
          provide: getRepositoryToken(ClassRoom),
          useValue: createRepositoryMock(),
        },
      ],
    }).compile();

    service = module.get<ClassRoomsService>(ClassRoomsService);
    repository = module.get(getRepositoryToken(ClassRoom)) as unknown as jest.Mocked<Repository<ClassRoom>>;
  });

  describe('create', () => {
    it('should create and persist the classroom', async () => {
      const dto = { title: 'Room 1' } as any;
      const created = { id: 1 } as ClassRoom;
      const saved = { id: 1, title: 'Room 1' } as ClassRoom;
      repository.create!.mockReturnValue(created);
      repository.save!.mockResolvedValue(saved);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(created);
      expect(result).toBe(saved);
    });

    it('should throw BadRequestException on persistence error', async () => {
      repository.create!.mockReturnValue({} as ClassRoom);
      repository.save!.mockRejectedValue(new Error('fail'));

      await expect(service.create({} as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated classrooms', async () => {
      const qb = createQueryBuilderMock();
      repository.createQueryBuilder!.mockReturnValue(qb as any);
      const items = [{ id: 1 } as ClassRoom];
      qb.getManyAndCount.mockResolvedValue([items, 1]);
      const query: ClassRoomQueryDto = { page: 1, limit: 4 };

      const result = await service.findAll(query);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('cr');
      expect(qb.andWhere).toHaveBeenCalledWith('cr.status <> :deletedStatus', { deletedStatus: -2 });
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(4);
      expect(result).toEqual(PaginationService.createResponse(items, 1, 4, 1));
    });
  });

  describe('findOne', () => {
    it('should return classroom when found', async () => {
      const entity = { id: 1 } as ClassRoom;
      repository.findOne!.mockResolvedValue(entity);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      const args = repository.findOne.mock.calls[0][0] as any;
      expect(args.where.id).toBe(1);
      expect(args.where.status).toEqual(expect.objectContaining({ value: -2 }));
      expect(result).toBe(entity);
    });

    it('should throw NotFoundException when classroom missing', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should merge updates and return saved classroom', async () => {
      const dto = { title: 'Room 2' } as any;
      const existing = { id: 1 } as ClassRoom;
      const merged = { id: 1, title: 'Room 2' } as ClassRoom;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(existing);
      repository.merge!.mockReturnValue(merged);
      repository.save!.mockResolvedValue(merged);

      const result = await service.update(1, dto);

      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(repository.merge).toHaveBeenCalledWith(existing, dto);
      expect(repository.save).toHaveBeenCalledWith(merged);
      expect(result).toBe(merged);
      findOneSpy.mockRestore();
    });
  });

  describe('remove', () => {
    it('should remove the classroom', async () => {
      const entity = { id: 1 } as ClassRoom;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(entity);

      await service.remove(1);

      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(repository.remove).toHaveBeenCalledWith(entity);
      findOneSpy.mockRestore();
    });
  });
});
