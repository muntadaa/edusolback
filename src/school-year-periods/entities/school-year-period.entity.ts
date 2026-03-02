import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { SchoolYear } from 'src/school-years/entities/school-year.entity';

@Entity('school_year_periods')
export class SchoolYearPeriod {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column({ type: 'int', default: 2, name: 'statut' })
  status: number;

  @Column({ type: 'enum', enum: ['planned', 'ongoing', 'completed'], default: 'planned', name: 'lifecycle_status' })
  lifecycle_status: 'planned' | 'ongoing' | 'completed';

  @Column()
  company_id: number;

  @ManyToOne(() => Company, company => company.schoolYears, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'school_year_id', nullable: false })
  school_year_id: number;

  @ManyToOne(() => SchoolYear, (schoolYear) => schoolYear.periods, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_year_id' })
  schoolYear: SchoolYear;
}
