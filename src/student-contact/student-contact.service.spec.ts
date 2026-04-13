import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { StudentContactService } from './student-contact.service';
import { StudentContact } from './entities/student-contact.entity';
import { StudentContactQueryDto } from './dto/student-contact-query.dto';
import { PaginationService } from '../common/services/pagination.service';

const createRepositoryMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  merge: jest.fn(),
  createQueryBuilder: jest.fn(),
}) as unknown as jest.Mocked<Repository<StudentContact>>;

const createQueryBuilderMock = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
});

describe('StudentContactService', () => {
  let service: StudentContactService;
  let repository: jest.Mocked<Repository<StudentContact>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentContactService,
        {
          provide: getRepositoryToken(StudentContact),
          useValue: createRepositoryMock(),
        },
      ],
    }).compile();

    service = module.get<StudentContactService>(StudentContactService);
    repository = module.get(getRepositoryToken(StudentContact)) as unknown as jest.Mocked<Repository<StudentContact>>;
  });

  describe('create', () => {
    it('should create, persist and return a contact', async () => {
      const dto = { firstname: 'John' } as any;
      const created = { id: 1 } as StudentContact;
      const saved = { id: 1 } as StudentContact;
      const expected = { id: 1, firstname: 'John' } as StudentContact;
      repository.create!.mockReturnValue(created);
      repository.save!.mockResolvedValue(saved);
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(created);
      expect(findOneSpy).toHaveBeenCalledWith(saved.id);
      expect(result).toBe(expected);
      findOneSpy.mockRestore();
    });

    it('should throw BadRequestException when save fails', async () => {
      repository.create!.mockReturnValue({} as StudentContact);
      repository.save!.mockRejectedValue(new Error('fail'));

      await expect(service.create({} as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated contacts', async () => {
      const qb = createQueryBuilderMock();
      repository.createQueryBuilder!.mockReturnValue(qb as any);
      const items = [{ id: 1 } as StudentContact];
      qb.getManyAndCount.mockResolvedValue([items, 1]);
      const query: StudentContactQueryDto = { page: 1, limit: 10 };

      const result = await service.findAll(query);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('c');
      expect(qb.andWhere).toHaveBeenCalledWith('c.status <> :deletedStatus', { deletedStatus: -2 });
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(qb.orderBy).toHaveBeenCalled();
      expect(result).toEqual(PaginationService.createResponse(items, 1, 10, 1));
    });
  });

  describe('findOne', () => {
    it('should return the contact when found', async () => {
      const entity = { id: 1 } as StudentContact;
      repository.findOne!.mockResolvedValue(entity);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      const args = repository.findOne.mock.calls[0][0] as any;
      expect(args.where.id).toBe(1);
      expect(args.where.status).toEqual(expect.objectContaining({ value: -2 }));
      expect(args.relations).toEqual(['studentLinkType']);
      expect(result).toBe(entity);
    });

    it('should throw NotFoundException when missing', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should merge updates and return refreshed contact', async () => {
      const dto = { firstname: 'Jane' } as any;
      const existing = { id: 1 } as StudentContact;
      const merged = { id: 1, firstname: 'Jane' } as StudentContact;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(merged);
      repository.merge!.mockReturnValue(merged);
      repository.save!.mockResolvedValue(merged);

      const result = await service.update(1, dto);

      expect(findOneSpy).toHaveBeenNthCalledWith(1, 1);
      expect(repository.merge).toHaveBeenCalledWith(existing, dto);
      expect(repository.save).toHaveBeenCalledWith(merged);
      expect(result).toBe(merged);
      findOneSpy.mockRestore();
    });

    it('should sync relation fields when ids provided', async () => {
      const dto = { studentlinktypeId: 8, company_id: 4 } as any;
      const existing = { id: 1 } as StudentContact;
      const merged = { id: 1 } as StudentContact;
      const refreshed = { id: 1, studentlinktypeId: 8, company_id: 4 } as StudentContact;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(refreshed);
      repository.merge!.mockReturnValue(merged);
      repository.save!.mockResolvedValue(merged);

      await service.update(1, dto);

      const savedArg = repository.save.mock.calls[0][0] as StudentContact;
      expect(savedArg.studentlinktypeId).toBe(8);
      expect(savedArg.studentLinkType).toEqual({ id: 8 });
      expect(savedArg.company_id).toBe(4);
      expect(savedArg.company).toEqual({ id: 4 });
      findOneSpy.mockRestore();
    });
  });

  describe('remove', () => {
    it('should remove the contact', async () => {
      const entity = { id: 1 } as StudentContact;
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
