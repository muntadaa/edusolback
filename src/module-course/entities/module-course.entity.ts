import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Module as ModuleEntity } from '../../module/entities/module.entity';
import { Course } from '../../course/entities/course.entity';

@Entity('module_course')
export class ModuleCourse {
  @PrimaryColumn()
  module_id: number;

  @PrimaryColumn()
  course_id: number;

  @ManyToOne(() => ModuleEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module: ModuleEntity;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ type: 'int', default: 0 })
  tri: number;

  @Column({ type: 'int', nullable: true })
  volume?: number | null;

  @Column({ type: 'double', nullable: true })
  coefficient?: number | null;

  @Column({ type: 'int', default: 1 })
  status: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

