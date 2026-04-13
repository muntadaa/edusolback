import 'dotenv/config';
import { DataSource } from 'typeorm';

async function checkIndexes() {
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
    await dataSource.initialize();
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    const indexes = await queryRunner.query(`
      SHOW INDEXES FROM pages WHERE Column_name = 'route'
    `);

    console.log('Indexes on route column:');
    if (indexes.length === 0) {
      console.log('  No indexes found');
    } else {
      indexes.forEach((idx: any) => {
        console.log(`  - ${idx.Key_name} (unique: ${idx.Non_unique === 0})`);
      });
    }

    // Drop the TypeORM-generated index if it exists and create our named one
    const typeormIndex = indexes.find((idx: any) => idx.Key_name.includes('8a137855'));
    if (typeormIndex) {
      console.log(`\nDropping TypeORM index: ${typeormIndex.Key_name}`);
      await queryRunner.query(`ALTER TABLE pages DROP INDEX ${typeormIndex.Key_name}`);
    }

    // Ensure our named unique index exists
    const namedIndex = indexes.find((idx: any) => idx.Key_name === 'IDX_pages_route_unique');
    if (!namedIndex) {
      console.log('\nCreating named unique index...');
      await queryRunner.query(`ALTER TABLE pages ADD UNIQUE INDEX IDX_pages_route_unique (route)`);
      console.log('✅ Created IDX_pages_route_unique');
    } else {
      console.log('\n✅ Named unique index already exists');
    }

    await queryRunner.release();
    await dataSource.destroy();
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkIndexes();
