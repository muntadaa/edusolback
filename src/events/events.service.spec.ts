import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity';

describe('EventsService', () => {
  let service: EventsService;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockRepo = {
      findOne: jest.fn(),
      merge: jest.fn((existing: object, dto: object) => ({ ...existing, ...dto })),
      save: jest.fn((e: unknown) => Promise.resolve(e)),
      create: jest.fn((e: unknown) => e),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getRepositoryToken(Event),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('computeDuree', () => {
    it('same calendar day returns 1', () => {
      expect(service.computeDuree('2026-03-15', '2026-03-15')).toBe(1);
    });

    it('inclusive span across days', () => {
      expect(service.computeDuree('2026-03-15', '2026-03-20')).toBe(6);
    });

    it('end before start throws', () => {
      expect(() => service.computeDuree('2026-03-20', '2026-03-15')).toThrow();
    });
  });

  describe('update', () => {
    const existing = {
      id: 1,
      title: 'T',
      description: null,
      start_date: '2026-03-15',
      end_date: '2026-03-20',
      duree: 6,
      type: 'exam',
      is_blocking: true,
    };

    beforeEach(() => {
      mockRepo.findOne.mockResolvedValue({ ...existing });
    });

    it('uses manual duree when provided', async () => {
      await service.update(1, { duree: 99 } as never);
      expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ duree: 99 }));
    });

    it('recomputes duree from dates when duree omitted', async () => {
      await service.update(1, { title: 'Renamed' } as never);
      expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ duree: 6 }));
    });
  });
});
