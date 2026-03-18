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
import { ClassEntity } from '../../class/entities/class.entity';
import { Student } from '../../students/entities/student.entity';
import { Program } from '../../programs/entities/program.entity';
import { Specialization } from '../../specializations/entities/specialization.entity';
import { Level } from '../../level/entities/level.entity';
import { SchoolYear } from '../../school-years/entities/school-year.entity';

@Entity('class_students')
export class ClassStudent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  company_id: number;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'int', nullable: true })
  class_id: number | null;

  @ManyToOne(() => ClassEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity | null;

  /**
   * Denormalized academic context for cases where class_id is null.
   * When class_id is provided, these fields are filled from the class.
   */
  @Column({ type: 'int', nullable: true })
  program_id: number | null;

  @ManyToOne(() => Program, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'program_id' })
  program: Program | null;

  @Column({ type: 'int', nullable: true })
  specialization_id: number | null;

  @ManyToOne(() => Specialization, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'specialization_id' })
  specialization: Specialization | null;

  @Column({ type: 'int', nullable: true })
  level_id: number | null;

  @ManyToOne(() => Level, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'level_id' })
  level: Level | null;

  @Column({ type: 'int', nullable: true })
  school_year_id: number | null;

  @ManyToOne(() => SchoolYear, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'school_year_id' })
  schoolYear: SchoolYear | null;

  @Column()
  student_id: number;

  @ManyToOne(() => Student, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'int', nullable: true, name: 'statut', default: 1 })
  status: number;

  @Column({ type: 'int', default: 1 })
  tri: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
