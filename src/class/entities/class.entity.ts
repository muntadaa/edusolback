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
import { SchoolYear } from '../../school-years/entities/school-year.entity';

@Entity('classes')
export class ClassEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'longtext', nullable: true })
  description: string;

  @Column({ type: 'int', nullable: true, name: 'statut', default: 1 })
  status: number;

  @Column()
  company_id: number;

  @Column()
  program_id: number;

  @Column()
  specialization_id: number;

  @Column()
  level_id: number;

  @Column()
  school_year_id: number;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Program, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'program_id' })
  program: Program;

  @ManyToOne(() => Specialization, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'specialization_id' })
  specialization: Specialization;

  @ManyToOne(() => Level, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'level_id' })
  level: Level;

  @ManyToOne(() => SchoolYear, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_year_id' })
  schoolYear: SchoolYear;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
