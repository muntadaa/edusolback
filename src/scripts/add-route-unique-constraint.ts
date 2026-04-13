import 'dotenv/config';
import { DataSource } from 'typeorm';

async function addUniqueConstraint() {
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
    console.log('Adding unique constraint on route...');
    await dataSource.initialize();
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    // Check if constraint already exists
    const indexExists = await queryRunner.query(`
      SELECT COUNT(*) as count
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'pages' 
      AND INDEX_NAME LIKE '%route%'
      AND NON_UNIQUE = 0
    `, [process.env.DB_NAME || 'edusol_25']);

    if (indexExists[0].count === 0) {
      await queryRunner.query(`
        ALTER TABLE pages ADD UNIQUE INDEX IDX_pages_route_unique (route)
      `);
      console.log('✅ Unique constraint added successfully!');
    } else {
      console.log('ℹ️  Unique constraint already exists');
    }

    await queryRunner.release();
    await dataSource.destroy();
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addUniqueConstraint();
