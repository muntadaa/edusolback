import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PreInscription } from '../../preinscriptions/entities/preinscription.entity';
import { Company } from '../../company/entities/company.entity';

@Entity('preinscription_diplomas')
export class PreInscriptionDiploma {
  @PrimaryGeneratedColumn()
  id: number;

  // Keep DB column names compatible while aligning property names with student_diplomes.
  @Column({ name: 'diploma_name' })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'institution' })
  school: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  diplome: string | null;

  @Column({ type: 'int', nullable: true, name: 'year' })
  annee: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  country: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  diplome_picture_1: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  diplome_picture_2: string | null;

  @Column()
  preinscription_id: number;

  @ManyToOne(() => PreInscription, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'preinscription_id' })
  preinscription: PreInscription;

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

