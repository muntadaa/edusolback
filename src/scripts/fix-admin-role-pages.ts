import 'dotenv/config';
import { DataSource, In } from 'typeorm';
import { Page } from '../pages/entities/page.entity';
import { RolePage } from '../pages/entities/role-page.entity';
import { Role } from '../roles/entities/role.entity';

async function fixAdminRolePages() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edusol_25',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false,
  });

  try {
    console.log('🔄 Fixing admin role pages for all companies...\n');
    console.log('Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected successfully!\n');

    const pageRepository = dataSource.getRepository(Page);
    const rolePageRepository = dataSource.getRepository(RolePage);
    const roleRepository = dataSource.getRepository(Role);

    // Define the default pages that admins should have access to
    const defaultAdminRoutes = [
      '/settings',
      '/settings/access',
      '/settings/roles',
      '/settings/colors',
      '/settings/company',
      '/settings/user',
      '/settings/types',
      '/settings/types/link',
      '/settings/types/classroom',
      '/settings/types/planning',
      '/settings/types/class-rooms',
      '/settings/pdf-layout',
      '/settings/events',
      '/settings/required-documents',
    ];

    // Find all admin roles (system roles and company-specific)
    const adminRoles = await roleRepository.find({
      where: { code: 'admin' },
    });

    if (adminRoles.length === 0) {
      console.log('⚠️  No admin roles found in the database.');
      await dataSource.destroy();
      process.exit(0);
    }

    console.log(`Found ${adminRoles.length} admin role(s):\n`);
    adminRoles.forEach(role => {
      console.log(`  - Role ID: ${role.id}, Company ID: ${role.company_id || 'NULL (system)'}`);
    });
    console.log('');

    // Find all required pages
    const pages = await pageRepository.find({
      where: { route: In(defaultAdminRoutes) },
    });

    const pageMap = new Map(pages.map(page => [page.route, page]));
    
    console.log('📄 Required pages:');
    for (const route of defaultAdminRoutes) {
      const page = pageMap.get(route);
      if (page) {
        console.log(`  ✅ ${route} (ID: ${page.id})`);
      } else {
        console.log(`  ❌ ${route} - NOT FOUND in database`);
      }
    }
    console.log('');

    // Get all companies from the database
    const companies = await dataSource.query(`
      SELECT DISTINCT id FROM companies
    `);

    const companyIds = companies.map((c: any) => c.id);
    
    console.log(`Found ${companyIds.length} company(ies) in the database\n`);

    let totalFixed = 0;
    let totalSkipped = 0;

    // Fix admin role pages for each company
    for (const companyId of companyIds) {
      // Find admin role (system role with company_id = null, used for all companies)
      const adminRole = adminRoles.find(r => r.company_id === null);

      if (!adminRole) {
        console.log(`⚠️  No system admin role found, skipping company ${companyId}...`);
        continue;
      }

      console.log(`\n🔧 Fixing admin role ${adminRole.id} for company ${companyId}...`);

      // Get current page assignments
      const currentAssignments = await rolePageRepository.find({
        where: {
          role_id: adminRole.id,
          company_id: companyId,
        },
        relations: ['page'],
      });

      const currentRoutes = currentAssignments.map(a => a.page.route);
      console.log(`  Current pages: ${currentRoutes.length > 0 ? currentRoutes.join(', ') : 'none'}`);

      // Check which pages are missing
      const missingRoutes = defaultAdminRoutes.filter(route => !currentRoutes.includes(route));
      
      if (missingRoutes.length === 0 && currentRoutes.length === defaultAdminRoutes.length) {
        console.log(`  ✅ All required pages already assigned, skipping...`);
        totalSkipped++;
        continue;
      }

      if (missingRoutes.length > 0) {
        console.log(`  Missing pages: ${missingRoutes.join(', ')}`);
      }

      // Remove all existing assignments
      if (currentAssignments.length > 0) {
        await rolePageRepository.remove(currentAssignments);
        console.log(`  🗑️  Removed ${currentAssignments.length} existing assignment(s)`);
      }

      // Create new assignments for all required pages
      const newAssignments: RolePage[] = [];
      for (const route of defaultAdminRoutes) {
        const page = pageMap.get(route);
        if (page) {
          const assignment = rolePageRepository.create({
            role_id: adminRole.id,
            page_id: page.id,
            company_id: companyId,
          });
          newAssignments.push(assignment);
        } else {
          console.log(`  ⚠️  Warning: Page '${route}' not found, skipping...`);
        }
      }

      if (newAssignments.length > 0) {
        await rolePageRepository.save(newAssignments);
        const assignedRoutes = newAssignments.map(a => {
          const page = pages.find(p => p.id === a.page_id);
          return page?.route;
        }).filter(Boolean).join(', ');
        
        console.log(`  ✅ Assigned ${newAssignments.length} pages: ${assignedRoutes}`);
        totalFixed++;
      } else {
        console.log(`  ❌ No pages could be assigned (all pages missing from database)`);
      }
    }

    await dataSource.destroy();

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Fix completed!`);
    console.log(`   Fixed: ${totalFixed} company(ies)`);
    console.log(`   Skipped: ${totalSkipped} company(ies) (already correct)`);
    console.log('='.repeat(60) + '\n');
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error fixing admin role pages:', error.message);
    if (error.sql) {
      console.error('SQL:', error.sql);
    }
    process.exit(1);
  }
}

// Run the fix
fixAdminRolePages();
