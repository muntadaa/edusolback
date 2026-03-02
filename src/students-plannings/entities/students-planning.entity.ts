import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { ClassEntity } from '../../class/entities/class.entity';
import { ClassRoom } from '../../class-rooms/entities/class-room.entity';
import { Company } from '../../company/entities/company.entity';
import { PlanningSessionType } from '../../planning-session-types/entities/planning-session-type.entity';
import { SchoolYear } from '../../school-years/entities/school-year.entity';
import { Course } from '../../course/entities/course.entity';
import { ClassCourse } from '../../class-course/entities/class-course.entity';

@Entity('planning_students')
export class StudentsPlanning {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  period: string;

  @Column()
  teacher_id: number;

  @ManyToOne(() => Teacher, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;
  
  @Column()
  course_id: number;

  @ManyToOne(() => Course, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;
  
  @Column()
  class_id: number;

  @ManyToOne(() => ClassEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity;

  @Column({ nullable: true })
  class_room_id: number | null;

  @ManyToOne(() => ClassRoom, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_room_id' })
  classRoom: ClassRoom | null;

  @Column({ nullable: true })
  planning_session_type_id: number | null;

  @ManyToOne(() => PlanningSessionType, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'planning_session_type_id' })
  planningSessionType: PlanningSessionType | null;

  @Column({ type: 'date' })
  date_day: string;

  @Column({ type: 'time' })
  hour_start: string;

  @Column({ type: 'time' })
  hour_end: string;

  @Column()
  company_id: number;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ nullable: true })
  school_year_id?: number;

  @ManyToOne(() => SchoolYear, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_year_id' })
  schoolYear?: SchoolYear;

  @Column({ nullable: true })
  class_course_id?: number | null;

  @ManyToOne(() => ClassCourse, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'class_course_id' })
  classCourse?: ClassCourse | null;

  @Column({ type: 'int', default: 2, name: 'statut' })
  status: number;

  @Column({ type: 'boolean', default: false, name: 'is_duplicated' })
  is_duplicated: boolean;

  @Column({ type: 'int', nullable: true, name: 'duplication_source_id' })
  duplication_source_id: number | null;

  @Column({ type: 'boolean', default: false, name: 'has_notes' })
  hasNotes: boolean;

  /** 0=DRAFT, 1=TEACHER_VALIDATED, 2=LOCKED (legacy). Kept in sync with presence_validated_* booleans. */
  @Column({ type: 'tinyint', default: 0, name: 'presence_validation_status' })
  presence_validation_status: number;

  /** 0=DRAFT, 1=TEACHER_VALIDATED, 2=LOCKED (legacy). Kept in sync with notes_validated_* booleans. */
  @Column({ type: 'tinyint', default: 0, name: 'notes_validation_status' })
  notes_validation_status: number;

  @Column({ type: 'boolean', default: false, name: 'presence_validated_teacher' })
  presence_validated_teacher: boolean;

  @Column({ type: 'boolean', default: false, name: 'presence_validated_controleur' })
  presence_validated_controleur: boolean;

  @Column({ type: 'boolean', default: false, name: 'notes_validated_teacher' })
  notes_validated_teacher: boolean;

  @Column({ type: 'boolean', default: false, name: 'notes_validated_controleur' })
  notes_validated_controleur: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
