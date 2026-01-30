import { config } from 'dotenv';
config();

import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { seedAdmin } from './seeders/admin.seeder';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'alaml',
  entities: [User],
  synchronize: true,
});

async function runSeeders() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    await seedAdmin(AppDataSource);

    await AppDataSource.destroy();
    console.log('Seeding completed');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

runSeeders();
