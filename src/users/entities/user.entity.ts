import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Company } from '../../company/entities/company.entity';
import { UserRole } from '../../user-roles/entities/user-role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ type: 'varchar', nullable: true })
  password: string | null;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  picture: string | null;

  @Column({ type: 'boolean', nullable: false, default: false, name: 'privacy_policy_accepted' })
  privacyPolicyAccepted: boolean;

  @Column({ type: 'boolean', nullable: false, default: false, name: 'terms_accepted' })
  termsAccepted: boolean;

  @Column({ type: 'datetime', nullable: true, name: 'consent_accepted_at' })
  consentAcceptedAt: Date | null;

  @Column({ nullable: false })
  company_id: number;

 @ManyToOne(() => Company, company => company.users, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @OneToMany(() => UserRole, userRole => userRole.user)
  userRoles: UserRole[];
  
  @Column({ type: 'int', nullable: true, name: 'statut', default: 1 })
  status: number;
  
  @Column({ type: 'varchar', nullable: true, name: 'password_set_token' })
  password_set_token: string | null;
  
  @Column({ type: 'datetime', nullable: true, name: 'password_set_token_expires_at' })
  password_set_token_expires_at: Date | null;
  
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    // Only hash if password exists, is not null, and is not already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
    if (this.password && !this.password.match(/^\$2[ayb]\$.{56}$/)) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }
}
