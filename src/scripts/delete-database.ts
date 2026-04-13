import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config();

async function deleteDatabase() {
  // Create a DataSource with the same configuration as app.module.ts
  // Note: We don't actually need entities loaded for this operation
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edusol_25',
    // Empty entities array since we're only querying table names
    entities: [],
    synchronize: false,
  });

  try {
    console.log('Connecting to database...');
    await dataSource.initialize();
    console.log('Connected successfully!');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    // Get all table names
    const tables = await queryRunner.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_TYPE = 'BASE TABLE'
    `, [process.env.DB_NAME || 'edusol_25']);

    if (tables.length === 0) {
      console.log('No tables found in the database.');
      await queryRunner.release();
      await dataSource.destroy();
      return;
    }

    console.log(`Found ${tables.length} tables.`);
    console.log('\n⚠️  WARNING: This will delete ALL data from the database!');
    console.log('Tables to be cleared:');
    tables.forEach((table: { TABLE_NAME: string }) => {
      console.log(`  - ${table.TABLE_NAME}`);
    });

    // Disable foreign key checks
    console.log('\nDisabling foreign key checks...');
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');

    // Truncate all tables
    console.log('\nDeleting data from all tables...');
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      try {
        await queryRunner.query(`TRUNCATE TABLE \`${tableName}\``);
        console.log(`  ✓ Cleared: ${tableName}`);
      } catch (error) {
        console.error(`  ✗ Error clearing ${tableName}:`, error.message);
      }
    }

    // Re-enable foreign key checks
    console.log('\nRe-enabling foreign key checks...');
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');

    await queryRunner.release();
    await dataSource.destroy();

    console.log('\n✅ Database cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting database:', error);
    process.exit(1);
  }
}

// Run the script
deleteDatabase();

