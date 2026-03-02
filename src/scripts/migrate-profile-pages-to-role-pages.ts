import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Migration script to migrate data from profile_pages to role_pages
 * 
 * This script:
 * 1. Finds all roles by their code (admin, finance, student, etc.)
 * 2. Migrates profile_pages entries to role_pages using role_id
 * 3. Drops the profile_pages table
 * 
 * Run with: npx ts-node src/scripts/migrate-profile-pages-to-role-pages.ts
 */
async function migrateProfilePagesToRolePages() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edusol_25',
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    // Step 1: Get all profile-to-role mappings
    console.log('\n📋 Step 1: Fetching role mappings...');
    const roles = await queryRunner.query(`
      SELECT id, code, company_id 
      FROM roles 
      WHERE company_id IS NULL
    `);

    const roleMap = new Map<string, number>();
    roles.forEach((role: any) => {
      roleMap.set(role.code, role.id);
    });

    console.log(`Found ${roles.length} system roles:`, roles.map((r: any) => r.code).join(', '));

    // Step 2: Get all profile_pages entries
    console.log('\n📋 Step 2: Fetching profile_pages entries...');
    const profilePages = await queryRunner.query(`
      SELECT profile, page_id, company_id, created_at
      FROM profile_pages
    `);

    console.log(`Found ${profilePages.length} profile_pages entries to migrate`);

    if (profilePages.length === 0) {
      console.log('⚠️  No profile_pages entries found. Skipping migration.');
      await queryRunner.release();
      await dataSource.destroy();
      return;
    }

    // Step 3: Migrate data to role_pages
    console.log('\n🔄 Step 3: Migrating data to role_pages...');
    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const profilePage of profilePages) {
      const roleId = roleMap.get(profilePage.profile);

      if (!roleId) {
        console.warn(`⚠️  Skipping profile '${profilePage.profile}' - role not found`);
        skipped++;
        continue;
      }

      try {
        // Check if entry already exists in role_pages
        const existing = await queryRunner.query(
          `SELECT * FROM role_pages 
           WHERE role_id = ? AND page_id = ? AND company_id = ?`,
          [roleId, profilePage.page_id, profilePage.company_id]
        );

        if (existing.length > 0) {
          console.log(`⏭️  Entry already exists: role_id=${roleId}, page_id=${profilePage.page_id}, company_id=${profilePage.company_id}`);
          skipped++;
          continue;
        }

        // Insert into role_pages
        await queryRunner.query(
          `INSERT INTO role_pages (role_id, page_id, company_id, created_at)
           VALUES (?, ?, ?, ?)`,
          [roleId, profilePage.page_id, profilePage.company_id, profilePage.created_at || new Date()]
        );

        migrated++;
        if (migrated % 10 === 0) {
          console.log(`  Migrated ${migrated} entries...`);
        }
      } catch (error: any) {
        console.error(`❌ Error migrating entry:`, error.message);
        errors++;
      }
    }

    console.log(`\n✅ Migration complete:`);
    console.log(`   - Migrated: ${migrated} entries`);
    console.log(`   - Skipped: ${skipped} entries`);
    console.log(`   - Errors: ${errors} entries`);

    // Step 4: Drop profile_pages table
    console.log('\n🗑️  Step 4: Dropping profile_pages table...');
    try {
      await queryRunner.query(`DROP TABLE IF EXISTS profile_pages`);
      console.log('✅ profile_pages table dropped successfully');
    } catch (error: any) {
      console.error(`❌ Error dropping profile_pages table:`, error.message);
      throw error;
    }

    await queryRunner.release();
    await dataSource.destroy();
    console.log('\n✅ Migration script completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateProfilePagesToRolePages();
