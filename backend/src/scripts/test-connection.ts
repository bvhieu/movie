import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testConnection() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'changeMeStrongPassword',
    database: process.env.DATABASE_NAME || 'moviedb',
    synchronize: false,
    logging: true,
  });

  try {
    console.log('🔌 Attempting to connect to database...');
    await dataSource.initialize();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await dataSource.query('SELECT NOW()');
    console.log('📅 Database time:', result[0].now);
    
    await dataSource.destroy();
    console.log('🔌 Connection closed');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();
