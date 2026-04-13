import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UsersQueryDto } from './dto/users-query.dto';
import { PaginationService } from '../common/services/pagination.service';

const createRepositoryMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
}) as unknown as jest.Mocked<Repository<User>>;

const createQueryBuilderMock = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: createRepositoryMock(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User)) as unknown as jest.Mocked<Repository<User>>;
  });

  describe('create', () => {
    it('should create and persist user', async () => {
      const dto = { email: 'test@example.com' } as any;
      const user = { id: 1 } as User;
      repository.create!.mockReturnValue(user);
      repository.save!.mockResolvedValue(user);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(user);
      expect(result).toBe(user);
    });
  });

  describe('findAll', () => {
    it('should return users with relations', async () => {
      const users = [{ id: 1 }] as User[];
      repository.find!.mockResolvedValue(users);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledTimes(1);
      const args = repository.find.mock.calls[0][0] as any;
      expect(args.relations).toEqual(['company']);
      expect(args.where.status).toEqual(expect.objectContaining({ value: -2 }));
      expect(result).toBe(users);
    });
  });

  describe('findAllWithPagination', () => {
    it('should return paginated users', async () => {
      const qb = createQueryBuilderMock();
      repository.createQueryBuilder!.mockReturnValue(qb as any);
      const users = [{ id: 1 }] as User[];
      qb.getManyAndCount.mockResolvedValue([users, 1]);
      const query: UsersQueryDto = { page: 2, limit: 4, search: 'test', status: 1 };

      const result = await service.findAllWithPagination(query);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(qb.andWhere).toHaveBeenCalledWith('user.status <> :deletedStatus', { deletedStatus: -2 });
      expect(qb.skip).toHaveBeenCalledWith(4);
      expect(qb.take).toHaveBeenCalledWith(4);
      expect(result).toEqual(PaginationService.createResponse(users, 2, 4, 1));
    });
  });

  describe('findOne', () => {
    it('should return user when found', async () => {
      const user = { id: 1, status: 1 } as User;
      repository.findOne!.mockResolvedValue(user);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      const args = repository.findOne.mock.calls[0][0] as any;
      expect(args.where.id).toBe(1);
      expect(args.where.status).toEqual(expect.objectContaining({ value: -2 }));
      expect(args.relations).toEqual(['company']);
      expect(result).toBe(user);
    });

    it('should throw NotFoundException when missing', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });

  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      const user = { id: 1, status: 1 } as User;
      repository.findOne!.mockResolvedValue(user);

      const result = await service.findByEmail('test@example.com');

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      const args = repository.findOne.mock.calls[0][0] as any;
      expect(args.where.email).toBe('test@example.com');
      expect(args.where.status).toEqual(expect.objectContaining({ value: -2 }));
      expect(args.relations).toEqual(['company']);
      expect(result).toBe(user);
    });

    it('should throw NotFoundException when email missing', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findByEmail('missing@example.com')).rejects.toThrow(NotFoundException);
    });

  });

  describe('update', () => {
    it('should merge fields and save', async () => {
      const user = { id: 1, username: 'old' } as User;
      const dto = { username: 'new' } as any;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(user);
      repository.save!.mockResolvedValue(user);

      const result = await service.update(1, dto);

      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(user.username).toBe('new');
      expect(repository.save).toHaveBeenCalledWith(user);
      expect(result).toBe(user);
      findOneSpy.mockRestore();
    });
  });

  describe('remove', () => {
    it('should remove user after lookup', async () => {
      const user = { id: 1 } as User;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(user);
      repository.remove!.mockResolvedValue(user);

      await service.remove(1);

      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(repository.remove).toHaveBeenCalledWith(user);
      findOneSpy.mockRestore();
    });
  });
});
