import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { ClassroomType } from '../../classroom-types/entities/classroom-type.entity';

@Entity('class_rooms')
export class ClassRoom {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  classroom_type_id: number | null;

  @ManyToOne(() => ClassroomType, { nullable: true })
  @JoinColumn({ name: 'classroom_type_id' })
  classroomType: ClassroomType | null;

  @Column({ type: 'int', nullable: true })
  capacity: number | null;

  @Column()
  company_id: number;

  @ManyToOne(() => Company, company => company.modules, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'int', nullable: true, name: 'statut', default: 1 })
  status: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
