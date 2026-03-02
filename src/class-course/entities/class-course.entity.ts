import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { Module as ModuleEntity } from '../../module/entities/module.entity';
import { Course } from '../../course/entities/course.entity';
import { Level } from '../../level/entities/level.entity';

@Entity('class_courses')
export class ClassCourse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'longtext', nullable: true })
  description?: string;

  @Column({ type: 'int', nullable: true, name: 'status', default: 1 })
  status: number;

  @Column()
  company_id: number;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column()
  level_id: number;

  @ManyToOne(() => Level, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'level_id' })
  level: Level;

  @Column()
  module_id: number;

  @ManyToOne(() => ModuleEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module: ModuleEntity;

  @Column()
  course_id: number;

  @ManyToOne(() => Course, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ type: 'int', nullable: true })
  volume?: number;

  @Column({ type: 'int', default: 1, name: 'weekly_frequency' })
  weeklyFrequency: number;

  @Column({ type: 'tinyint', default: 0 })
  allday: boolean;

  @Column({ type: 'int', nullable: true })
  duration?: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
