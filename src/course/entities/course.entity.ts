import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, ManyToMany } from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { Module } from '../../module/entities/module.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'intitule' })
  title: string;

  @Column({ type: 'longtext', nullable: true })
  description: string;

  @Column({ nullable: true })
  volume: number;

  @Column({ type: 'double', nullable: true })
  coefficient: number;

  @Column({ type: 'varchar', nullable: true, name: 'pdf_file' })
  pdf_file: string | null;

  @Column({ type: 'tinyint', default: 1, name: 'statut' })
  status: number;

  @Column()
  company_id: number;

  @ManyToOne(() => Company, company => company.courses, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToMany(() => Module, module => module.courses)
  modules: Module[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
