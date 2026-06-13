import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from './config.ts';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.DB_HOST,
  port: config.DB_PORT,
  username: config.DB_USERNAME,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  synchronize: config.DB_SYNCHRONIZE,
  logging: config.DB_LOGGING,
  entities: [`${import.meta.dir}/../modules/**/entities/*.entity.{ts,js}`],
  migrations: [`${import.meta.dir}/../migrations/*.{ts,js}`],
  subscribers: [],
});

/**
 * Initialize database connection with retry logic.
 */
export async function initializeDatabase(): Promise<DataSource> {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 3000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await AppDataSource.initialize();
      console.log('✅ Database connected successfully');
      return AppDataSource;
    } catch (error) {
      console.error(`❌ Database connection attempt ${attempt}/${MAX_RETRIES} failed:`, error);
      if (attempt === MAX_RETRIES) {
        throw new Error('Failed to connect to database after maximum retries');
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
  throw new Error('Unreachable');
}
