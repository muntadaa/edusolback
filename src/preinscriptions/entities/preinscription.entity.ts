import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { User } from '../../users/entities/user.entity';
import { PreInscriptionStatus } from '../enums/preinscription-status.enum';
import { PreInscriptionDiploma } from '../../pre-inscription-diploma/entities/pre-inscription-diploma.entity';
import { PreinscriptionMeeting } from './preinscription-meeting.entity';

@Entity('preinscriptions')
export class PreInscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column()
  whatsapp_phone: string;

  @Column()
  email: string;

  @Column()
  nationality: string;

  @Column()
  city: string;

  @Column()
  current_formation: string;

  @Column()
  desired_formation: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  how_known: string | null;

  // Workflow status (single-table, enum as varchar for portability)
  @Column({
    type: 'enum',
    enum: PreInscriptionStatus,
    default: PreInscriptionStatus.NEW,
  })
  status: PreInscriptionStatus;

  // Commercial workflow fields (kept in same table, nullable until needed)
  @Column({ type: 'int', nullable: true })
  assigned_commercial_id: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  proposed_formation: string | null;

  @Column({ type: 'text', nullable: true })
  commercial_notes: string | null;

  // Store diploma info as JSON blob (frontend-controlled structure)
  @Column({ type: 'json', nullable: true, name: 'diplomas' })
  diplomas_json: any | null;

  @OneToMany(() => PreInscriptionDiploma, (d) => d.preinscription)
  diplomas: PreInscriptionDiploma[];

  @OneToMany(() => PreinscriptionMeeting, (m) => m.preinscription)
  meetings: PreinscriptionMeeting[];

  @Column({ type: 'text', nullable: true })
  commercial_comment: string | null;

  @Column({ type: 'int', nullable: true })
  proposed_program_id: number | null;

  @Column({ type: 'int', nullable: true })
  proposed_specialization_id: number | null;

  @Column({ type: 'int', nullable: true })
  proposed_level_id: number | null;

  @Column({ type: 'int', nullable: true })
  proposed_school_year_id: number | null;

  // Admin decision metadata
  @Column({ type: 'int', nullable: true })
  final_program_id: number | null;

  @Column({ type: 'int', nullable: true })
  final_specialization_id: number | null;

  @Column({ type: 'int', nullable: true })
  final_level_id: number | null;

  @Column({ type: 'int', nullable: true })
  final_school_year_id: number | null;

  @Column({ type: 'text', nullable: true })
  admin_comment: string | null;

  @Column({ type: 'text', nullable: true })
  admin_notes: string | null;

  @Column({ type: 'datetime', nullable: true })
  decision_at: Date | null;

  @Column({ type: 'int', nullable: true })
  commercial_id: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'commercial_id' })
  commercial: User | null;

  @Column()
  company_id: number;

  @ManyToOne(() => Company, (company) => company.users, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
