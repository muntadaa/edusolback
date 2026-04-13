import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { Attestation } from '../../attestation/entities/attestation.entity';
import { Company } from '../../company/entities/company.entity';

@Entity('student_attestations')
export class StudentAttestation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  Idstudent: number;

  @ManyToOne(() => Student, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'Idstudent' })
  student: Student;

  @Column()
  Idattestation: number;

  @ManyToOne(() => Attestation, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'Idattestation' })
  attestation: Attestation;

  @Column({ type: 'date', nullable: true })
  dateask: string | null;

  @Column({ type: 'date', nullable: true })
  datedelivery: string | null;

  @Column({ type: 'longtext', nullable: true })
  description?: string | null;

  @Column({ type: 'int', nullable: true, name: 'Status', default: 1 })
  Status: number;

  @Column({ nullable: false })
  companyid: number;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyid' })
  company: Company;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
