import { Entity, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Page } from './page.entity';
import { Role } from '../../roles/entities/role.entity';

@Entity('role_pages')
export class RolePage {
  @PrimaryColumn({ name: 'role_id' })
  role_id: number;

  @PrimaryColumn({ name: 'page_id' })
  page_id: number;

  @PrimaryColumn({ name: 'company_id' })
  company_id: number;

  @ManyToOne(() => Role, role => role.rolePages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Page, page => page.rolePages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'page_id' })
  page: Page;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
