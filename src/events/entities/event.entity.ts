import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EventType {
  HOLIDAY = 'holiday',
  EXAM = 'exam',
  EVENT = 'event',
  CLOSURE = 'closure',
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'date', name: 'start_date' })
  start_date: string;

  @Column({ type: 'date', name: 'end_date' })
  end_date: string;

  /**
   * Inclusive calendar-day span between start_date and end_date (same calendar day → 1). Set by the API only.
   */
  @Column({ type: 'int', name: 'duree', default: 1 })
  duree: number;

  @Column({
    type: 'enum',
    enum: EventType,
  })
  type: EventType;

  @Column({ type: 'boolean', name: 'is_blocking', default: true })
  is_blocking: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

