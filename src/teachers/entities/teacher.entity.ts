import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Company } from '../../company/entities/company.entity';

@Entity('teachers')
export class Teacher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  gender: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ type: 'date', nullable: true })
  birthday: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  email2: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  phone2: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  @Column()
  codePostal: string;

  @Column({ nullable: true })
  nationality: string;

  @Column({ nullable: true })
  picture: string;

  @Column({ type: 'int', nullable: true, name: 'statut', default: 2 })
  status: number;

  @Column({ nullable: false })
  company_id: number;

  @ManyToOne(() => Company, company => company.users, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
