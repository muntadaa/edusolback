import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { SchoolYear } from '../../school-years/entities/school-year.entity';
import { Company } from '../../company/entities/company.entity';
import { StudentPaymentAllocation } from '../../student_payment_allocations/entities/student_payment_allocation.entity';

@Entity('student_payments')
export class StudentPayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  student_id: number;

  @ManyToOne(() => Student, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column()
  school_year_id: number;

  @ManyToOne(() => SchoolYear, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_year_id' })
  schoolYear: SchoolYear;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ length: 50 })
  mode: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference?: string;

  @Column()
  company_id: number;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company?: Company;

  @Column({ type: 'int', default: 2, name: 'statut' })
  status: number;

  @OneToMany(() => StudentPaymentAllocation, (allocation) => allocation.studentPayment)
  allocations: StudentPaymentAllocation[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
