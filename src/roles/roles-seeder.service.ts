import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesSeederService implements OnModuleInit {
  private readonly logger = new Logger(RolesSeederService.name);

  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    await this.seedSystemRoles();
  }

  /**
   * Seed system roles at startup
   */
  private async seedSystemRoles() {
    const systemRoles = [
      { code: 'admin', label: 'Administrator', is_system: true },
      { code: 'finance', label: 'Finance', is_system: true },
      { code: 'student', label: 'Student', is_system: true },
      { code: 'teacher', label: 'Teacher', is_system: true },
      { code: 'direction', label: 'Direction', is_system: true },
      { code: 'scholarity', label: 'Scholarity', is_system: true },
      { code: 'support', label: 'Support', is_system: true },
      { code: 'parents', label: 'Parents', is_system: true },
    ];

    for (const roleData of systemRoles) {
      const existing = await this.roleRepository.findOne({
        where: { code: roleData.code, company_id: IsNull() },
      });

      if (!existing) {
        const role = this.roleRepository.create({
          ...roleData,
          company_id: null,
        });
        await this.roleRepository.save(role);
        this.logger.log(`Created system role: ${roleData.code}`);
      } else {
        this.logger.debug(`System role already exists: ${roleData.code}`);
      }
    }
  }
}
