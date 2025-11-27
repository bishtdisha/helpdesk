import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserRole() {
  try {
    // Find Disha's user account
    const disha = await prisma.user.findUnique({
      where: { email: 'disha.bisht@cimconautomation.com' },
      include: {
        role: true,
        team: true,
        teamLeaderships: {
          include: {
            team: true
          }
        }
      }
    });

    if (!disha) {
      console.log('❌ Disha user not found');
      return;
    }

    console.log('\n📊 Current User Data:');
    console.log('Name:', disha.name);
    console.log('Email:', disha.email);
    console.log('Role:', disha.role?.name || 'No role');
    console.log('Team:', disha.team?.name || 'No team');
    console.log('Team Leaderships:', disha.teamLeaderships.map(tl => tl.team.name).join(', ') || 'None');

    // Get Admin role
    const adminRole = await prisma.role.findUnique({
      where: { name: 'Admin/Manager' }
    });

    if (!adminRole) {
      console.log('\n❌ Admin/Manager role not found in database');
      return;
    }

    console.log('\n✅ Admin/Manager role found:', adminRole.id);

    // Check if update is needed
    if (disha.role?.name !== 'Admin/Manager') {
      console.log('\n⚠️  User role needs to be updated to Admin/Manager');
      console.log('Current role:', disha.role?.name);
      console.log('Should be: Admin/Manager');
    } else {
      console.log('\n✅ User already has Admin/Manager role');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRole();
