import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './entities/event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly repo: Repository<Event>,
  ) {}

  /** YYYY-MM-DD at local midnight (no UTC shift). */
  private parseYmd(ymd: string): Date {
    const parts = ymd.split('-').map((p) => parseInt(p, 10));
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
      throw new BadRequestException('Invalid date format; use YYYY-MM-DD');
    }
    const [y, m, d] = parts;
    return new Date(y, m - 1, d);
  }

  /**
   * Inclusive calendar days from start_date through end_date. Same day → 1. Minimum 1.
   */
  computeDuree(startDate: string, endDate: string): number {
    const start = this.parseYmd(startDate);
    const end = this.parseYmd(endDate);
    if (end < start) {
      throw new BadRequestException('end_date must be on or after start_date');
    }
    const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000);
    return Math.max(1, diffDays + 1);
  }

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const duree =
      createEventDto.duree !== undefined
        ? createEventDto.duree
        : this.computeDuree(createEventDto.start_date, createEventDto.end_date);
    const entity = this.repo.create({ ...createEventDto, duree });
    return this.repo.save(entity);
  }

  async findAll(): Promise<Event[]> {
    return this.repo.find({
      order: { start_date: 'ASC', end_date: 'ASC', id: 'ASC' },
    });
  }

  /**
   * Returns all blocking events (is_blocking = true).
   * Optional from/to (YYYY-MM-DD) filter: only events that overlap [from, to] are returned.
   * Use this for calendar/planning UI to grey out blocked days.
   */
  async findBlockingEvents(from?: string, to?: string): Promise<Event[]> {
    const qb = this.repo
      .createQueryBuilder('event')
      .where('event.is_blocking = :blocking', { blocking: true })
      .orderBy('event.start_date', 'ASC')
      .addOrderBy('event.end_date', 'ASC');
    if (from) {
      qb.andWhere('event.end_date >= :from', { from });
    }
    if (to) {
      qb.andWhere('event.start_date <= :to', { to });
    }
    return qb.getMany();
  }

  async findOne(id: number): Promise<Event> {
    const event = await this.repo.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    return event;
  }

  async update(id: number, updateEventDto: UpdateEventDto): Promise<Event> {
    const existing = await this.findOne(id);
    const merged = this.repo.merge(existing, updateEventDto);
    merged.duree =
      updateEventDto.duree !== undefined
        ? updateEventDto.duree
        : this.computeDuree(merged.start_date, merged.end_date);
    return this.repo.save(merged);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.findOne(id);
    await this.repo.remove(existing);
  }
}
