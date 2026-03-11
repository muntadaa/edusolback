import { Injectable, NotFoundException } from '@nestjs/common';
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

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const entity = this.repo.create(createEventDto);
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
    return this.repo.save(merged);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.findOne(id);
    await this.repo.remove(existing);
  }
}
