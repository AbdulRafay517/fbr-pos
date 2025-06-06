import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '..', '.env') });

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    // Try to connect to the database
    await prisma.$connect();
    console.log('✅ Successfully connected to the database!');
    
    // Try a simple query
    const userCount = await prisma.user.count();
    console.log(`Current user count: ${userCount}`);
    
  } catch (error) {
    console.error('❌ Failed to connect to the database:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();