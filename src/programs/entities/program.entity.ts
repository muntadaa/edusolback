import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { Specialization } from '../../specializations/entities/specialization.entity';

@Entity('programs')
export class Program {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'longtext', nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true, name: 'pdf_file' })
  pdf_file: string | null;

  @Column({ type: 'int', default: 1 })
  status: number;

  @Column()
  company_id: number;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @OneToMany(() => Specialization, specialization => specialization.program, { cascade: true })
  specializations: Specialization[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
