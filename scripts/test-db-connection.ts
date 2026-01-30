import { prisma } from '../lib/db';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Count users
    const userCount = await prisma.user.count();
    console.log(`\n📊 Total users in database: ${userCount}`);
    
    // List all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        roleId: true,
        teamId: true,
      },
      take: 10,
    });
    
    console.log('\n👥 Users:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) - Active: ${user.isActive}`);
    });
    
    // Check roles
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    
    console.log('\n🔐 Roles:');
    roles.forEach(role => {
      console.log(`  - ${role.name} (${role.id})`);
    });
    
    // Check for specific user
    const specificUser = await prisma.user.findUnique({
      where: { email: 'disha.bisht@cimconautomation.com' },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        password: true,
      },
    });
    
    if (specificUser) {
      console.log('\n🔍 Found user: disha.bisht@cimconautomation.com');
      console.log('  Active:', specificUser.isActive);
      console.log('  Has password:', !!specificUser.password);
      console.log('  Password hash length:', specificUser.password?.length);
    } else {
      console.log('\n❌ User disha.bisht@cimconautomation.com not found');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
