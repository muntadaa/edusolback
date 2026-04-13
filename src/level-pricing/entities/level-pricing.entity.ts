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
import { Level } from '../../level/entities/level.entity';
import { Company } from '../../company/entities/company.entity';
import { StudentPayment } from '../../student-payment/entities/student-payment.entity';
import { SchoolYear } from '../../school-years/entities/school-year.entity';
import { Rubrique } from '../../rubrique/entities/rubrique.entity';

@Entity('level_pricings')
export class LevelPricing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  level_id: number;

  @ManyToOne(() => Level, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'level_id' })
  level: Level;

  @Column()
  school_year_id: number;

  @ManyToOne(() => SchoolYear, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_year_id' })
  schoolYear: SchoolYear;

  @Column({ type: 'int', nullable: true })
  rubrique_id: number | null;

  @ManyToOne(() => Rubrique, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'rubrique_id' })
  rubrique: Rubrique | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  title: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amount: number | null;

  @Column({ type: 'int', nullable: true })
  vat_rate: number | null;

  @Column({ type: 'int', nullable: true })
  occurrences: number | null;

  @Column({ type: 'tinyint', nullable: true })
  every_month: number | null;

  @Column()
  company_id: number;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'int', default: 2, name: 'statut' })
  status: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
