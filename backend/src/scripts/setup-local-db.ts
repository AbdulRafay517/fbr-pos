import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function setupLocalDatabase() {
  try {
    console.log('Setting up local database...');

    // Create admin user
    const adminData = {
      email: 'admin@local.com',
      password: await bcrypt.hash('admin123', 10),
      name: 'Local Admin',
      role: 'ADMIN' as const,
    };

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminData.email },
    });

    if (!existingAdmin) {
      const admin = await prisma.user.create({
        data: adminData,
      });
      console.log('Admin user created:', admin.email);
    } else {
      console.log('Admin user already exists');
    }

    // Create test tax rules
    const provinces = ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Federal'];
    
    for (const province of provinces) {
      const existingRule = await prisma.taxRule.findUnique({
        where: { province },
      });

      if (!existingRule) {
        const taxRule = await prisma.taxRule.create({
          data: {
            province,
            percentage: 15.0, // Default tax rate
            isActive: true,
          },
        });
        console.log(`Tax rule created for ${province}`);
      } else {
        console.log(`Tax rule already exists for ${province}`);
      }
    }

    console.log('Local database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up local database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupLocalDatabase(); 