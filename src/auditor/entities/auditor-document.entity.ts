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
import { Student } from '../../students/entities/student.entity';
import { ClassStudent } from '../../class-student/entities/class-student.entity';
import { RequiredDoc } from '../../required-docs/entities/required-doc.entity';
import { User } from '../../users/entities/user.entity';
import { AuditorDocumentStatus } from '../enums/auditor-document-status.enum';

@Entity('auditor')
@Index('UQ_auditor_student_template', ['student_id', 'required_doc_id'], {
  unique: true,
})
export class AuditorDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  company_id: number;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column()
  student_id: number;

  @ManyToOne(() => Student, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ nullable: true })
  class_student_id: number | null;

  @ManyToOne(() => ClassStudent, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'class_student_id' })
  classStudent: ClassStudent | null;

  @Column({ nullable: true })
  required_doc_id: number | null;

  @ManyToOne(() => RequiredDoc, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'required_doc_id' })
  requiredDoc: RequiredDoc | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'boolean', name: 'is_required_snapshot' })
  is_required_snapshot: boolean;

  @Column({ type: 'int' })
  program_id: number;

  @Column({ type: 'int' })
  specialization_id: number;

  @Column({ type: 'int' })
  level_id: number;

  @Column({ type: 'varchar', length: 32 })
  status: AuditorDocumentStatus;

  @Column({ type: 'varchar', length: 512, nullable: true })
  file_path: string | null;

  @Column({ type: 'int', nullable: true, name: 'verified_by_user_id' })
  verified_by_user_id: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'verified_by_user_id' })
  verifiedByUser: User | null;

  @Column({ type: 'datetime', nullable: true })
  verified_at: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
