import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';

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
