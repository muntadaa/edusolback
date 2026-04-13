import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SchoolYear } from '../../school-years/entities/school-year.entity';
import { SchoolYearPeriod } from '../../school-year-periods/entities/school-year-period.entity';
import { Student } from '../../students/entities/student.entity';
import { StudentReportDetail } from '../../student-report-detail/entities/student-report-detail.entity';
import { Company } from '../../company/entities/company.entity';

@Entity('student_reports')
export class StudentReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_year_period_id: number;

  @ManyToOne(() => SchoolYearPeriod, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_year_period_id' })
  period: SchoolYearPeriod;

  @Column()
  school_year_id: number;

  @ManyToOne(() => SchoolYear, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_year_id' })
  year: SchoolYear;

  @Column()
  student_id: number;

  @Column()
  company_id: number;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Student, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'longtext', nullable: true })
  remarks?: string;

  @Column({ length: 100, nullable: true })
  mention?: string;

  @Column({ type: 'boolean', default: false })
  passed: boolean;

  @Column({ type: 'int', default: 2, name: 'statut' })
  status: number;

  @OneToMany(() => StudentReportDetail, detail => detail.studentReport)
  details: StudentReportDetail[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
