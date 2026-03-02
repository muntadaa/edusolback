import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { Course } from '../../course/entities/course.entity';

@Entity('modules')
export class Module {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'intitule' })
  title: string;

  @Column({ type: 'longtext', nullable: true })
  description: string;

  @Column({ nullable: true })
  volume: number;

  @Column({ type: 'double', nullable: true })
  coefficient: number;

  @Column({ type: 'varchar', nullable: true, name: 'pdf_file' })
  pdf_file: string | null;

  @Column({ type: 'tinyint', default: 1, name: 'statut' })
  status: number;

  @Column()
  company_id: number;

  @ManyToOne(() => Company, company => company.modules, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToMany(() => Course, course => course.modules)
  @JoinTable({
    name: 'module_course',
    joinColumn: { name: 'module_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'course_id', referencedColumnName: 'id' }
  })
  courses: Course[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
