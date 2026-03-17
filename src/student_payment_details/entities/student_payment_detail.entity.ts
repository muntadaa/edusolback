import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { SchoolYear } from '../../school-years/entities/school-year.entity';
import { Level } from '../../level/entities/level.entity';
import { LevelPricing } from '../../level-pricing/entities/level-pricing.entity';
import { Rubrique } from '../../rubrique/entities/rubrique.entity';
import { Company } from '../../company/entities/company.entity';
import { ClassEntity } from '../../class/entities/class.entity';
import { StudentPaymentAllocation } from '../../student_payment_allocations/entities/student_payment_allocation.entity';

@Entity('student_payment_details')
export class StudentPaymentDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, unique: true })
  line_key: string;

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

  @Column({ type: 'int', nullable: true })
  class_id: number | null;

  @ManyToOne(() => ClassEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity | null;

  @Column({ type: 'int', nullable: true })
  level_pricing_id: number | null;

  @ManyToOne(() => LevelPricing, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'level_pricing_id' })
  levelPricing: LevelPricing | null;

  @Column({ type: 'int', nullable: true })
  rubrique_id: number | null;

  @ManyToOne(() => Rubrique, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'rubrique_id' })
  rubrique: Rubrique | null;

  @Column({ length: 50, default: 'level_pricing' })
  source_type: string;

  @Column({ type: 'int', nullable: true })
  source_reference_id: number | null;

  @Column({ length: 150 })
  title: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount_ht: number;

  @Column({ type: 'int', default: 0 })
  vat_rate: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount_ttc: number;

  @Column({ type: 'int', default: 1 })
  occurrence_index: number;

  @Column({ type: 'int', default: 1 })
  occurrences: number;

  @Column({ type: 'tinyint', default: 0 })
  every_month: number;

  @Column({ type: 'date', nullable: true })
  due_date: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  period_label: string | null;

  @Column()
  company_id: number;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'int', default: 1, name: 'statut' })
  status: number;

  @OneToMany(() => StudentPaymentAllocation, (allocation) => allocation.studentPaymentDetail)
  allocations: StudentPaymentAllocation[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
