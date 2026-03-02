import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { SchoolYear } from '../../school-years/entities/school-year.entity';
import { Level } from '../../level/entities/level.entity';
import { LevelPricing } from '../../level-pricing/entities/level-pricing.entity';
import { Company } from '../../company/entities/company.entity';

@Entity('student_payments')
export class StudentPayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  student_id: number;

  @ManyToOne(() => Student, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column()
  school_year_id: number;

  @ManyToOne(() => SchoolYear, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_year_id' })
  schoolYear: SchoolYear;

  @Column()
  level_id: number;

  @ManyToOne(() => Level, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'level_id' })
  level: Level;

  @Column({ nullable: true })
  level_pricing_id?: number;

  @ManyToOne(() => LevelPricing, pricing => pricing.payments, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'level_pricing_id' })
  levelPricing?: LevelPricing;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  payment: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ length: 50 })
  mode: string;

  @Column({ length: 100, nullable: true })
  reference?: string;

  @Column()
  company_id: number;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company?: Company;

  @Column({ type: 'int', default: 2, name: 'statut' })
  status: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
