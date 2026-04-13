import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { Specialization } from '../../specializations/entities/specialization.entity';

@Entity('levels')
export class Level {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'longtext', nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true, name: 'pdf_file' })
  pdf_file: string | null;

  @Column({ type: 'int', default: 1 })
  level: number;

  @Column({ type: 'int', nullable: true, name: 'duration_months' })
  durationMonths: number | null;

  @Column({ type: 'date', nullable: true, name: 'accreditation_date' })
  accreditationDate: Date | null;

  @Column({ type: 'text', nullable: true, name: 'accreditation_text' })
  accreditationText: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'accreditation_document' })
  accreditationDocument: string | null;

  @Column({ type: 'int', default: 1 })
  status: number;

  @Column()
  company_id: number;

  @Column()
  specialization_id: number;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Specialization, (specialization) => specialization.levels, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'specialization_id' })
  specialization: Specialization;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
