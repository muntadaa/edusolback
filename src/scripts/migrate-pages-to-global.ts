import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

async function migratePagesToGlobal() {
  // Create a DataSource with the same configuration as app.module.ts
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edusol_25',
    entities: [],
    synchronize: false,
  });

  try {
    console.log('🔄 Starting migration: Making pages global...\n');
    console.log('Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected successfully!\n');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    // Step 1: Check for duplicate routes
    console.log('📊 Checking for duplicate routes...');
    const duplicates = await queryRunner.query(`
      SELECT route, COUNT(*) as count
      FROM pages
      GROUP BY route
      HAVING count > 1
    `);

    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} routes with duplicates:\n`);
      duplicates.forEach((dup: any) => {
        console.log(`   - ${dup.route}: ${dup.count} entries`);
      });
      console.log('\n');

      // Step 2: Create temporary table with pages to keep
      console.log('📋 Identifying pages to keep (lowest ID per route)...');
      await queryRunner.query(`
        CREATE TEMPORARY TABLE IF NOT EXISTS pages_to_keep AS
        SELECT route, MIN(id) as keep_page_id
        FROM pages
        GROUP BY route
      `);

      // Step 3: Create mapping table
      console.log('🗺️  Creating page ID mapping...');
      await queryRunner.query(`
        CREATE TEMPORARY TABLE IF NOT EXISTS page_id_mapping AS
        SELECT p.id as old_page_id, ptk.keep_page_id as new_page_id
        FROM pages p
        INNER JOIN pages_to_keep ptk ON p.route = ptk.route
      `);

      // Step 4: Update role_pages references
      console.log('🔗 Updating role_pages references...');
      const updateResult = await queryRunner.query(`
        UPDATE role_pages rp
        INNER JOIN page_id_mapping pim ON rp.page_id = pim.old_page_id
        SET rp.page_id = pim.new_page_id
        WHERE rp.page_id != pim.new_page_id
      `);
      console.log(`   ✓ Updated ${updateResult.affectedRows} role_pages references\n`);

      // Step 5: Delete duplicate pages
      console.log('🗑️  Deleting duplicate pages...');
      const deleteResult = await queryRunner.query(`
        DELETE p1 FROM pages p1
        INNER JOIN pages_to_keep ptk ON p1.route = ptk.route
        WHERE p1.id != ptk.keep_page_id
      `);
      console.log(`   ✓ Deleted ${deleteResult.affectedRows} duplicate pages\n`);
    } else {
      console.log('✅ No duplicate routes found. All routes are unique.\n');
    }

    // Step 6: Remove foreign key constraint on company_id
    console.log('🔓 Removing foreign key constraint...');
    try {
      const fkConstraints = await queryRunner.query(`
        SELECT CONSTRAINT_NAME 
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'pages' 
        AND COLUMN_NAME = 'company_id'
        AND REFERENCED_TABLE_NAME IS NOT NULL
      `, [process.env.DB_NAME || 'edusol_25']);

      for (const fk of fkConstraints) {
        await queryRunner.query(`ALTER TABLE pages DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
        console.log(`   ✓ Dropped constraint: ${fk.CONSTRAINT_NAME}`);
      }
    } catch (error: any) {
      if (!error.message.includes('does not exist')) {
        console.log(`   ⚠️  Could not drop constraint (may not exist): ${error.message}`);
      }
    }
    console.log('');

    // Step 7: Remove company_id column
    console.log('🗑️  Removing company_id column from pages table...');
    try {
      // Check if column exists first
      const columnExists = await queryRunner.query(`
        SELECT COUNT(*) as count
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'pages'
        AND COLUMN_NAME = 'company_id'
      `, [process.env.DB_NAME || 'edusol_25']);

      if (columnExists[0].count > 0) {
        await queryRunner.query(`ALTER TABLE pages DROP COLUMN company_id`);
        console.log('   ✓ Removed company_id column\n');
      } else {
        console.log('   ℹ️  company_id column does not exist (may have been removed already)\n');
      }
    } catch (error: any) {
      console.error('   ❌ Error removing company_id column:', error.message);
      if (error.message.includes('does not exist') || error.message.includes('Unknown column') || error.message.includes('check that it exists')) {
        console.log('   ℹ️  Column may have already been removed. Continuing...\n');
      } else {
        throw error;
      }
    }

    // Step 8: Add unique constraint on route
    console.log('🔒 Adding unique constraint on route column...');
    try {
      // Check if unique index already exists
      const indexExists = await queryRunner.query(`
        SELECT COUNT(*) as count
        FROM information_schema.STATISTICS 
        WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'pages' 
        AND INDEX_NAME = 'IDX_pages_route_unique'
      `, [process.env.DB_NAME || 'edusol_25']);

      if (indexExists[0].count === 0) {
        await queryRunner.query(`
          ALTER TABLE pages ADD UNIQUE INDEX IDX_pages_route_unique (route)
        `);
        console.log('   ✓ Added unique constraint on route\n');
      } else {
        console.log('   ℹ️  Unique constraint already exists\n');
      }
    } catch (error: any) {
      if (error.message.includes('Duplicate entry')) {
        console.error('   ❌ ERROR: Cannot add unique constraint - duplicate routes still exist!');
        console.error('   Please check the database for duplicate routes and remove them manually.\n');
        throw error;
      } else if (error.message.includes('Duplicate key name')) {
        console.log('   ℹ️  Unique constraint already exists\n');
      } else {
        throw error;
      }
    }

    // Clean up temporary tables
    try {
      await queryRunner.query('DROP TEMPORARY TABLE IF EXISTS pages_to_keep');
      await queryRunner.query('DROP TEMPORARY TABLE IF EXISTS page_id_mapping');
    } catch (error) {
      // Ignore errors for temp table cleanup
    }

    await queryRunner.release();
    await dataSource.destroy();

    console.log('✅ Migration completed successfully!');
    console.log('   Pages are now global and shared across all companies.\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.sql) {
      console.error('SQL:', error.sql);
    }
    process.exit(1);
  }
}

// Run the migration
migratePagesToGlobal();
