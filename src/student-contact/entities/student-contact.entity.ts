import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { StudentLinkType } from '../../studentlinktype/entities/studentlinktype.entity';
import { Company } from '../../company/entities/company.entity';
import { Student } from '../../students/entities/student.entity';

@Entity('student_contacts')
export class StudentContact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstname: string;

  @Column()
  lastname: string;

  @Column({ type: 'date', nullable: true })
  birthday: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  adress: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  codePostal: string;

  @Column({ nullable: true })
  student_id: number;

  @ManyToOne(() => Student, { nullable: true })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ nullable: true })
  studentlinktypeId: number;

  @ManyToOne(() => StudentLinkType, { nullable: true })
  @JoinColumn({ name: 'studentlinktypeId' })
  studentLinkType: StudentLinkType;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'int', nullable: true, name: 'statut', default: 1 })
  status: number;

  @Column()
  company_id: number;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;
}

