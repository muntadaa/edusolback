import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Page } from './entities/page.entity';

@Injectable()
export class PagesSeederService implements OnModuleInit {
  private readonly logger = new Logger(PagesSeederService.name);

  constructor(
    @InjectRepository(Page)
    private pageRepository: Repository<Page>,
  ) {}

  async onModuleInit() {
    await this.seedSystemPages();
  }

  /**
   * Seed system pages at startup
   * These are the essential pages that should exist before any user registration
   */
  private async seedSystemPages() {
    const systemPages = [
      // Core pages
      { route: '/dashboard', title: 'Dashboard' },
      { route: '/users', title: 'Users' },
      { route: '/companies', title: 'Companies' },
      
      // Settings pages (essential for admin role assignment)
      { route: '/settings', title: 'Settings' },
      { route: '/settings/access', title: 'Page Access Management' },
      { route: '/settings/roles', title: 'Roles Management' },
      { route: '/settings/colors', title: 'Color Settings' },
      { route: '/settings/company', title: 'Company Settings' },
      { route: '/settings/user', title: 'User Settings' },
      { route: '/settings/types', title: 'Types Settings' },
      { route: '/settings/types/link', title: 'Link Types' },
      { route: '/settings/types/classroom', title: 'Classroom Types' },
      { route: '/settings/types/planning', title: 'Planning Session Types' },
      
      // Main entity pages
      { route: '/administrators', title: 'Administrators' },
      { route: '/students', title: 'Students' },
      { route: '/teachers', title: 'Teachers' },
      { route: '/courses', title: 'Courses' },
      { route: '/modules', title: 'Modules' },
      { route: '/classes', title: 'Classes' },
      { route: '/class-rooms', title: 'Class Rooms' },
      { route: '/class-students', title: 'Class Students' },
      { route: '/class-courses', title: 'Class Courses' },
      
      // Academic management
      { route: '/school-years', title: 'School Years' },
      { route: '/school-year-periods', title: 'School Year Periods' },
      { route: '/programs', title: 'Programs' },
      { route: '/levels', title: 'Levels' },
      { route: '/specializations', title: 'Specializations' },
      
      // Planning
      { route: '/planning', title: 'Planning' },
      { route: '/planning-session-types', title: 'Planning Session Types' },
      
      // Student-related
      { route: '/student-presence', title: 'Student Presence' },
      { route: '/student-reports', title: 'Student Reports' },
      { route: '/student-report-details', title: 'Student Report Details' },
      { route: '/student-payments', title: 'Student Payments' },
      { route: '/level-pricings', title: 'Level Pricings' },
      { route: '/student-attestations', title: 'Student Attestations' },
      { route: '/attestations', title: 'Attestations' },
      { route: '/student-diplomes', title: 'Student Diplomes' },
      { route: '/student-contacts', title: 'Student Contacts' },
      { route: '/student-link-types', title: 'Student Link Types' },
      { route: '/student-notes', title: 'Student Notes' },
    ];

    // Optimized: Get all existing pages in one query
    const routes = systemPages.map(p => p.route);
    const existingPages = await this.pageRepository.find({
      where: { route: In(routes) },
    });

    const existingRoutes = new Set(existingPages.map(p => p.route));
    
    // Find pages that need to be created
    const pagesToCreate = systemPages.filter(
      pageData => !existingRoutes.has(pageData.route)
    );

    let createdCount = 0;
    const skippedCount = existingPages.length;

    // Batch create missing pages
    if (pagesToCreate.length > 0) {
      const newPages = pagesToCreate.map(pageData =>
        this.pageRepository.create({
          title: pageData.title,
          route: pageData.route,
        })
      );
      
      // Save all at once (TypeORM will batch insert)
      const savedPages = await this.pageRepository.save(newPages);
      createdCount = savedPages.length;
      
      this.logger.log(
        `✅ Created ${createdCount} system pages in batch: ${pagesToCreate.map(p => p.route).join(', ')}`
      );
    }

    if (createdCount > 0) {
      this.logger.log(`✅ Pages seeder completed: ${createdCount} created, ${skippedCount} already existed`);
    } else {
      this.logger.debug(`✅ Pages seeder completed: All ${skippedCount} pages already exist`);
    }
  }
}
