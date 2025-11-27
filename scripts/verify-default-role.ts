import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDefaultRole() {
  try {
    console.log('🔍 Checking for User/Employee role...\n');

    const userRole = await prisma.role.findUnique({
      where: { name: 'User/Employee' },
    });

    if (!userRole) {
      console.log('❌ User/Employee role NOT found!');
      console.log('⚠️  This role is required for registration to work.');
      console.log('\n💡 Creating User/Employee role...');

      const newRole = await prisma.role.create({
        data: {
          name: 'User/Employee',
          description: 'Standard user with limited access',
        },
      });

      console.log('✅ User/Employee role created:', newRole.id);
    } else {
      console.log('✅ User/Employee role found:', userRole.id);
      console.log('   Name:', userRole.name);
      console.log('   Description:', userRole.description);
    }

    // Check all roles
    const allRoles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
    });

    console.log('\n📊 All Roles in Database:');
    allRoles.forEach((role, index) => {
      console.log(`   ${index + 1}. ${role.name} (${role.id})`);
    });

    // Check teams count
    const teamsCount = await prisma.team.count();
    console.log(`\n📊 Total Teams Available: ${teamsCount}`);

    console.log('\n✅ Registration is ready!');
    console.log('   • Default role: User/Employee');
    console.log('   • Teams available for selection: ' + teamsCount);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDefaultRole();
