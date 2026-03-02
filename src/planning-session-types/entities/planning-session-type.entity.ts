import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { StudentsPlanning } from '../../students-plannings/entities/students-planning.entity';
import { Company } from '../../company/entities/company.entity';

@Entity('planning_session_types')
export class PlanningSessionType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  title: string;

  @Column({ length: 50 })
  type: string;

  @Column({ type: 'double', nullable: true })
  coefficient?: number;

  @Column()
  company_id: number;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ length: 50, default: 'active' })
  status: string;

  @OneToMany(() => StudentsPlanning, planning => planning.planningSessionType)
  studentsPlannings: StudentsPlanning[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
