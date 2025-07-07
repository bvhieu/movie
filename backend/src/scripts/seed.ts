import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { seedDatabase } from '../database/seed';

async function runSeed() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    
    console.log('🌱 Starting database seeding...');
    await seedDatabase(dataSource);
    console.log('✅ Database seeding completed successfully!');
    
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

runSeed();
