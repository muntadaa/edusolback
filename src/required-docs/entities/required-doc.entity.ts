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
import { Program } from '../../programs/entities/program.entity';
import { Specialization } from '../../specializations/entities/specialization.entity';
import { Level } from '../../level/entities/level.entity';

@Entity('required_docs')
export class RequiredDoc {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  company_id: number;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  /** Null = applies to any program (for this row’s other dimensions). */
  @Column({ nullable: true })
  program_id: number | null;

  @ManyToOne(() => Program, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'program_id' })
  program: Program | null;

  @Column({ nullable: true })
  specialization_id: number | null;

  @ManyToOne(() => Specialization, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'specialization_id' })
  specialization: Specialization | null;

  @Column({ nullable: true })
  level_id: number | null;

  @ManyToOne(() => Level, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'level_id' })
  level: Level | null;

  /** Document display name (e.g. CIN copy). */
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'boolean', default: true })
  is_required: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
