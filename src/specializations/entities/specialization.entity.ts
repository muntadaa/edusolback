import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Program } from '../../programs/entities/program.entity';
import { Company } from '../../company/entities/company.entity';
import { Level } from '../../level/entities/level.entity';

@Entity('specializations')
export class Specialization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true, name: 'pdf_file' })
  pdf_file: string | null;

  @Column({ type: 'int', default: 1 })
  status: number;

  @Column()
  company_id: number;

  @Column()
  program_id: number;

  @ManyToOne(() => Program, program => program.specializations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'program_id' })
  program: Program;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @OneToMany(() => Level, level => level.specialization)
  levels: Level[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
