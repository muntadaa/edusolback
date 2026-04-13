import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { UserRole } from '../../user-roles/entities/user-role.entity';
import { RolePage } from '../../pages/entities/role-page.entity';

@Entity('roles')
@Index(['code', 'company_id'], { unique: true })
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  label: string;

  @Column({ name: 'company_id', nullable: true })
  company_id: number | null;

  @ManyToOne(() => Company, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company | null;

  @Column({ type: 'boolean', default: false, name: 'is_system' })
  is_system: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => UserRole, userRole => userRole.role)
  userRoles: UserRole[];

  @OneToMany(() => RolePage, rolePage => rolePage.role)
  rolePages: RolePage[];
}
