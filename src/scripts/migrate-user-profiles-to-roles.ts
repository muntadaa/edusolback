import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Migration script to migrate user profiles to user_roles
 * 
 * This script:
 * 1. Finds all users with profile column
 * 2. Finds corresponding role by profile code
 * 3. Creates user_roles entries
 * 4. Removes profile column from users table (optional, commented out for safety)
 * 
 * Run with: npx ts-node src/scripts/migrate-user-profiles-to-roles.ts
 */
async function migrateUserProfilesToRoles() {
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

    // Step 2: Check if users table has profile column
    console.log('\n📋 Step 2: Checking users table structure...');
    const columns = await queryRunner.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'profile'
    `, [process.env.DB_NAME || 'edusol_25']);

    if (columns.length === 0) {
      console.log('⚠️  profile column not found in users table. Migration may have already been run.');
      await queryRunner.release();
      await dataSource.destroy();
      return;
    }

    // Step 3: Get all users with profiles
    console.log('\n📋 Step 3: Fetching users with profiles...');
    const users = await queryRunner.query(`
      SELECT id, profile, company_id
      FROM users
      WHERE profile IS NOT NULL AND profile != ''
    `);

    console.log(`Found ${users.length} users with profiles to migrate`);

    if (users.length === 0) {
      console.log('⚠️  No users with profiles found. Skipping migration.');
      await queryRunner.release();
      await dataSource.destroy();
      return;
    }

    // Step 4: Migrate user profiles to user_roles
    console.log('\n🔄 Step 4: Migrating user profiles to user_roles...');
    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      const roleId = roleMap.get(user.profile);

      if (!roleId) {
        console.warn(`⚠️  Skipping user ${user.id} with profile '${user.profile}' - role not found`);
        skipped++;
        continue;
      }

      try {
        // Check if entry already exists in user_roles
        const existing = await queryRunner.query(
          `SELECT * FROM user_roles 
           WHERE user_id = ? AND role_id = ? AND company_id = ?`,
          [user.id, roleId, user.company_id]
        );

        if (existing.length > 0) {
          console.log(`⏭️  User ${user.id} already has role ${roleId}`);
          skipped++;
          continue;
        }

        // Insert into user_roles
        await queryRunner.query(
          `INSERT INTO user_roles (user_id, role_id, company_id)
           VALUES (?, ?, ?)`,
          [user.id, roleId, user.company_id]
        );

        migrated++;
        if (migrated % 10 === 0) {
          console.log(`  Migrated ${migrated} users...`);
        }
      } catch (error: any) {
        console.error(`❌ Error migrating user ${user.id}:`, error.message);
        errors++;
      }
    }

    console.log(`\n✅ Migration complete:`);
    console.log(`   - Migrated: ${migrated} users`);
    console.log(`   - Skipped: ${skipped} users`);
    console.log(`   - Errors: ${errors} users`);

    // Step 5: Remove profile column (commented out for safety - uncomment after verifying migration)
    console.log('\n⚠️  Step 5: Profile column removal (SKIPPED for safety)');
    console.log('   To remove the profile column, uncomment the code below and run again:');
    console.log(`
    try {
      await queryRunner.query(\`ALTER TABLE users DROP COLUMN profile\`);
      console.log('✅ profile column removed from users table');
    } catch (error: any) {
      console.error('❌ Error removing profile column:', error.message);
    }
    `);

    // Uncomment the following block to actually remove the profile column:
    /*
    try {
      await queryRunner.query(`ALTER TABLE users DROP COLUMN profile`);
      console.log('✅ profile column removed from users table');
    } catch (error: any) {
      console.error('❌ Error removing profile column:', error.message);
    }
    */

    await queryRunner.release();
    await dataSource.destroy();
    console.log('\n✅ Migration script completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify the migrated data in user_roles table');
    console.log('   2. Uncomment the profile column removal code if everything looks good');
    console.log('   3. Run the script again to remove the profile column');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateUserProfilesToRoles();
