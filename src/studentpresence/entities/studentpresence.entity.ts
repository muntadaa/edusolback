import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { StudentsPlanning } from '../../students-plannings/entities/students-planning.entity';
import { Student } from '../../students/entities/student.entity';
import { Company } from '../../company/entities/company.entity';
import { StudentReport } from '../../student-report/entities/student-report.entity';

/** One row per (student, session): single source of truth for teacher and controller. */
@Entity('student_presence')
@Unique('UQ_student_presence_student_planning', ['student_id', 'student_planning_id'])
export class StudentPresence {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  student_planning_id: number;

  @ManyToOne(() => StudentsPlanning, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_planning_id' })
  studentPlanning: StudentsPlanning;

  @Column()
  student_id: number;

  @ManyToOne(() => Student, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ length: 25, default: 'absent' })
  presence: string;

  @Column({ type: 'double', default: -1 })
  note: number;

  @Column({ type: 'longtext', nullable: true })
  remarks?: string;

  @Column()
  company_id: number;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ nullable: true })
  report_id?: number;

  @ManyToOne(() => StudentReport, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'report_id' })
  studentReport?: StudentReport;

  @Column({ type: 'boolean', default: false, name: 'validate_report' })
  validate_report: boolean;

  @Column({ type: 'boolean', default: false, name: 'locked' })
  locked: boolean;

  @Column({ type: 'int', default: 2, name: 'statut' })
  status: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
