import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';

/**
 * synchronize: false — avoids TypeORM dev sync issuing DROP INDEX on UQ_student_company_matricule_ecole,
 * which MySQL rejects (that index backs FK students.company_id → companies). Schema for `students` is
 * applied via SQL migrations / manual DDL; uniqueness of matricule_ecole per company is still enforced in app code.
 */
@Entity('students', { synchronize: false })
@Index('IDX_students_company_id', ['company_id'])
@Index('UQ_student_company_matricule_ecole', ['company_id', 'matricule_ecole'], { unique: true })
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  gender: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ type: 'date', nullable: true })
  birthday: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  email2: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  phone2: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  codePostal: string;

  @Column({ nullable: true })
  nationality: string;

  @Column({ nullable: true })
  picture: string;

  @Column({ type: 'int', nullable: true, name: 'statut', default: 1 })
  status: number;

  /** Auto-assigned on pre-inscription conversion; format YYYY + 5 digits (e.g. 202600001). Unique per company. */
  @Column({ type: 'varchar', length: 32, name: 'matricule_ecole', nullable: true })
  matricule_ecole: string | null;

  /** Official / state matricule; entered manually by admin. */
  @Column({ type: 'varchar', length: 64, name: 'matricule_etat', nullable: true })
  matricule_etat: string | null;

  @Column()
  company_id: number;

  @ManyToOne(() => Company, company => company.users, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
