import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Module } from '../../module/entities/module.entity';
import { Course } from '../../course/entities/course.entity';
import { SchoolYear } from 'src/school-years/entities/school-year.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  codePostal: string;

  @Column({ type: 'varchar', name: 'primary_color', length: 7, nullable: true })
  primaryColor?: string | null;

  @Column({ type: 'varchar', name: 'secondary_color', length: 7, nullable: true })
  secondaryColor?: string | null;

  @Column({ type: 'varchar', name: 'tertiary_color', length: 7, nullable: true })
  tertiaryColor?: string | null;

  @Column({ type: 'int', nullable: true, name: 'statut', default: 1 })
  status: number;

  @Column({ type: 'text', nullable: true, name: 'entete_1' })
  entete_1?: string | null;

  @Column({ type: 'text', nullable: true, name: 'entete_2' })
  entete_2?: string | null;

  @Column({ type: 'text', nullable: true, name: 'entete_3' })
  entete_3?: string | null;

  @Column({ type: 'text', nullable: true, name: 'pied_1' })
  pied_1?: string | null;

  @Column({ type: 'text', nullable: true, name: 'pied_2' })
  pied_2?: string | null;

  @Column({ type: 'text', nullable: true, name: 'pied_3' })
  pied_3?: string | null;

  @Column({ type: 'boolean', default: true, name: 'logo_left' })
  logo_left: boolean;

  @Column({ type: 'boolean', default: false, name: 'logo_right' })
  logo_right: boolean;

  @Column({ type: 'boolean', default: true, name: 'papier_entete' })
  papier_entete: boolean;

  @Column({ type: 'varchar', name: 'public_token', length: 64, nullable: true, unique: true })
  publicToken: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => User, user => user.company)
  users: User[];

  @OneToMany(() => Module, module => module.company)
  modules: Module[];

  @OneToMany(() => Course, course => course.company)
  courses: Course[];

  @OneToMany(() => SchoolYear, (schoolYear) => schoolYear.company)
  schoolYears: SchoolYear[];

}
