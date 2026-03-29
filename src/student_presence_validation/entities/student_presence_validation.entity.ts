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
import { StudentPresence } from '../../studentpresence/entities/studentpresence.entity';
import { User } from '../../users/entities/user.entity';

export enum StudentPresenceValidationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('student_presence_validation')
@Unique('UQ_student_presence_validation_presence', ['student_presence_id'])
export class StudentPresenceValidation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  student_presence_id: number;

  @ManyToOne(() => StudentPresence, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_presence_id' })
  studentPresence: StudentPresence;

  @Column()
  student_id: number;

  @Column()
  session_id: number;

  @Column()
  course_id: number;

  @Column()
  module_id: number;

  @Column()
  class_id: number;

  @Column({
    type: 'enum',
    enum: StudentPresenceValidationStatus,
    default: StudentPresenceValidationStatus.PENDING,
  })
  status: StudentPresenceValidationStatus;

  @Column({ type: 'int', nullable: true })
  validated_by?: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'validated_by' })
  validatedByUser?: User | null;

  @Column({ type: 'datetime', nullable: true })
  validated_at?: Date | null;

  @Column({ type: 'longtext', nullable: true })
  rejection_reason?: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
