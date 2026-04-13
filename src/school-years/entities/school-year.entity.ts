import { Company } from 'src/company/entities/company.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { SchoolYearPeriod } from 'src/school-year-periods/entities/school-year-period.entity';

/** At most one row per company may have `lifecycle_status === 'ongoing'` (enforced in {@link SchoolYearsService}). */
@Entity('school_years')
export class SchoolYear {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column({ type: 'int', default: 2 , name: 'statut' })
  status: number;

  @Column({ type: 'enum', enum: ['planned', 'ongoing', 'completed'], default: 'planned', name: 'lifecycle_status' })
  lifecycle_status: 'planned' | 'ongoing' | 'completed';

  @Column()
  company_id: number;

  @ManyToOne(() => Company, (company) => company.schoolYears, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @OneToMany(() => SchoolYearPeriod, (period) => period.schoolYear, { cascade: true })
  periods: SchoolYearPeriod[];
}
