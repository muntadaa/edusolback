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

@Entity('level_pricings')
export class LevelPricing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  level_id: number;

  @ManyToOne(() => Level, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'level_id' })
  level: Level;

  @Column({ length: 150 })
  title: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'int', default: 1 })
  occurrences: number;

  @Column({ type: 'tinyint', default: 0 })
  every_month: number;

  @Column()
  company_id: number;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'int', default: 2, name: 'statut' })
  status: number;

  @OneToMany(() => StudentPayment, payment => payment.levelPricing)
  payments: StudentPayment[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
