import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StudentPayment } from '../../student-payment/entities/student-payment.entity';
import { StudentPaymentDetail } from '../../student_payment_details/entities/student_payment_detail.entity';
import { Student } from '../../students/entities/student.entity';
import { Company } from '../../company/entities/company.entity';

@Entity('student_payment_allocations')
export class StudentPaymentAllocation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  student_payment_id: number;

  @ManyToOne(() => StudentPayment, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_payment_id' })
  studentPayment: StudentPayment;

  @Column()
  student_payment_detail_id: number;

  @ManyToOne(() => StudentPaymentDetail, (detail) => detail.allocations, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_payment_detail_id' })
  studentPaymentDetail: StudentPaymentDetail;

  @Column()
  student_id: number;

  @ManyToOne(() => Student, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column()
  company_id: number;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  allocated_amount: number;

  @Column({ type: 'datetime' })
  allocated_at: Date;

  @Column({ type: 'int', default: 1, name: 'statut' })
  status: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
