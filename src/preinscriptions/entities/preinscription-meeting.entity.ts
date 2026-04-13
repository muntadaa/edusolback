import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { PreInscription } from './preinscription.entity';

@Entity('preinscription_meetings')
export class PreinscriptionMeeting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  preinscription_id: number;

  @ManyToOne(() => PreInscription, (p) => p.meetings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'preinscription_id' })
  preinscription: PreInscription;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  meeting_at: Date;

  @Column({ type: 'text', nullable: true })
  meeting_notes: string | null;

  @CreateDateColumn()
  created_at: Date;
}
